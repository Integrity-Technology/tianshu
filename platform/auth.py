# -*- coding: utf-8 -*-
"""产品化认证与权限内核。

能力：
  - 密码登录（PBKDF2-SHA256 加盐哈希）、登录失败锁定、登录限流、登录日志
  - 会话（HttpOnly Cookie / Bearer / X-Session-Token），滑动续期、过期清理、踢下线
  - CSRF 双提交校验（Cookie + X-CSRF-Token）
  - RBAC：角色→资源→动作 的允许矩阵（admin 可在线编辑），接口级强制执行
  - 用户 / 角色 / 会话 / 登录日志管理接口
  - /api/health 健康检查、/api/system/info 系统信息
  - 首次初始化：创建管理员账号并强制改密
"""
import os
import re
import json
import time
import hmac
import hashlib
import secrets
import threading
import datetime as dt

import db as D
import config as CFG

PBKDF2_ROUNDS = 210_000
ROLE_NAMES = {
    "admin": "平台管理员",
    "redteam": "红队工程师",
    "blueteam": "蓝队工程师",
    "judge": "裁判组",
    "auditor": "只读审计",
}
ROLE_CODE_BY_NAME = {v: k for k, v in ROLE_NAMES.items()}
CODE_BY_CN = {
    "平台管理员": "admin", "租户管理员": "admin",
    "红队工程师": "redteam", "红队": "redteam",
    "蓝队工程师": "blueteam", "蓝队": "blueteam",
    "裁判组": "judge", "裁判": "judge",
    "只读审计": "auditor", "审计员": "auditor", "只读观察者": "auditor",
}

RESOURCES = ["dashboard", "attack", "samples", "evals", "envs", "models",
             "defense", "data", "cost", "open", "admin", "reqs"]
ACTIONS = ["read", "create", "update", "delete", "execute", "export"]

_A = set(ACTIONS)
DEFAULT_MATRIX = {
    "admin": {r: set(_A) for r in RESOURCES},
    "redteam": {
        "dashboard": {"read"}, "attack": set(_A), "samples": set(_A),
        "evals": {"read", "create", "execute", "export"}, "envs": {"read", "execute"},
        "models": {"read"}, "defense": {"read"}, "data": {"read", "export"},
        "cost": {"read"}, "open": {"read"}, "reqs": {"read"}, "admin": set(),
    },
    "blueteam": {
        "dashboard": {"read"}, "attack": {"read"}, "samples": {"read"},
        "evals": {"read", "export"}, "envs": {"read"}, "models": {"read"},
        "defense": {"read", "create", "update", "execute"}, "data": {"read"},
        "cost": {"read"}, "open": set(), "reqs": {"read"}, "admin": set(),
    },
    "judge": {
        "dashboard": {"read"}, "attack": {"read"}, "samples": {"read"},
        "evals": set(_A), "envs": {"read"}, "models": {"read"},
        "defense": {"read"}, "data": {"read"}, "cost": {"read"},
        "open": set(), "reqs": {"read"}, "admin": set(),
    },
    "auditor": {
        "dashboard": {"read"}, "attack": {"read"}, "samples": {"read"},
        "evals": {"read", "export"}, "envs": {"read"}, "models": {"read"},
        "defense": {"read"}, "data": {"read", "export"}, "cost": {"read"},
        "open": {"read"}, "reqs": {"read"}, "admin": {"read"},
    },
}

RESOURCE_RULES = [
    ("/api/auth/policy", "admin"), ("/api/auth/log", "admin"),
    ("/api/open/keys", "open"), ("/api/open", "open"),
    ("/api/users", "admin"), ("/api/roles", "admin"), ("/api/sessions", "self"),
    ("/api/login-logs", "admin"), ("/api/admin", "admin"), ("/api/tenant", "admin"),
    ("/api/system", "admin"), ("/api/audit", "admin"),
    ("/api/tasks", "attack"), ("/api/agents", "attack"), ("/api/studio", "attack"),
    ("/api/cases", "attack"), ("/api/tools", "attack"), ("/api/scan", "attack"),
    ("/api/sandbox", "attack"), ("/api/rag", "attack"), ("/api/supply", "attack"),
    ("/api/samples", "samples"), ("/api/sample", "samples"), ("/api/clean", "samples"),
    ("/api/reflow", "samples"), ("/api/generate", "samples"), ("/api/seeds", "samples"),
    ("/api/components", "samples"),
    ("/api/evals", "evals"), ("/api/eval-rules", "evals"),
    ("/api/envs", "envs"), ("/api/env-config", "envs"), ("/api/env-templates", "envs"),
    ("/api/images", "envs"), ("/api/knowledge", "envs"), ("/api/infra", "envs"),
    ("/api/containers", "envs"), ("/api/quota", "envs"),
    ("/api/models", "models"),
    ("/api/defense", "defense"), ("/api/plugins", "defense"),
    ("/api/data", "data"), ("/api/features", "data"), ("/api/export", "data"),
    ("/api/cost", "cost"),
    ("/api/reqs", "reqs"), ("/api/overview", "dashboard"), ("/api/bootstrap", "dashboard"),
    ("/api/health", "public"), ("/api/auth", "self"), ("/api/mcp", "attack"),
]
EXEC_WORDS = ("/run", "/stop", "/execute", "/probe", "/invoke", "/rerun", "/simulate",
              "/scan", "/check", "/action", "/chat", "/tactic", "/inject", "/pause",
              "/resume", "/toggle", "/ack", "/rotate", "/commit", "/to-case",
              "/instantiate", "/import", "/sync", "/seed", "/generalize")

SESSION_COOKIE = CFG.SESSION_COOKIE
CSRF_COOKIE = CFG.CSRF_COOKIE
CSRF_HEADER = CFG.CSRF_HEADER

_ctx = threading.local()
_init_done = [False]
_cleanup_started = [False]
_login_hits = {}
_login_lock = threading.Lock()
_perm_cache = {"ts": 0, "data": None}
_perm_lock = threading.Lock()


# ------------------------------------------------------------------ 基础
def _ok(data=None, msg="ok"):
    return {"code": 0, "message": msg, "data": data}


def _err(code, msg, data=None):
    return {"code": code, "message": msg, "data": data}


def _con():
    return D.conn()


def _rows(sql, args=()):
    return [dict(r) for r in _con().execute(sql, args).fetchall()]


def _one(sql, args=()):
    r = _rows(sql, args)
    return r[0] if r else None


