# syntax=docker/dockerfile:1
# 天枢 · 大模型内容安全攻防平台  生产镜像
FROM python:3.13-slim

LABEL org.opencontainers.image.title="TianShu LLM Security Platform" \
      org.opencontainers.image.version="1.0.16" \
      org.opencontainers.image.description="大模型内容安全攻击、评估与防护验证平台（零依赖 Python）"

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONIOENCODING=utf-8 \
    PLATFORM_HOST=0.0.0.0 \
    PLATFORM_PORT=8848 \
    PLATFORM_DATA=/app/data \
    PLATFORM_AUTH=on

WORKDIR /app
COPY . /app

RUN groupadd -g 10001 tianshu \
 && useradd -u 10001 -g 10001 -M -s /usr/sbin/nologin tianshu \
 && mkdir -p /app/data \
 && chown -R 10001:10001 /app/data \
 && chmod +x /app/deploy/*.sh

USER 10001:10001
EXPOSE 8848
VOLUME ["/app/data"]

# 就绪探针：数据库可用 + 认证模式可见
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD python /app/tools/ops.py health --url http://127.0.0.1:8848 || exit 1

CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "8848"]
