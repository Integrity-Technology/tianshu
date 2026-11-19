#!/usr/bin/env bash
# 在线备份：默认保留 14 份，输出 data/backups/
set -euo pipefail
cd "$(dirname "$0")/.."
exec "${PYTHON:-python3}" tools/ops.py backup "$@"
