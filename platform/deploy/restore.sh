#!/usr/bin/env bash
# 恢复备份（需先停止服务）
set -euo pipefail
cd "$(dirname "$0")/.."
if [ $# -lt 1 ]; then
  echo "用法: $0 data/backups/platform-YYYYmmdd-HHMMSS.db [--force]"
  exit 2
fi
exec "${PYTHON:-python3}" tools/ops.py restore "$@"