def _ex(sql, args=()):
    c = _con()
    cur = c.execute(sql, args)
    c.commit()
    return cur.lastrowid


def _now():
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _ts(v):
    try:
        return dt.datetime.strptime(str(v)[:19], "%Y-%m-%d %H:%M:%S")
    except Exception:
        return None


def _ip():
    return getattr(_ctx, "ip", "127.0.0.1")


def _norm_headers(headers):
    """HTTP 头名大小写不敏感（浏览器/客户端可能发 X-csrf-token 等）。"""
    try:
        return {str(k).lower(): v for k, v in (headers or {}).items()}
    except Exception:
        return {}


def _headers():
    return getattr(_ctx, "headers", {}) or {}


def begin_request(ip, headers):
    _ctx.ip = ip
    _ctx.headers = _norm_headers(headers)


def end_request():
    _ctx.ip = None
    _ctx.headers = None


def _audit(user, action, target, result="成功", detail=""):
    try:
        _ex("INSERT INTO audit(ts,user,action,target,ip,result,detail) VALUES(?,?,?,?,?,?,?)",
            (_now(), user or "匿名", action, target, _ip(), result, detail or "{}"))
    except Exception:
        pass


def _login_log(account, user_id, ok, reason=""):
    try:
        _ex("INSERT INTO login_log(ts,account,user_id,ip,ua,ok,reason) VALUES(?,?,?,?,?,?,?)",
            (_now(), account, user_id, _ip(), (_headers().get("user-agent") or "")[:200],
             1 if ok else 0, reason[:200]))
    except Exception:
        pass


# ------------------------------------------------------------------ 建表 / 迁移
SCHEMA = """
CREATE TABLE IF NOT EXISTS auth_session(
  id INTEGER PRIMARY KEY AUTOINCREMENT, token_hash TEXT UNIQUE, csrf TEXT,
  user_id INT, tenant_id INT, created TEXT, expires TEXT, last_seen TEXT,
  ip TEXT, ua TEXT, revoked INT DEFAULT 0);
CREATE TABLE IF NOT EXISTS login_log(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, account TEXT, user_id INT,
  ip TEXT, ua TEXT, ok INT, reason TEXT);
CREATE TABLE IF NOT EXISTS role_perm(
  role TEXT, res TEXT, act TEXT, allow INT DEFAULT 1, PRIMARY KEY(role,res,act));
CREATE TABLE IF NOT EXISTS schema_meta(k TEXT PRIMARY KEY, v TEXT);
CREATE INDEX IF NOT EXISTS idx_session_token ON auth_session(token_hash);
CREATE INDEX IF NOT EXISTS idx_session_user ON auth_session(user_id);
CREATE INDEX IF NOT EXISTS idx_login_log_ts ON login_log(ts);
"""

_USER_COLUMNS = [
    ("password_hash", "TEXT"), ("must_change", "INT DEFAULT 0"), ("failed", "INT DEFAULT 0"),
    ("locked_until", "TEXT"), ("email", "TEXT"), ("phone", "TEXT"), ("updated", "TEXT"),
    ("pwd_changed", "TEXT"), ("last_ip", "TEXT"), ("created", "TEXT"),
]


def _ensure_user_columns(c):
    cols = {r[1] for r in c.execute("PRAGMA table_info(user)").fetchall()}
    for name, typ in _USER_COLUMNS:
        if name not in cols:
            try:
                c.execute("ALTER TABLE user ADD COLUMN %s %s" % (name, typ))
            except Exception:
                pass
    c.commit()


def _seed_matrix(c):
    n = c.execute("SELECT COUNT(*) FROM role_perm").fetchone()[0]
    if n:
        return
    for role, resmap in DEFAULT_MATRIX.items():
        for res in RESOURCES:
            acts = resmap.get(res, set())
            for act in ACTIONS:
                c.execute("INSERT OR REPLACE INTO role_perm(role,res,act,allow) VALUES(?,?,?,?)",
                          (role, res, act, 1 if act in acts else 0))
    c.commit()


# ------------------------------------------------------------------ 密码
def hash_password(pwd):
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", str(pwd).encode("utf-8"), salt, PBKDF2_ROUNDS)
    return "pbkdf2_sha256$%d$%s$%s" % (PBKDF2_ROUNDS, salt.hex(), dk.hex())


def verify_password(pwd, stored):
    try:
        algo, rounds, salt, digest = str(stored).split("$")
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac("sha256", str(pwd).encode("utf-8"),
                                 bytes.fromhex(salt), int(rounds))
        return hmac.compare_digest(dk.hex(), digest)
    except Exception:
        return False


def password_problems(pwd, account=""):
    pwd = str(pwd or "")
    probs = []
    if len(pwd) < CFG.PASSWORD_MIN:
        probs.append("长度至少 %d 位" % CFG.PASSWORD_MIN)
    classes = sum([bool(re.search(r"[a-z]", pwd)), bool(re.search(r"[A-Z]", pwd)),
                   bool(re.search(r"\d", pwd)), bool(re.search(r"[^A-Za-z0-9]", pwd))])
    if classes < 3:
        probs.append("需包含大写字母、小写字母、数字、符号中的至少 3 类")
    if account and pwd.lower() == str(account).lower():
        probs.append("不能与账号相同")
    if pwd.lower() in ("12345678", "password", "admin123", "qwerty123", "admin@123"):
        probs.append("不能使用常见弱口令")
    return probs


def _gen_password():
    return "Tmp@" + secrets.token_hex(5)


# ------------------------------------------------------------------ 角色 / 权限
def role_code_of(user):
    if not user:
        return ""
    raw = str(user.get("role") or "").strip()
    if raw in ROLE_NAMES:
        return raw
    if raw in CODE_BY_CN:
        return CODE_BY_CN[raw]
    row = _one("SELECT code FROM role WHERE code=? OR name=?", (raw, raw))
    return (row or {}).get("code") or "auditor"


def _load_matrix():
    """角色权限矩阵（DB 为准；缓存 15 秒，支持管理页在线修改）。"""
    now = time.time()
    with _perm_lock:
        if _perm_cache["data"] is not None and now - _perm_cache["ts"] < 15:
            return _perm_cache["data"]
    data = {}
    try:
        for r in _rows("SELECT role,res,act,allow FROM role_perm"):
            data.setdefault(r["role"], {})[(r["res"], r["act"])] = bool(r["allow"])
    except Exception:
        data = {}
    if not data:
        for role, resmap in DEFAULT_MATRIX.items():
            for res in RESOURCES:
                for act in ACTIONS:
                    data.setdefault(role, {})[(res, act)] = act in resmap.get(res, set())
    with _perm_lock:
        _perm_cache["data"] = data
        _perm_cache["ts"] = now
    return data


