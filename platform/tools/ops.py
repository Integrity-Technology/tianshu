#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""平台运维工具（零依赖）：健康检查 / 在线备份 / 恢复 / 备份校验 / 清理。

用法：
    python tools/ops.py health [--url http://127.0.0.1:8848] [--json]
    python tools/ops.py backup [--keep 14] [--note "发布前"]
    python tools/ops.py list
    python tools/ops.py verify <backup.db>
    python tools/ops.py restore <backup.db> [--force]

说明：
  - backup 使用 SQLite 在线备份 API（WAL 安全，不阻塞读），输出到 data/backups/；
  - restore 会先做完整性校验，并把当前库另存为 pre-restore-*.db，再原子替换；
  - restore 默认拒绝在服务运行中执行（可用 --force 强制，风险自负）。
"""
import argparse
import datetime as dt
import glob
import json
import os
import shutil
import sqlite3
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
DATA = os.environ.get("PLATFORM_DATA") or os.path.join(BASE, "data")
DB = os.environ.get("PLATFORM_DB") or os.path.join(DATA, "platform.db")
BACKUP_DIR = os.environ.get("PLATFORM_BACKUP_DIR") or os.path.join(DATA, "backups")


def _now():
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


# ---------------------------------------------------------------- health
def health(url="http://127.0.0.1:8848", as_json=False):
    url = url.rstrip("/") + "/api/health"
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            body = r.read().decode("utf-8")
            data = json.loads(body)
    except (urllib.error.URLError, OSError, ValueError) as e:
        print(json.dumps({"ok": False, "error": str(e), "url": url}, ensure_ascii=False))
        return 1
    d = data.get("data") or {}
    ok = data.get("code") == 0 and d.get("status") == "ok"
    out = {"ok": ok, "url": url, "status": d.get("status"), "db": d.get("db"),
           "version": d.get("version"), "auth": d.get("auth"),
           "uptimeSec": d.get("uptimeSec"), "sessions": d.get("sessions")}
    print(json.dumps(out, ensure_ascii=False, indent=2) if as_json
          else ("OK  版本 %s 认证 %s 运行 %s 秒 会话 %s" %
                (out["version"], out["auth"], out["uptimeSec"], out["sessions"])))
    return 0 if ok else 1


# ---------------------------------------------------------------- backup
def _open(db_path, mode="ro"):
    if mode == "ro":
        return sqlite3.connect("file:%s?mode=ro" % db_path.replace("\\", "/"), uri=True, timeout=10)
    return sqlite3.connect(db_path, timeout=30)


def backup(keep=14, note=""):
    if not os.path.isfile(DB):
        print("[backup] 数据库不存在：%s" % DB)
        return 2
    os.makedirs(BACKUP_DIR, exist_ok=True)
    name = "platform-%s.db" % _now()
    dst = os.path.join(BACKUP_DIR, name)
    tmp = dst + ".tmp"
    src = _open(DB, "ro")
    out = sqlite3.connect(tmp)
    try:
        src.backup(out)                      # 在线备份，WAL 一致
        out.execute("PRAGMA wal_checkpoint(FULL)")
        out.commit()
        ok = out.execute("PRAGMA integrity_check").fetchone()[0]
    finally:
        out.close()
        src.close()
    if ok != "ok":
        os.remove(tmp)
        print("[backup] 完整性校验失败：%s" % ok)
        return 3
    os.replace(tmp, dst)
    meta = {"file": name, "bytes": os.path.getsize(dst), "at": dt.datetime.now().isoformat(" "),
            "note": note, "integrity": ok, "version": _version()}
    with open(dst + ".json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    removed = _prune(keep)
    print("[backup] 完成：%s（%.1f MB，完整性 %s）" %
          (dst, os.path.getsize(dst) / 1048576.0, ok))
    if removed:
        print("[backup] 清理旧备份 %d 个（保留 %d）" % (removed, keep))
    return 0


def _version():
    try:
        sys.path.insert(0, BASE)
        import config
        return config.APP_VERSION
    except Exception:
        return "unknown"


def _prune(keep):
    files = sorted(glob.glob(os.path.join(BACKUP_DIR, "platform-*.db")))
    if keep <= 0 or len(files) <= keep:
        return 0
    n = 0
    for fp in files[:-keep]:
        for p in (fp, fp + ".json"):
            try:
                if os.path.isfile(p):
                    os.remove(p)
            except OSError:
                pass
        n += 1
    return n


def list_backups():
    files = sorted(glob.glob(os.path.join(BACKUP_DIR, "platform-*.db")))
    if not files:
        print("（暂无备份，目录：%s）" % BACKUP_DIR)
        return 0
    print("%-28s %10s  %s" % ("备份文件", "大小", "元数据"))
    for fp in files:
        size = os.path.getsize(fp) / 1048576.0
        note = ""
        try:
            with open(fp + ".json", encoding="utf-8") as f:
                note = json.load(f).get("note") or ""
        except Exception:
            pass
        print("%-28s %8.2fMB  %s" % (os.path.basename(fp), size, note))
    return 0


def verify(path):
    if not os.path.isfile(path):
        print("[verify] 文件不存在：%s" % path)
        return 2
    c = _open(path, "ro")
    try:
        ok = c.execute("PRAGMA integrity_check").fetchone()[0]
        tables = c.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'").fetchone()[0]
        users = c.execute("SELECT COUNT(*) FROM user").fetchone()[0]
        tasks = c.execute("SELECT COUNT(*) FROM task").fetchone()[0]
        samples = c.execute("SELECT COUNT(*) FROM sample").fetchone()[0]
    except sqlite3.Error as e:
        print("[verify] 校验失败：%s" % e)
        return 3
    finally:
        c.close()
    print(json.dumps({"file": os.path.basename(path), "integrity": ok, "tables": tables,
                      "users": users, "tasks": tasks, "samples": samples},
                     ensure_ascii=False, indent=2))
    return 0 if ok == "ok" else 3


def _service_running():
    try:
        with urllib.request.urlopen("http://127.0.0.1:8848/api/health", timeout=3) as r:
            return r.status == 200
    except Exception:
        return False


def restore(path, force=False):
    if not os.path.isfile(path):
        print("[restore] 备份文件不存在：%s" % path)
        return 2
    rc = verify(path)
    if rc != 0:
        print("[restore] 备份校验不通过，终止恢复")
        return rc
    if _service_running() and not force:
        print("[restore] 检测到服务仍在运行（/api/health 可访问）。\n"
              "          请先停止服务（systemctl stop tianshu / docker compose stop），"
              "或加 --force 强制热恢复（不推荐）。")
        return 4
    os.makedirs(os.path.dirname(DB), exist_ok=True)
    pre = os.path.join(BACKUP_DIR, "pre-restore-%s.db" % _now())
    os.makedirs(BACKUP_DIR, exist_ok=True)
    had_pre = False
    if os.path.isfile(DB):
        shutil.copy2(DB, pre)
        had_pre = True
        for suffix in ("-wal", "-shm"):
            try:
                if os.path.isfile(DB + suffix):
                    os.remove(DB + suffix)
            except OSError:
                pass
    tmp = DB + ".restore.tmp"
    shutil.copy2(path, tmp)
    # 原子替换（同分区）
    try:
        os.replace(tmp, DB)
    except OSError as e:
        print("[restore] 替换失败：%s" % e)
        return 5
    print("[restore] 已恢复：%s" % path)
    if had_pre:
        print("[restore] 恢复前快照：%s" % pre)
    print("[restore] 请启动服务并检查 /api/health 与登录是否正常")
    return 0


def main():
    ap = argparse.ArgumentParser(description="天枢平台运维工具")
    sub = ap.add_subparsers(dest="cmd")
    p = sub.add_parser("health")
    p.add_argument("--url", default=os.environ.get("PLATFORM_HEALTH_URL", "http://127.0.0.1:8848"))
    p.add_argument("--json", action="store_true")
    p = sub.add_parser("backup")
    p.add_argument("--keep", type=int, default=14)
    p.add_argument("--note", default="")
    sub.add_parser("list")
    p = sub.add_parser("verify")
    p.add_argument("file")
    p = sub.add_parser("restore")
    p.add_argument("file")
    p.add_argument("--force", action="store_true")
    a = ap.parse_args()
    if a.cmd == "health":
        return health(a.url, a.json)
    if a.cmd == "backup":
        return backup(a.keep, a.note)
    if a.cmd == "list":
        return list_backups()
    if a.cmd == "verify":
        return verify(a.file)
    if a.cmd == "restore":
        return restore(a.file, a.force)
    ap.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
