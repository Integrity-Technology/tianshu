#!/usr/bin/env bash
# 前台启动（开发/单机裸机）。生产建议 systemd 或 docker compose。
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env ]; then set -a; . ./.env; set +a; fi
PYBIN="${PYTHON:-python3}"
"$PYBIN" - <<'EOF'
import sys
assert sys.version_info >= (3, 11), "需要 Python 3.11+，当前 %s" % sys.version.split()[0]
EOF
echo "[start] 版本 $(grep -o 'APP_VERSION = .*' config.py | head -1)  认证=${PLATFORM_AUTH:-on}"
exec "$PYBIN" server.py --host "${PLATFORM_HOST:-127.0.0.1}" --port "${PLATFORM_PORT:-8848}" "$@"