def _invalidate_matrix():
    with _perm_lock:
        _perm_cache["data"] = None
        _perm_cache["ts"] = 0


def p_admin(path):
    """管理类接口前缀：账号/哈希/密钥/租户治理，只读角色与只读密钥不得访问。"""
    p = str(path or "")
    return p.startswith(("/api/admin", "/api/security", "/api/open/keys", "/api/auth/users",
                         "/api/auth/roles", "/api/auth/login-logs", "/api/auth/sessions"))


def resource_of(path):
    p = str(path or "")
    for prefix, res in RESOURCE_RULES:
        if p.startswith(prefix):
            return res
    return "admin"


def action_of(method, path):
    p = str(path or "")
    if method == "GET":
        return "export" if ("/export" in p or "/download/" in p) else "read"
    if method == "DELETE":
        return "delete"
    if method == "PUT":
        return "update"
    if method == "POST":
        for w in EXEC_WORDS:
            if w in p:
                return "execute"
        return "create"
    return "read"


def can(ident, method, path):
    """接口级 RBAC。返回 (allowed, reason)。"""
    if not ident:
        return False, "未登录"
    if CFG.AUTH_MODE != "on":
        return True, ""
    res = resource_of(path)
    act = action_of(method, path)
    if ident.get("type") == "apikey":
        scopes = ident.get("scopes") or ""
        if "全部权限" in scopes:
            return True, ""
        if "只读" in scopes and method == "GET":
            if p_admin(path):
                return False, "只读密钥不可访问管理接口"
            return True, ""
        if "攻击执行" in scopes and res in ("attack", "samples", "envs", "models") \
                and method in ("GET", "POST"):
            return True, ""
        if "评估管理" in scopes and res in ("evals", "defense", "data"):
            return True, ""
        return False, "密钥作用域不足（%s）" % (scopes or "无")
    role = ident.get("role_code") or "auditor"
    if role == "admin":
        return True, ""
    if role == "auditor" and p_admin(path):
        return False, "只读审计角色不可访问管理接口"
    if res in ("self", "public"):
        return True, ""
    allowed = _load_matrix().get(role, {}).get((res, act), False)
    if allowed:
        return True, ""
    return False, "角色「%s」无 %s/%s 权限" % (ROLE_NAMES.get(role, role), res, act)


def menus_for(role_code):
    m = _load_matrix()

    def has(res):
        if role_code == "admin":
            return True
        return any(m.get(role_code, {}).get((res, a), False) for a in ("read", "execute"))

    mapping = [
        ("dashboard", "dashboard", "总览"), ("tasks", "attack", "攻击任务"),
        ("studio", "attack", "攻击编排"), ("agents", "attack", "攻击智能体"),
        ("samples", "samples", "样本工厂"), ("evals", "evals", "评估中心"),
        ("models", "models", "模型网关"), ("envs", "envs", "测试环境"),
        ("infra", "envs", "资源与容器"), ("defense", "defense", "防护插件"),
        ("data", "data", "数据资产"), ("open", "open", "开放能力"),
        ("security", "admin", "账号与安全"),
        ("admin", "admin", "系统管理"), ("reqs", "reqs", "需求覆盖"),
    ]
    return [{"id": p, "label": t} for p, r, t in mapping if has(r)]


def perms_of(role_code):
    m = _load_matrix()
    out = {}
    for res in RESOURCES:
        out[res] = {a: (True if role_code == "admin" else bool(m.get(role_code, {}).get((res, a), False)))
                    for a in ACTIONS}
    return out


# ------------------------------------------------------------------ 用户
def user_public(u):
    if not u:
        return None
    keys = ("id", "account", "name", "role", "tenant_id", "dept", "status",
            "last_login", "last_ip", "email", "phone", "must_change", "pwd_changed", "created")
    d = {k: u.get(k) for k in keys if k in u}
    d["role_code"] = role_code_of(u)
    try:
        t = _one("SELECT name FROM tenant WHERE id=?", (u.get("tenant_id"),))
        d["tenant"] = (t or {}).get("name") or ""
    except Exception:
        d["tenant"] = ""
    return d


def _user_by_account(account):
    return _one("SELECT * FROM user WHERE lower(account)=lower(?)", (str(account).strip(),))


def _user_by_id(uid):
    return _one("SELECT * FROM user WHERE id=?", (uid,))


# ------------------------------------------------------------------ 会话
def _new_token():
    return secrets.token_urlsafe(32)


def _cookie(name, value, max_age, http_only=False):
    secure = (CFG.COOKIE_SECURE == "1") or (CFG.COOKIE_SECURE == "auto" and _is_https())
    parts = ["%s=%s" % (name, value), "Path=/", "Max-Age=%d" % int(max_age),
             "SameSite=%s" % CFG.COOKIE_SAMESITE]
    if http_only:
        parts.append("HttpOnly")
    if secure:
        parts.append("Secure")
    return "; ".join(parts)


def _is_https():
    h = _headers()
    if CFG.TRUST_PROXY and (h.get("x-forwarded-proto") or "").lower() == "https":
        return True
    return bool(getattr(_ctx, "https", False))


def _parse_cookies():
    raw = _headers().get("cookie") or ""
    out = {}
    for part in raw.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def _hash_token(t):
    return hashlib.sha256(str(t).encode("utf-8")).hexdigest()


def create_session(user, remember=False):
    token = _new_token()
    csrf = secrets.token_urlsafe(24)
    ttl = CFG.REMEMBER_TTL if remember else CFG.SESSION_TTL
    now = dt.datetime.now()
    expires = (now + dt.timedelta(seconds=ttl)).strftime("%Y-%m-%d %H:%M:%S")
    _ex("INSERT INTO auth_session(token_hash,csrf,user_id,tenant_id,created,expires,"
        "last_seen,ip,ua,revoked) VALUES(?,?,?,?,?,?,?,?,?,0)",
        (_hash_token(token), csrf, user["id"], user.get("tenant_id"),
         now.strftime("%Y-%m-%d %H:%M:%S"), expires, now.strftime("%Y-%m-%d %H:%M:%S"),
         _ip(), (_headers().get("user-agent") or "")[:200]))
    rows = _rows("SELECT id FROM auth_session WHERE user_id=? AND revoked=0 AND expires>? "
                 "ORDER BY id DESC", (user["id"], _now()))
    for r in rows[CFG.MAX_SESSIONS:]:
        _ex("UPDATE auth_session SET revoked=1 WHERE id=?", (r["id"],))
    return token, csrf, ttl


