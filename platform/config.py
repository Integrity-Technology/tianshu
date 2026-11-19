# -*- coding: utf-8 -*-
"""平台产品化配置（环境变量优先；不依赖第三方库）。"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(BASE, "web")
DATA = os.environ.get("PLATFORM_DATA") or os.path.join(BASE, "data")
EXPORT_DIR = os.path.join(DATA, "exports")
LOG_DIR = os.environ.get("PLATFORM_LOG_DIR") or os.path.join(DATA, "logs")
BACKUP_DIR = os.environ.get("PLATFORM_BACKUP_DIR") or os.path.join(DATA, "backups")

APP_NAME = "天枢 · 大模型内容安全攻防平台"
APP_VERSION = os.environ.get("PLATFORM_VERSION", "1.0.16")

HOST = os.environ.get("PLATFORM_HOST", "127.0.0.1")
PORT = int(os.environ.get("PLATFORM_PORT", "8848"))

# 认证模式：on（默认，必须登录）/ off（仅限本机开发排障，生产禁用）
AUTH_MODE = os.environ.get("PLATFORM_AUTH", "on").strip().lower()

# 会话
SESSION_TTL = int(os.environ.get("PLATFORM_SESSION_TTL", "28800"))        # 8h
MAX_SESSIONS = int(os.environ.get("PLATFORM_MAX_SESSIONS", "10"))          # 单账号并发会话上限
REMEMBER_TTL = int(os.environ.get("PLATFORM_REMEMBER_TTL", "604800"))     # 7d
SESSION_COOKIE = "ls_session"
CSRF_COOKIE = "ls_csrf"
CSRF_HEADER = "X-CSRF-Token"
COOKIE_SECURE = os.environ.get("PLATFORM_COOKIE_SECURE", "auto").lower()  # auto|1|0
COOKIE_SAMESITE = os.environ.get("PLATFORM_COOKIE_SAMESITE", "Lax")

# 登录安全
MAX_LOGIN_FAIL = int(os.environ.get("PLATFORM_MAX_LOGIN_FAIL", "5"))
LOCK_MINUTES = int(os.environ.get("PLATFORM_LOCK_MINUTES", "15"))
LOGIN_RPM = int(os.environ.get("PLATFORM_LOGIN_RPM", "30"))
PASSWORD_MIN = int(os.environ.get("PLATFORM_PASSWORD_MIN", "8"))

# 初始账号（仅首次初始化使用；初始化后请立即修改）
ADMIN_ACCOUNT = os.environ.get("PLATFORM_ADMIN_ACCOUNT", "admin")
ADMIN_PASSWORD = os.environ.get("PLATFORM_ADMIN_PASSWORD", "Admin@123456")
ADMIN_NAME = os.environ.get("PLATFORM_ADMIN_NAME", "系统管理员")
DEFAULT_USER_PASSWORD = os.environ.get("PLATFORM_DEFAULT_USER_PASSWORD", "User@123456")
FORCE_PASSWORD_CHANGE = os.environ.get("PLATFORM_FORCE_PASSWORD_CHANGE", "1") not in ("0", "false", "no")

# 静态资源安全
ENABLE_HSTS = os.environ.get("PLATFORM_HSTS", "0") in ("1", "true", "yes")
TRUST_PROXY = os.environ.get("PLATFORM_TRUST_PROXY", "0") in ("1", "true", "yes")
# 允许访问的域名（逗号分隔）；反代场景可配合 PLATFORM_TRUST_PROXY=1 使用
ALLOWED_HOSTS = [h.strip().lower() for h in
                 (os.environ.get("PLATFORM_ALLOWED_HOSTS") or "").split(",") if h.strip()]
# 绑定回环且未信任反代时，校验 Host 头防 DNS rebinding；反代/域名访问需放行
HOST_CHECK = os.environ.get("PLATFORM_HOST_CHECK", "1") not in ("0", "false", "no")

# 访问日志
ACCESS_LOG = os.environ.get("PLATFORM_ACCESS_LOG", "1") not in ("0", "false", "no")
MAX_BODY = int(os.environ.get("PLATFORM_MAX_BODY", str(2 * 1024 * 1024)))
MAX_CONN = int(os.environ.get("PLATFORM_MAX_CONN", "128"))
REQUEST_TIMEOUT = int(os.environ.get("PLATFORM_REQUEST_TIMEOUT", "20"))


def ensure_dirs():
    for p in (DATA, EXPORT_DIR, LOG_DIR, BACKUP_DIR):
        try:
            os.makedirs(p, exist_ok=True)
        except Exception:
            pass
