# -*- coding: utf-8 -*-
"""HTTP 服务：静态资源 + REST API + 认证 / 会话 / 权限强制（标准库实现，零外部依赖）。

启动顺序很重要：
  1) config.ensure_dirs()  目录就绪
  2) db.init()             主库建表 + 种子（必须先于 api 扩展导入）
  3) api 导入              业务路由与扩展初始化
  4) auth.init()           认证表、角色权限矩阵、初始管理员
  5) 合并路由              auth 路由优先（登录/健康检查/用户管理等）
"""
import os
import re
import sys
import json
import time
import mimetypes
import argparse
import traceback
import datetime as dt
import threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web")
sys.path.insert(0, HERE)

import config as CFG

CFG.ensure_dirs()
import db as D

D.init()
import api as A
import auth as AU
from download_token import verify as _dl_verify

AUTH_INIT = AU.init()
A.ROUTES = AU.ROUTES + A.ROUTES

MIME = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2",
        ".ico": "image/x-icon", ".map": "application/json", ".webmanifest": "application/manifest+json",
        ".txt": "text/plain; charset=utf-8"}

MAX_BODY = CFG.MAX_BODY
MAX_CONN = CFG.MAX_CONN
_CONN_SEM = threading.BoundedSemaphore(MAX_CONN)

CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; "
       "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "font-src 'self' data:; connect-src 'self'; media-src 'self'; "
       "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'")

# 免登录接口：健康检查、登录、退出（幂等）
PUBLIC_API = ("/api/health", "/api/auth/login", "/api/auth/logout")
# 首次登录强制改密时仍可访问的接口
MUST_CHANGE_ALLOW = ("/api/auth/me", "/api/auth/change-password", "/api/auth/logout",
                     "/api/auth/login", "/api/health")
PUBLIC_STATIC = ("/login.html", "/favicon.ico", "/robots.txt")

_LOG_LOCK = threading.Lock()