def _session_row(token):
    if not token:
        return None
    return _one("SELECT s.*, u.account, u.name, u.role, u.status user_status, u.must_change, "
                "u.tenant_id AS u_tenant FROM auth_session s JOIN user u ON u.id=s.user_id "
                "WHERE s.token_hash=? AND s.revoked=0", (_hash_token(token),))


def _ident_from_session(row):
    if not row:
        return None, "会话不存在或已退出"
    exp = _ts(row.get("expires"))
    if not exp or exp < dt.datetime.now():
        return None, "会话已过期，请重新登录"
    if (row.get("user_status") or "") != "启用":
        _ex("UPDATE auth_session SET revoked=1 WHERE id=?", (row["id"],))
        return None, "账号已被停用"
    try:
        last = _ts(row.get("last_seen"))
        if not last or (dt.datetime.now() - last).total_seconds() > 60:
            new_exp = (dt.datetime.now() + dt.timedelta(seconds=CFG.SESSION_TTL)).strftime("%Y-%m-%d %H:%M:%S")
            _ex("UPDATE auth_session SET last_seen=?, expires=? WHERE id=?",
                (_now(), new_exp, row["id"]))
    except Exception:
        pass
    user = {"id": row["user_id"], "account": row["account"], "name": row["name"],
            "role": row["role"], "tenant_id": row.get("u_tenant") or row.get("tenant_id")}
    return {
        "type": "session", "session_id": row["id"], "user_id": row["user_id"],
        "account": row["account"], "name": row["name"], "role": row["role"],
        "role_code": role_code_of(user),
        "tenant_id": row.get("u_tenant") or row.get("tenant_id"),
        "must_change": bool(row.get("must_change")), "csrf": row.get("csrf"),
        "expires": row.get("expires"), "ip": row.get("ip"),
    }, ""


def _ident_from_apikey(key):
    if not key:
        return None, ""
    try:
        import api_ext as X
        chk = X.check_key(key)
    except Exception:
        return None, ""
    if not chk.get("ok"):
        return None, "密钥无效或已撤销"
    k = chk.get("key") or {}
    return {"type": "apikey", "key_id": k.get("id"), "name": k.get("name") or "API 密钥",
            "role_code": "service", "scopes": k.get("scopes") or "", "tenant_id": None,
            "must_change": False}, ""


def authenticate(headers):
    """返回 (ident, reason)。支持会话 Cookie、X-Session-Token、Bearer 会话、API Key。"""
    if CFG.AUTH_MODE != "on":
        return {"type": "session", "user_id": 0, "account": "dev", "name": "开发模式",
                "role": "平台管理员", "role_code": "admin", "tenant_id": 1,
                "must_change": False, "csrf": "", "session_id": 0}, ""
    h = _norm_headers(headers)
    cookies = {}
    raw = h.get("cookie") or ""
    for part in raw.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            cookies[k.strip()] = v.strip()
    token = cookies.get(SESSION_COOKIE) or (h.get("x-session-token") or "").strip()
    if token:
        ident, why = _ident_from_session(_session_row(token))
        if ident:
            ident["token"] = token
            ident["via"] = "cookie"
            return ident, ""
        return None, why
    auth = (h.get("authorization") or "").strip()
    if auth.lower().startswith("bearer "):
        cand = auth[7:].strip()
        ident, why = _ident_from_session(_session_row(cand))
        if ident:
            return ident, ""
        ident, why2 = _ident_from_apikey(cand)
        if ident:
            return ident, ""
        return None, why2 or why
    key = (h.get("x-api-key") or "").strip()
    if key:
        ident, why = _ident_from_apikey(key)
        if ident:
            return ident, ""
        return None, why
    return None, "未登录"


def check_csrf(ident, headers):
    if CFG.AUTH_MODE != "on":
        return True
    if not ident:
        return False
    if ident.get("type") != "session":
        return True
    h = _norm_headers(headers)
    cookies = {}
    for part in (h.get("cookie") or "").split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            cookies[k.strip()] = v.strip()
    got = (h.get(CSRF_HEADER.lower()) or "").strip()
    want = ident.get("csrf") or ""
    cookie_csrf = cookies.get(CSRF_COOKIE) or ""
    if not got or not want:
        return False
    return hmac.compare_digest(got, want) and (not cookie_csrf or hmac.compare_digest(cookie_csrf, want))


# ------------------------------------------------------------------ 登录
def _rate_recent():
    now = time.time()
    with _login_lock:
        arr = [t for t in _login_hits.get(_ip(), []) if now - t < 60]
        _login_hits[_ip()] = arr
        return len(arr)


def _rate_ok():
    """仅统计失败尝试：正常登录不占用配额，失败次数超限才限流。"""
    return _rate_recent() < CFG.LOGIN_RPM


def _rate_add():
    now = time.time()
    with _login_lock:
        _login_hits.setdefault(_ip(), []).append(now)


