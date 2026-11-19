#!/usr/bin/env bash
# 健康检查（容器 HEALTHCHECK / 监控探针）
set -euo pipefail
cd "$(dirname "$0")/.."
exec "${PYTHON:-python3}" tools/ops.py health --url "${PLATFORM_HEALTH_URL:-http://127.0.0.1:8848}" "$@"