def _write_access_log(line):
    if not CFG.ACCESS_LOG:
        return
    try:
        fp = os.path.join(CFG.LOG_DIR, "access.log")
        with _LOG_LOCK:
            if os.path.exists(fp) and os.path.getsize(fp) > 20 * 1024 * 1024:
                os.replace(fp, fp + ".1")
            with open(fp, "a", encoding="utf-8") as f:
                f.write(line)
    except Exception:
        pass


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "TianShu/" + CFG.APP_VERSION
    sys_version = ""
    timeout = CFG.REQUEST_TIMEOUT      # 空闲/慢速连接超时，避免 keep-alive 线程永久占用

    def handle(self):
        if not _CONN_SEM.acquire(blocking=False):
            try:
                self._send({"code": 4290, "message": "并发连接数已达上限", "data": None}, code=503)
            except Exception:
                pass
            return
        try:
            BaseHTTPRequestHandler.handle(self)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass
        finally:
            _CONN_SEM.release()

    def log_message(self, fmt, *args):
        if os.environ.get("PLATFORM_LOG"):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    # ------------------------------------------------ helpers
    def _headers_common(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Content-Security-Policy", CSP)
        if CFG.ENABLE_HSTS:
            self.send_header("Strict-Transport-Security", "max-age=15552000; includeSubDomains")

    def _send(self, body, ctype="application/json; charset=utf-8", code=200, extra=None, cookies=None):
        # 允许处理器返回 {"__raw__": <obj>}：原样输出（用于 OpenAPI 文档等标准格式，
        # 不能再套 {code,message,data} 外壳，否则 Postman/Swagger 无法导入）
        if isinstance(body, dict) and set(body.keys()) == {"__raw__"}:
            body = body["__raw__"]
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Headers",
                         "Content-Type, Authorization, X-API-Key, X-Session-Token, X-CSRF-Token")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS")
        self._headers_common()
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        for ck in (cookies or []):
            try:
                self.send_header(ck[0], ck[1])
            except Exception:
                pass
        self.end_headers()
        if self._head:
            return
        try:
            self.wfile.write(body)
        except (ConnectionResetError, BrokenPipeError):
            pass

    def _file(self, path, extra=None, status=200):
        if not os.path.isfile(path):
            self._send({"code": 404, "message": "not found", "data": None}, code=404)
            return
        ext = os.path.splitext(path)[1].lower()
        with open(path, "rb") as f:
            data = f.read()
        self._send(data, MIME.get(ext, mimetypes.guess_type(path)[0] or "application/octet-stream"),
                   code=status, extra=extra)

    def _redirect(self, location, code=302):
        html = ("<!doctype html><meta charset=\"utf-8\"><title>跳转中</title>"
                "<p>正在跳转到 <a href=\"%s\">%s</a>…</p>" % (location, location))
        self._send(html, "text/html; charset=utf-8", code, extra={"Location": location})

    def _client_ip(self):
        """返回真实客户端 IP：仅在显式信任反向代理时读取代理头，否则用 socket 地址。"""
        if getattr(CFG, "TRUST_PROXY", False):
            xff = (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
            if xff:
                return xff
            xr = (self.headers.get("X-Real-IP") or "").strip()
            if xr:
                return xr
        return (self.client_address[0] if self.client_address else "127.0.0.1")

    def _ident(self):
        try:
            return AU.authenticate(dict(self.headers))
        except Exception:
            traceback.print_exc()
            return None, "认证服务异常"

    # ------------------------------------------------ verbs
    _head = False

    def do_OPTIONS(self):
        self._send(b"", "text/plain", 204)

    def do_HEAD(self):
        """HEAD 与 GET 返回相同的响应头（健康检查 / 反向代理探活常用）。"""
        self._head = True
        try:
            self._route("GET")
        finally:
            self._head = False

    def do_GET(self):
        self._route("GET")

    def do_POST(self):
        self._route("POST")

    def do_DELETE(self):
        self._route("DELETE")

    def do_PUT(self):
        self._route("PUT")

    def do_PATCH(self):
        self._route("PUT")

    def _route(self, method):
        u = urlparse(self.path)
        path, qs = unquote(u.path), parse_qs(u.query)
        q = {k: v[0] for k, v in qs.items()}
        ip = self._client_ip()
        loopback = ip in ("127.0.0.1", "::1", "localhost")
        # Host 白名单：绑定回环时只接受本机/已声明域名，防 DNS rebinding；
        # 反代场景（PLATFORM_TRUST_PROXY=1）或显式 PLATFORM_ALLOWED_HOSTS 放行。
        bind_host = (self.server.server_address[0] if self.server.server_address else "127.0.0.1")
        host_hdr = (self.headers.get("Host") or "").strip()
        if CFG.HOST_CHECK and bind_host in ("127.0.0.1", "::1", "localhost") and host_hdr \
                and not CFG.TRUST_PROXY:
            hn = host_hdr.rsplit(":", 1)[0].strip("[]").lower()
            if hn not in ("127.0.0.1", "localhost", "::1") and hn not in CFG.ALLOWED_HOSTS:
                return self._send({"code": 3053, "message": "Host 不在允许列表（仅本机/已声明域名）",
                                   "data": None})
        # 同源校验：浏览器跨站写请求（CSRF）一律拒绝
        if method in ("POST", "PUT", "DELETE", "PATCH"):
            origin = (self.headers.get("Origin") or "").strip()
            host = (self.headers.get("Host") or "").strip()
            if origin and host and urlparse(origin).netloc != host:
                return self._send({"code": 3050, "message": "跨站写请求已拒绝", "data": None})
        # 模拟靶标暴露口令，仅允许本机访问
        if path.startswith("/mock/") and not loopback:
            return self._send({"code": 3051, "message": "模拟靶标仅允许本机访问", "data": None})
        # MCP Server：除「直接本机、无代理头」的调试访问外，一律要求有效 API Key。
        # 反向代理后 client_address 恒为 127.0.0.1，不能只看 loopback，否则公网可绕过鉴权。
        _proxy_hdr = any((self.headers.get(h) or "").strip() for h in
                         ("X-Forwarded-For", "X-Real-IP", "Forwarded", "X-Forwarded-Proto"))
        if path in ("/mcp", "/mcp/") and ((not loopback) or _proxy_hdr):
            _k = (self.headers.get("X-API-Key") or "").strip()
            if not _k:
                _a = (self.headers.get("Authorization") or "").strip()
                if _a.lower().startswith("bearer "):
                    _k = _a[7:].strip()
            import api_ext as _xe
            if not _k or not _xe.check_key(_k).get("ok"):
                return self._send({"code": 3001,
                                   "message": "MCP 接口需要有效 X-API-Key / Bearer Token",
                                   "data": None})
        # 密钥签发与鉴权策略：认证启用后由 RBAC 收敛为管理员权限（open/admin 资源），
        # 并全量审计；认证关闭（仅本机排障）时退回"仅本机"限制。
        if CFG.AUTH_MODE != "on" and path in ("/api/open/keys", "/api/auth/policy") \
                and method != "GET" and not loopback:
            return self._send({"code": 3052,
                               "message": "认证关闭模式下密钥签发仅允许本机访问", "data": None})
        try:
            if path.startswith("/v1/"):
                # 开放网关：作用域 + IP 白名单 + TTL + 强制 HTTPS + 审计
                import api_core2 as _g
                auth = self.headers.get("Authorization") or ""
                key = (self.headers.get("X-API-Key") or "").strip()
                if not key and auth.lower().startswith("bearer "):
                    key = auth[7:].strip()
                ip = self._client_ip()
                proto = (self.headers.get("X-Forwarded-Proto") or "http").lower()
                allowed, payload = _g.gate(method, path, key, ip, proto)
                if not allowed:
                    return self._send(payload)
                rest = path[len("/v1/"):]
                base = rest.split("?")[0]
                if base in ("tasks", "evals", "samples") and ("current" in q or "pageSize" in q):
                    rest = rest + "/page"
                return self._api(method, "/api/" + rest, q)
            if path.startswith("/api/") or path.startswith("/mock/") or \
                    path in ("/openapi.json", "/mcp", "/mcp/"):
                return self._api(method, path, q)
            if path.startswith("/exports/"):
                ident, why = self._ident()
                if not ident:
                    return self._send({"code": 4010, "message": why or "未登录", "data": None})
                fn2 = os.path.basename(path)
                return self._file(os.path.join(HERE, "data", "exports", fn2),
                                  {"Content-Disposition": 'attachment; filename="%s"' % fn2})
            # 页面级访问控制：控制台首页需要登录，未登录跳转登录页
            if path in ("/", "", "/index.html"):
                ident, _why = self._ident()
                if not ident:
                    if CFG.AUTH_MODE == "on":
                        return self._redirect("/login.html")
                return self._file(os.path.join(WEB, "index.html"))
            if path == "/login.html" and CFG.AUTH_MODE == "on":
                ident, _why = self._ident()
                if ident and not ident.get("must_change"):
                    return self._redirect("/")
                return self._file(os.path.join(WEB, "login.html"))
            target = os.path.normpath(os.path.join(WEB, path.lstrip("/")))
            if not (target == WEB or target.startswith(WEB + os.sep)):
                return self._send({"code": 403, "message": "forbidden", "data": None}, code=403)
            if os.path.isdir(target):
                target = os.path.join(target, "index.html")
            if not os.path.isfile(target):
                accept = (self.headers.get("Accept") or "")
                if "text/html" in accept and not os.path.splitext(target)[1]:
                    page404 = os.path.join(WEB, "404.html")
                    if os.path.isfile(page404):
                        return self._file(page404, status=404)
                return self._send({"code": 404, "message": "not found", "data": None}, code=404)
            return self._file(target)
        except Exception:
            traceback.print_exc()
            return self._send({"code": 500, "message": "server error", "data": None}, code=500)

    # ------------------------------------------------ API 调度（含认证/CSRF/改密/RBAC）
    def _api(self, method, path, q):
        t0 = time.time()
        ip = self._client_ip()
        try:
            headers = dict(self.headers)
        except Exception:
            headers = {}
        AU.begin_request(ip, headers)
        ident, ident_why = None, "未登录"
        try:
            body = None
            try:
                n = int(self.headers.get("Content-Length") or 0)
            except (TypeError, ValueError):
                return self._send({"code": 400, "message": "Content-Length 非法", "data": None},
                                  code=400)
            if n < 0:
                return self._send({"code": 400, "message": "Content-Length 非法", "data": None},
                                  code=400)
            if n > MAX_BODY:
                return self._send({"code": 413, "message": "请求体超过 %d 字节上限" % MAX_BODY,
                                   "data": None}, code=413)
            if n:
                raw = self.rfile.read(n)
                try:
                    body = json.loads(raw.decode("utf-8"))
                except Exception:
                    return self._send({"code": 400, "message": "请求体不是合法 JSON",
                                       "data": None}, code=400)

            # ---------- 认证 ----------
            ident, ident_why = AU.authenticate(headers)
            is_login = (path == "/api/auth/login")
            is_public = path in PUBLIC_API or path in ("/openapi.json", "/mcp", "/mcp/") \
                or path.startswith("/mock/")
            if not ident and not is_public:
                return self._send({"code": 4010, "message": ident_why or "未登录，请先登录",
                                   "data": {"login": "/login.html"}}, code=401)
            # ---------- CSRF 双提交 ----------
            if ident and method in ("POST", "PUT", "DELETE", "PATCH") and not is_login \
                    and not path.startswith("/mock/") and not path.startswith("/mcp"):
                if not AU.check_csrf(ident, headers):
                    return self._send({"code": 4031,
                                       "message": "CSRF 校验失败：缺少或错误的 X-CSRF-Token",
                                       "data": None}, code=403)
            # ---------- 首次登录强制改密 ----------
            if ident and ident.get("must_change") and path not in MUST_CHANGE_ALLOW:
                return self._send({"code": 4032, "message": "首次登录需先修改密码",
                                   "data": {"changePassword": "/login.html?force=1"}}, code=403)
            # ---------- 接口级 RBAC ----------
            # 导出文件下载同样走资源矩阵鉴权，避免只读角色绕过导出接口直接下载他人文件
            if ident and not is_public:
                ok, reason = AU.can(ident, method, path)
                if not ok:
                    return self._send({"code": 4030, "message": reason, "data": None}, code=403)
            # 会话滑动续期（带 Cookie 的会话每次请求重新下发剩余有效期）
            refresh = AU.refresh_cookies(ident) if not path.startswith("/api/auth/") else None

            if path.startswith("/api/download/"):  # 导出文件下载别名
                fn = os.path.basename(path)
                fp = os.path.join(HERE, "data", "exports", fn)
                if not os.path.isfile(fp):
                    return self._send({"code": 404, "message": "文件不存在或已过期", "data": None},
                                      code=404)
                if not (ident and ident.get("role_code") == "admin") and                         not _dl_verify(fn, (q.get("exp") or [""])[0], (q.get("sig") or [""])[0]):
                    return self._send({"code": 4030, "message": "下载链接无效或已过期", "data": None}, code=403)
                return self._file(fp, {"Content-Disposition": 'attachment; filename="%s"' % fn})
            for m, pat, fn in A.ROUTES:
                if m != method:
                    continue
                mt = re.match(pat, path)
                if not mt:
                    continue
                args = []
                for g in mt.groups():
                    args.append(int(g) if g.isdigit() else g)
                try:
                    res = fn(q, body, *args)
                except ValueError as e:
                    # 参数类型错误统一 400，不再冒泡成 500
                    return self._send({"code": 400, "message": "参数类型错误：%s" % str(e)[:120],
                                       "data": None}, code=400)
                except TypeError as e:
                    return self._send({"code": 400, "message": "参数错误：%s" % str(e)[:120],
                                       "data": None}, code=400)
                cookies = None
                if isinstance(res, dict) and "__cookies__" in res:
                    cookies = res.pop("__cookies__", None)
                merged = list(cookies or [])
                merged += (refresh or [])
                # 全链路行为审计（R-3.14.1-03）：所有成功的控制台写操作留痕
                try:
                    if method in ("POST", "PUT", "DELETE") and isinstance(res, dict) \
                            and res.get("code") == 0 and path.startswith("/api/") \
                            and not path.startswith("/api/auth/"):
                        A.ex("INSERT INTO audit(ts,user,action,target,ip,result,detail) "
                             "VALUES(?,?,?,?,?,?,?)",
                             (D.now(), (ident or {}).get("name") or "console",
                              method + " " + path, path, ip, "成功",
                              json.dumps({"account": (ident or {}).get("account")},
                                         ensure_ascii=False)))
                except Exception:
                    pass
                return self._send(res, cookies=merged)
            return self._send({"code": 404, "message": "接口不存在: %s" % path, "data": None})
        except Exception:
            traceback.print_exc()
            return self._send({"code": 500, "message": "server error", "data": None}, code=500)
        finally:
            try:
                ms = int((time.time() - t0) * 1000)
                who = (ident or {}).get("account") or "-"
                _write_access_log("%s\t%s\t%s\t%s\t%s\t%dms\n" % (
                    dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ip, who, method, path, ms))
            except Exception:
                pass
            AU.end_request()


def main():
    ap = argparse.ArgumentParser(description="天枢 · 大模型内容安全攻防平台")
    ap.add_argument("--port", type=int, default=CFG.PORT)
    ap.add_argument("--host", default=CFG.HOST)
    a = ap.parse_args()
    CFG.PORT = a.port
    D.init()
    D.refresh_builtin_endpoint(a.port)

    class SingleServer(ThreadingHTTPServer):
        allow_reuse_address = False
        daemon_threads = True

    srv = SingleServer((a.host, a.port), Handler)
    print("platform ready: http://%s:%d  version=%s  auth=%s" %
          (a.host, a.port, CFG.APP_VERSION, CFG.AUTH_MODE))
    if CFG.AUTH_MODE != "on":
        print("[WARN] 认证已关闭（PLATFORM_AUTH=off），仅限本机开发排障；生产环境请勿使用")
    if AUTH_INIT.get("created"):
        for c in AUTH_INIT["created"]:
            print("[INIT] 初始管理员账号：%s / %s（首次登录强制修改密码）"
                  % (c.get("account"), c.get("password")))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("bye")


if __name__ == "__main__":
    main()