def login(account, password, remember=False):
    account = str(account or "").strip()
    if not account or not password:
        _rate_add()
        return {"ok": False, "msg": "请输入账号和密码", "code": 1001}
    if not _rate_ok():
        return {"ok": False, "msg": "登录尝试过于频繁，请 1 分钟后重试", "code": 4290}
    u = _user_by_account(account)
    if not u:
        _rate_add()
        _login_log(account, None, False, "账号不存在")
        return {"ok": False, "msg": "账号或密码错误", "code": 4011}
    locked = _ts(u.get("locked_until"))
    if locked and locked > dt.datetime.now():
        _rate_add()
        left = int((locked - dt.datetime.now()).total_seconds() // 60) + 1
        _login_log(account, u["id"], False, "账号锁定中")
        return {"ok": False, "msg": "账号已锁定，请 %d 分钟后再试" % left, "code": 4023, "locked": True}
    if (u.get("status") or "") != "启用":
        _rate_add()
        _login_log(account, u["id"], False, "账号停用")
        return {"ok": False, "msg": "账号已停用，请联系管理员", "code": 4021}
    if not u.get("password_hash"):
        _ex("UPDATE user SET password_hash=?, must_change=1, updated=? WHERE id=?",
            (hash_password(CFG.DEFAULT_USER_PASSWORD), _now(), u["id"]))
        u = _user_by_id(u["id"])
    if not verify_password(password, u.get("password_hash")):
        _rate_add()
        failed = int(u.get("failed") or 0) + 1
        locked_until = None
        if failed >= CFG.MAX_LOGIN_FAIL:
            locked_until = (dt.datetime.now() + dt.timedelta(minutes=CFG.LOCK_MINUTES)).strftime("%Y-%m-%d %H:%M:%S")
            failed = 0
        _ex("UPDATE user SET failed=?, locked_until=?, updated=? WHERE id=?",
            (failed, locked_until, _now(), u["id"]))
        _login_log(account, u["id"], False, "密码错误")
        msg = "账号或密码错误"
        if locked_until:
            msg = "密码错误次数过多，账号已锁定 %d 分钟" % CFG.LOCK_MINUTES
        return {"ok": False, "msg": msg, "code": 4012, "locked": bool(locked_until)}
    _ex("UPDATE user SET failed=0, locked_until=NULL, last_login=?, last_ip=?, updated=? WHERE id=?",
        (_now(), _ip(), _now(), u["id"]))
    token, csrf, ttl = create_session(u, remember=remember)
    _login_log(account, u["id"], True, "登录成功")
    _audit(u.get("name") or account, "登录平台", "Web 控制台", "成功",
           json.dumps({"ua": (_headers().get("user-agent") or "")[:120]}, ensure_ascii=False))
    return {"ok": True, "token": token, "csrf": csrf, "ttl": ttl,
            "user": user_public(_user_by_id(u["id"])), "msg": "登录成功"}


def _clear_cookies():
    return [("Set-Cookie", "ls_session=; Path=/; Max-Age=0; HttpOnly; SameSite=%s" % CFG.COOKIE_SAMESITE),
            ("Set-Cookie", "ls_csrf=; Path=/; Max-Age=0; SameSite=%s" % CFG.COOKIE_SAMESITE)]


def refresh_cookies(ident):
    """滑动续期：带 Cookie 的会话每次请求按剩余有效期重新下发（不改变令牌）。"""
    if not ident or ident.get("type") != "session" or not ident.get("token"):
        return None
    if ident.get("via") != "cookie":
        return None
    exp = _ts(ident.get("expires"))
    rem = int((exp - dt.datetime.now()).total_seconds()) if exp else 0
    if rem < 60:
        return None
    return [("Set-Cookie", _cookie(SESSION_COOKIE, ident["token"], rem, http_only=True)),
            ("Set-Cookie", _cookie(CSRF_COOKIE, ident.get("csrf") or "", rem))]


# ------------------------------------------------------------------ 处理器
def h_login(q, b):
    b = b or {}
    r = login(b.get("account") or b.get("username"), b.get("password"), bool(b.get("remember")))
    if not r["ok"]:
        return {"code": r.get("code", 4011), "message": r["msg"],
                "data": {"locked": r.get("locked", False)}}
    cookies = [("Set-Cookie", _cookie(SESSION_COOKIE, r["token"], r["ttl"], http_only=True)),
               ("Set-Cookie", _cookie(CSRF_COOKIE, r["csrf"], r["ttl"]))]
    return {"__cookies__": cookies, "code": 0, "message": "登录成功",
            "data": {"user": r["user"], "csrf": r["csrf"], "expiresIn": r["ttl"],
                     "must_change": bool((r["user"] or {}).get("must_change"))}}


def h_logout(q, b):
    ident, _ = authenticate(_headers())
    if ident and ident.get("type") == "session" and ident.get("session_id"):
        _ex("UPDATE auth_session SET revoked=1 WHERE id=?", (ident["session_id"],))
        _audit(ident.get("name"), "退出登录", "Web 控制台")
        _login_log(ident.get("account"), ident.get("user_id"), True, "退出登录")
    return {"__cookies__": _clear_cookies(), "code": 0, "message": "已退出登录", "data": None}


def h_me(q, b):
    ident, why = authenticate(_headers())
    if not ident:
        return _err(4010, why or "未登录")
    if ident.get("type") == "apikey":
        return _ok({"type": "apikey", "name": ident.get("name"), "role": "服务账号",
                    "role_code": "service", "scopes": ident.get("scopes"),
                    "menus": [], "perms": {}})
    if int(ident.get("user_id") or 0) == 0:      # PLATFORM_AUTH=off 开发模式
        return _ok({"user": {"id": 0, "account": "dev", "name": "开发模式",
                             "role": "平台管理员", "role_code": "admin", "tenant_id": 1,
                             "status": "启用", "must_change": 0},
                    "role_code": "admin", "menus": menus_for("admin"),
                    "perms": perms_of("admin"), "must_change": False,
                    "session": {"id": 0, "dev": True}})
    u = _user_by_id(ident["user_id"])
    if not u:
        return _err(4011, "账号不存在")
    pub = user_public(u)
    return _ok({"user": pub, "role_code": pub["role_code"],
                "menus": menus_for(pub["role_code"]),
                "perms": perms_of(pub["role_code"]),
                "must_change": bool(u.get("must_change")),
                "session": {"id": ident.get("session_id"), "expires": ident.get("expires")}})


def h_profile(q, b):
    ident, why = authenticate(_headers())
    if not ident or ident.get("type") != "session":
        return _err(4010, "请先登录")
    b = b or {}
    u = _user_by_id(ident["user_id"])
    if not u:
        return _err(4011, "账号不存在")
    fields = {}
    if b.get("name") is not None:
        name = str(b["name"]).strip()
        if not name:
            return _err(1001, "姓名不能为空")
        fields["name"] = name[:32]
    if b.get("email") is not None:
        email = str(b["email"]).strip()
        if email and not re.match(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$", email):
            return _err(1001, "邮箱格式不正确")
        fields["email"] = email[:120]
    if b.get("phone") is not None:
        phone = str(b["phone"]).strip()
        if phone and not re.match(r"^[0-9+\- ]{6,20}$", phone):
            return _err(1001, "手机号格式不正确")
        fields["phone"] = phone[:20]
    if not fields:
        return _err(1001, "没有可更新的字段")
    _ex("UPDATE user SET %s, updated=? WHERE id=?" % ",".join("%s=?" % k for k in fields),
        list(fields.values()) + [_now(), u["id"]])
    _audit(u.get("name"), "修改个人资料", "账号 %s" % u.get("account"),
           detail=json.dumps(fields, ensure_ascii=False))
    return _ok(user_public(_user_by_id(u["id"])), "资料已更新")


def h_change_password(q, b):
    ident, why = authenticate(_headers())
    if not ident or ident.get("type") != "session":
        return _err(4010, "请先登录")
    b = b or {}
    old = str(b.get("old") or b.get("oldPassword") or "")
    new = str(b.get("new") or b.get("newPassword") or "")
    u = _user_by_id(ident["user_id"])
    if not u or not verify_password(old, u.get("password_hash")):
        _login_log(u.get("account") if u else "", u.get("id") if u else None, False, "修改密码：原密码错误")
        return _err(4013, "原密码不正确")
    probs = password_problems(new, u.get("account"))
    if probs:
        return _err(1001, "新密码不符合要求：" + "；".join(probs))
    if verify_password(new, u.get("password_hash")):
        return _err(1002, "新密码不能与原密码相同")
    _ex("UPDATE user SET password_hash=?, must_change=0, pwd_changed=?, updated=? WHERE id=?",
        (hash_password(new), _now(), _now(), u["id"]))
    _ex("UPDATE auth_session SET revoked=1 WHERE user_id=? AND id<>?",
        (u["id"], ident.get("session_id") or 0))
    _audit(u.get("name"), "修改密码", "账号 %s" % u.get("account"))
    _login_log(u.get("account"), u.get("id"), True, "修改密码成功")
    return _ok({"changed": True}, "密码已修改，其他终端的会话已退出")


def h_sessions(q, b):
    ident, why = authenticate(_headers())
    if not ident:
        return _err(4010, why or "未登录")
    q = q or {}
    is_admin = ident.get("role_code") == "admin"
    all_flag = str(q.get("all") or "") in ("1", "true", "yes")
    if all_flag and not is_admin:
        return _err(4030, "仅管理员可查看全部会话")
    if all_flag:
        rows = _rows("SELECT s.id,s.user_id,s.created,s.expires,s.last_seen,s.ip,s.ua,s.revoked,"
                     "u.account,u.name,u.role FROM auth_session s LEFT JOIN user u ON u.id=s.user_id "
                     "ORDER BY s.id DESC LIMIT 500")
    else:
        rows = _rows("SELECT s.id,s.user_id,s.created,s.expires,s.last_seen,s.ip,s.ua,s.revoked,"
                     "u.account,u.name,u.role FROM auth_session s LEFT JOIN user u ON u.id=s.user_id "
                     "WHERE s.user_id=? ORDER BY s.id DESC LIMIT 100", (ident["user_id"],))
    now = _now()
    for r in rows:
        r["current"] = (r["id"] == ident.get("session_id"))
        r["expired"] = (r.get("expires") or "") < now
        r["revoked"] = bool(r.get("revoked"))
    return _ok({"items": rows, "total": len(rows)})


def h_session_revoke(q, b, sid):
    ident, why = authenticate(_headers())
    if not ident:
        return _err(4010, why or "未登录")
    row = _one("SELECT * FROM auth_session WHERE id=?", (sid,))
    if not row:
        return _err(404, "会话不存在")
    if ident.get("role_code") != "admin" and row["user_id"] != ident.get("user_id"):
        return _err(4030, "无权操作其他账号的会话")
    _ex("UPDATE auth_session SET revoked=1 WHERE id=?", (sid,))
    _audit(ident.get("name"), "会话下线", "session#%s" % sid)
    return _ok({"id": sid, "revoked": True}, "会话已下线")


def h_users_list(q, b):
    q = q or {}
    try:
        cur = max(1, int(float(q.get("current") or 1)))
        size = min(100, max(1, int(float(q.get("pageSize") or 20))))
    except (TypeError, ValueError):
        cur, size = 1, 20
    where, args = "1=1", []
    if q.get("q"):
        where += " AND (account LIKE ? OR name LIKE ? OR dept LIKE ?)"
        args += ["%" + q["q"] + "%"] * 3
    if q.get("role"):
        where += " AND role=?"
        args.append(ROLE_NAMES.get(str(q["role"]), q["role"]))
    if q.get("status"):
        where += " AND status=?"
        args.append(q["status"])
    total = (_one("SELECT COUNT(*) c FROM user WHERE " + where, args) or {}).get("c", 0)
    rows = _rows("SELECT * FROM user WHERE " + where + " ORDER BY id LIMIT ? OFFSET ?",
                 args + [size, (cur - 1) * size])
    return _ok({"items": [user_public(r) for r in rows], "current": cur, "pageSize": size,
                "total": total, "pages": max(1, (total + size - 1) // size)})


def _valid_role(role):
    if role in ROLE_NAMES:
        return True
    return bool(_one("SELECT 1 FROM role WHERE code=? OR name=?", (role, role)))


def h_user_create(q, b):
    b = b or {}
    account = str(b.get("account") or "").strip()
    name = str(b.get("name") or "").strip()
    role = str(b.get("role") or "auditor").strip()
    if not re.match(r"^[A-Za-z][A-Za-z0-9_.-]{2,31}$", account):
        return _err(1001, "账号需以字母开头、3-32 位，仅含字母/数字/._-")
    if not name:
        return _err(1001, "姓名不能为空")
    if not _valid_role(role):
        return _err(1001, "角色不存在")
    role = ROLE_NAMES.get(role, role)          # 统一存中文角色名，统计与展示一致
    if _user_by_account(account):
        return _err(1002, "账号已存在")
    tenant_id = b.get("tenant_id") or 1
    if not _one("SELECT 1 FROM tenant WHERE id=?", (tenant_id,)):
        return _err(1001, "租户不存在")
    pwd = str(b.get("password") or "").strip() or _gen_password()
    probs = password_problems(pwd, account)
    if b.get("password") and probs:
        return _err(1001, "密码不符合要求：" + "；".join(probs))
    uid = _ex("INSERT INTO user(tenant_id,name,account,role,dept,status,last_login,"
              "password_hash,must_change,email,phone,created,updated) "
              "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
              (tenant_id, name, account, role, b.get("dept") or "", "启用", None,
               hash_password(pwd), 1 if CFG.FORCE_PASSWORD_CHANGE else 0,
               b.get("email") or "", b.get("phone") or "", _now(), _now()))
    ident, _ = authenticate(_headers())
    _audit(ident.get("name") if ident else "-", "新增用户", "user#%s %s" % (uid, account))
    try:
        _ex("UPDATE role SET members=(SELECT COUNT(*) FROM user WHERE role=role.name)")
    except Exception:
        pass
    return _ok({"id": uid, "account": account,
                "tempPassword": pwd if not b.get("password") else None,
                "must_change": True}, "用户已创建")


def h_user_update(q, b, uid):
    u = _user_by_id(uid)
    if not u:
        return _err(404, "用户不存在")
    b = b or {}
    fields = {}
    for k in ("name", "dept", "email", "phone"):
        if b.get(k) is not None:
            fields[k] = str(b.get(k)).strip()
    if b.get("role") is not None:
        new_role = str(b["role"]).strip()
        if not _valid_role(new_role):
            return _err(1001, "角色不存在")
        new_role = ROLE_NAMES.get(new_role, new_role)
        if u["account"] == CFG.ADMIN_ACCOUNT and new_role != "平台管理员":
            return _err(1003, "不能修改内置管理员的角色（避免失去管理入口）")
        fields["role"] = new_role
    if b.get("tenant_id") is not None:
        if not _one("SELECT 1 FROM tenant WHERE id=?", (b["tenant_id"],)):
            return _err(1001, "租户不存在")
        fields["tenant_id"] = int(b["tenant_id"])
    if b.get("status") is not None:
        st = str(b["status"])
        if st not in ("启用", "停用"):
            return _err(1001, "状态只能是 启用/停用")
        if u["account"] == CFG.ADMIN_ACCOUNT and st == "停用":
            return _err(1003, "不能停用内置管理员账号")
        fields["status"] = st
        if st == "停用":
            _ex("UPDATE auth_session SET revoked=1 WHERE user_id=?", (uid,))
    if not fields:
        return _err(1001, "没有可更新的字段")
    sets = ",".join("%s=?" % k for k in fields)
    _ex("UPDATE user SET %s, updated=? WHERE id=?" % sets, list(fields.values()) + [_now(), uid])
    ident, _ = authenticate(_headers())
    _audit(ident.get("name") if ident else "-", "修改用户", "user#%s %s" % (uid, u.get("account")),
           detail=json.dumps(fields, ensure_ascii=False))
    return _ok({"id": uid, "updated": fields}, "用户已更新")


def h_user_reset_password(q, b, uid):
    u = _user_by_id(uid)
    if not u:
        return _err(404, "用户不存在")
    b = b or {}
    pwd = str(b.get("password") or "").strip() or _gen_password()
    probs = password_problems(pwd, u.get("account"))
    if b.get("password") and probs:
        return _err(1001, "密码不符合要求：" + "；".join(probs))
    _ex("UPDATE user SET password_hash=?, must_change=1, failed=0, locked_until=NULL, "
        "updated=? WHERE id=?", (hash_password(pwd), _now(), uid))
    _ex("UPDATE auth_session SET revoked=1 WHERE user_id=?", (uid,))
    ident, _ = authenticate(_headers())
    _audit(ident.get("name") if ident else "-", "重置用户密码",
           "user#%s %s" % (uid, u.get("account")))
    return _ok({"id": uid, "account": u.get("account"), "tempPassword": pwd,
                "must_change": True}, "密码已重置，用户下次登录需修改")


def h_user_status(q, b, uid):
    b = b or {}
    st = str(b.get("status") or "")
    if st not in ("启用", "停用"):
        return _err(1001, "状态只能是 启用/停用")
    return h_user_update({}, {"status": st}, uid)


def h_roles_list(q, b):
    roles = _rows("SELECT * FROM role ORDER BY id")
    counts = {r["role"]: r["c"] for r in _rows("SELECT role, COUNT(*) c FROM user GROUP BY role")}
    for r in roles:
        try:
            r["perms"] = json.loads(r.get("perms") or "[]")
        except Exception:
            r["perms"] = []
        r["members"] = counts.get(r["name"], 0)
        r["role_code"] = CODE_BY_CN.get(r["name"], r.get("code") or "")
    return _ok({"items": roles, "resources": RESOURCES, "actions": ACTIONS})


def h_role_perms_get(q, b, code):
    role_code = CODE_BY_CN.get(code, code)
    if role_code not in ROLE_NAMES:
        return _err(404, "角色不存在")
    m = _load_matrix().get(role_code, {})
    matrix = [{"res": res, "acts": {a: (True if role_code == "admin" else bool(m.get((res, a), False)))
                                    for a in ACTIONS}} for res in RESOURCES]
    return _ok({"role": role_code, "name": ROLE_NAMES.get(role_code), "resources": RESOURCES,
                "actions": ACTIONS, "matrix": matrix})


def h_role_perms_save(q, b, code):
    role_code = CODE_BY_CN.get(code, code)
    if role_code not in ROLE_NAMES:
        return _err(404, "角色不存在")
    b = b or {}
    items = b.get("matrix") or b.get("perms") or []
    if not isinstance(items, list) or not items:
        return _err(1001, "matrix 不能为空")
    if role_code == "admin":
        return _err(1003, "管理员权限不可修改（避免锁死）")
    changed = 0
    for it in items:
        if not isinstance(it, dict):
            continue
        res = str(it.get("res") or "")
        if res not in RESOURCES:
            continue
        acts = it.get("acts") or {}
        if not isinstance(acts, dict):
            continue
        for act in ACTIONS:
            if act not in acts:
                continue
            _ex("INSERT OR REPLACE INTO role_perm(role,res,act,allow) VALUES(?,?,?,?)",
                (role_code, res, act, 1 if acts[act] else 0))
            changed += 1
    _invalidate_matrix()
    ident, _ = authenticate(_headers())
    _audit(ident.get("name") if ident else "-", "修改角色权限", "%s（%d 项）" % (role_code, changed))
    return _ok({"role": role_code, "changed": changed}, "角色权限已保存")


def h_login_logs(q, b):
    q = q or {}
    try:
        cur = max(1, int(float(q.get("current") or 1)))
        size = min(200, max(1, int(float(q.get("pageSize") or 50))))
    except (TypeError, ValueError):
        cur, size = 1, 50
    where, args = "1=1", []
    if q.get("account"):
        where += " AND account LIKE ?"
        args.append("%" + q["account"] + "%")
    if q.get("ok") in ("0", "1"):
        where += " AND ok=?"
        args.append(int(q["ok"]))
    total = (_one("SELECT COUNT(*) c FROM login_log WHERE " + where, args) or {}).get("c", 0)
    items = _rows("SELECT * FROM login_log WHERE " + where + " ORDER BY id DESC LIMIT ? OFFSET ?",
                  args + [size, (cur - 1) * size])
    return _ok({"items": items, "current": cur, "pageSize": size, "total": total,
                "pages": max(1, (total + size - 1) // size)})


_UPTIME_START = time.time()


def h_health(q, b):
    try:
        _con().execute("SELECT 1").fetchone()
        db_ok = True
    except Exception:
        db_ok = False
    sessions = 0
    try:
        sessions = (_one("SELECT COUNT(*) c FROM auth_session WHERE revoked=0 AND expires>?",
                         (_now(),)) or {}).get("c", 0)
    except Exception:
        pass
    return _ok({"status": "ok" if db_ok else "degraded", "db": db_ok,
                "version": CFG.APP_VERSION, "auth": CFG.AUTH_MODE,
                "uptimeSec": int(time.time() - _UPTIME_START),
                "sessions": sessions, "time": _now()})


def h_system_info(q, b):
    import platform as _pf
    import sys as _sys
    try:
        db_path = os.environ.get("PLATFORM_DB") or os.path.join(CFG.DATA, "platform.db")
        db_size = os.path.getsize(db_path)
    except Exception:
        db_size, db_path = 0, ""
    stats = {
        "users": (_one("SELECT COUNT(*) c FROM user") or {}).get("c", 0),
        "roles": (_one("SELECT COUNT(*) c FROM role") or {}).get("c", 0),
        "sessions": (_one("SELECT COUNT(*) c FROM auth_session WHERE revoked=0 AND expires>?",
                          (_now(),)) or {}).get("c", 0),
        "loginToday": (_one("SELECT COUNT(*) c FROM login_log WHERE ts>=? AND ok=1",
                            (dt.date.today().strftime("%Y-%m-%d"),)) or {}).get("c", 0),
        "audits": (_one("SELECT COUNT(*) c FROM audit") or {}).get("c", 0),
    }
    return _ok({"version": CFG.APP_VERSION, "authMode": CFG.AUTH_MODE,
                "python": _sys.version.split()[0], "platform": _pf.platform(),
                "uptimeSec": int(time.time() - _UPTIME_START), "dbSize": db_size,
                "dbPath": db_path, "sessionTTL": CFG.SESSION_TTL, "stats": stats,
                "security": {"passwordMin": CFG.PASSWORD_MIN, "maxLoginFail": CFG.MAX_LOGIN_FAIL,
                             "lockMinutes": CFG.LOCK_MINUTES, "loginRpm": CFG.LOGIN_RPM,
                             "csrf": True, "cookieSecure": CFG.COOKIE_SECURE}})


ROUTES = [
    ("POST", r"^/api/auth/login$", h_login),
    ("POST", r"^/api/auth/logout$", h_logout),
    ("GET", r"^/api/auth/me$", h_me),
    ("PUT", r"^/api/auth/profile$", h_profile),
    ("POST", r"^/api/auth/change-password$", h_change_password),
    ("GET", r"^/api/health$", h_health),
    ("GET", r"^/api/system/info$", h_system_info),
    ("GET", r"^/api/users$", h_users_list),
    ("POST", r"^/api/users$", h_user_create),
    ("PUT", r"^/api/users/(\d+)$", h_user_update),
    ("POST", r"^/api/users/(\d+)/reset-password$", h_user_reset_password),
    ("POST", r"^/api/users/(\d+)/status$", h_user_status),
    ("GET", r"^/api/roles$", h_roles_list),
    ("GET", r"^/api/roles/([A-Za-z_]+)/perms$", h_role_perms_get),
    ("PUT", r"^/api/roles/([A-Za-z_]+)/perms$", h_role_perms_save),
    ("GET", r"^/api/sessions$", h_sessions),
    ("DELETE", r"^/api/sessions/(\d+)$", h_session_revoke),
    ("GET", r"^/api/login-logs$", h_login_logs),
]


# ------------------------------------------------------------------ 初始化
def _seed_users(c):
    created = []
    row = c.execute("SELECT * FROM user WHERE lower(account)=lower(?)", (CFG.ADMIN_ACCOUNT,)).fetchone()
    if not row:
        cur = c.execute("INSERT INTO user(tenant_id,name,account,role,dept,status,last_login,"
                        "password_hash,must_change,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                        (1, CFG.ADMIN_NAME, CFG.ADMIN_ACCOUNT, "平台管理员", "安全运营部", "启用", None,
                         hash_password(CFG.ADMIN_PASSWORD),
                         1 if CFG.FORCE_PASSWORD_CHANGE else 0, _now(), _now()))
        admin_id = cur.lastrowid
        created.append({"account": CFG.ADMIN_ACCOUNT, "password": CFG.ADMIN_PASSWORD,
                        "id": admin_id})
    else:
        admin_id = row["id"]
    for u in c.execute("SELECT id,account,password_hash FROM user").fetchall():
        if not u["password_hash"]:
            if u["id"] == admin_id:
                pwd, mc = CFG.ADMIN_PASSWORD, (1 if CFG.FORCE_PASSWORD_CHANGE else 0)
            else:
                # 非管理员种子账号不设统一默认口令，随机初始化并强制首登改密
                pwd, mc = secrets.token_urlsafe(18), 1
            c.execute("UPDATE user SET password_hash=?, must_change=?, updated=? WHERE id=?",
                      (hash_password(pwd), mc, _now(), u["id"]))
    try:
        c.execute("UPDATE role SET members=(SELECT COUNT(*) FROM user WHERE role=role.name)")
    except Exception:
        pass
    c.commit()
    return created


def _cleanup_loop():
    while True:
        time.sleep(600)
        try:
            c = _con()
            now = dt.datetime.now()
            c.execute("UPDATE auth_session SET revoked=1 WHERE revoked=0 AND expires<?",
                      ((now - dt.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),))
            c.execute("DELETE FROM auth_session WHERE (revoked=1 OR expires<?) AND created<?",
                      ((now - dt.timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S"),
                       (now - dt.timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")))
            c.commit()
        except Exception:
            pass


def init():
    if _init_done[0]:
        return {"created": []}
    CFG.ensure_dirs()
    c = _con()
    c.executescript(SCHEMA)
    _ensure_user_columns(c)
    _seed_matrix(c)
    created = _seed_users(c)
    try:
        c.execute("INSERT OR REPLACE INTO schema_meta(k,v) VALUES('auth_version','1')")
        c.commit()
    except Exception:
        pass
    _init_done[0] = True
    if not _cleanup_started[0]:
        _cleanup_started[0] = True
        threading.Thread(target=_cleanup_loop, daemon=True, name="auth-clean").start()
    return {"created": created}
