"""导出文件下载签名：URL 带短时校验参数，避免仅凭可预测文件名下载他人导出。"""
import hashlib
import hmac
import secrets
import time

_SECRET = secrets.token_hex(32)


def sign(fn, ttl=3600):
    exp = int(time.time()) + int(ttl)
    msg = "%s|%s" % (fn, exp)
    sig = hmac.new(_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()[:32]
    return "%s?exp=%s&sig=%s" % (fn, exp, sig)


def verify(fn, exp, sig):
    try:
        exp = int(exp or 0)
    except (TypeError, ValueError):
        return False
    if exp < int(time.time()):
        return False
    msg = "%s|%s" % (fn, exp)
    want = hmac.new(_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()[:32]
    return hmac.compare_digest(want, str(sig or ""))
