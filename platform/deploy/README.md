# 天枢 · 大模型内容安全攻防平台 —— 部署与运维手册

版本 1.0.16 ｜ 适用：单机 Docker Compose、裸机 systemd、K8s（`deploy/k8s/`）
运行依赖：Python ≥ 3.11（镜像内置 3.13），SQLite 3，**无第三方 Python 包**。

> 完整部署步骤、首次初始化、备份恢复、升级回滚与安全加固见仓库根 `部署文档.md`
> （部署包内同名文件）；本文件是 `deploy/` 资产的速查说明。

---

## 1. 交付物与目录

| 路径 | 说明 |
| --- | --- |
| `server.py` | HTTP 服务入口（静态资源 + REST API + 认证/RBAC 强制） |
| `api*.py` | 业务路由（攻击任务、样本、评估、环境、模型、防护、开放能力等） |
| `auth.py` | 登录、会话、CSRF、RBAC、用户/角色/会话/登录日志 |
| `config.py` | 环境变量配置中心 |
| `db.py` | SQLite 建表与种子数据（WAL） |
| `web/` | 控制台前端（原生 JS，无需构建） |
| `tools/` | 运维与测试工具（`ops.py`、验收脚本） |
| `deploy/` | 部署包：Dockerfile、compose、Nginx、systemd、启停/备份脚本 |
| `data/` | 运行数据：`platform.db`、`logs/`、`exports/`、`backups/`（需持久化） |

默认监听 `127.0.0.1:8848`，公网访问统一由 Nginx/网关做 TLS 反代。

---

## 2. 方式 A：Docker Compose（推荐）

```bash
cd platform/deploy
cp .env.example .env
vi .env                      # 至少修改 PLATFORM_ADMIN_PASSWORD、PLATFORM_COOKIE_SECURE=1
docker compose up -d --build
docker compose ps            # STATUS 应为 healthy
curl -s http://127.0.0.1:8848/api/health
```

首次启动日志会打印初始管理员账号（仅数据库为空时创建）：

```bash
docker compose logs platform | grep INIT
```

要点：

- 数据卷 `tianshu-platform-data` 挂载到 `/app/data`，删除容器不丢数据；
- 容器以非 root（uid 10001）运行、`read_only: true` + `tmpfs /tmp`；
- 端口只绑定 `127.0.0.1:8848`，公网访问通过 Nginx TLS（见第 4 节）；
- 健康检查执行 `tools/ops.py health`，失败 3 次标记 unhealthy。

升级：

```bash
docker compose stop platform
python3 tools/ops.py backup --note "升级前"     # 或在容器内执行
docker compose build --pull
docker compose up -d
curl -s http://127.0.0.1:8848/api/health
```

回滚：`docker compose down` 后恢复上一版镜像 tag，并按第 6 节恢复备份。

---

## 3. 方式 B：裸机 systemd

```bash
useradd -r -s /usr/sbin/nologin tianshu
mkdir -p /opt/tianshu && cp -r platform /opt/tianshu/
mkdir -p /opt/tianshu/platform/data && chown -R tianshu:tianshu /opt/tianshu/platform/data
mkdir -p /etc/tianshu
cat > /etc/tianshu/platform.env <<'EOF'
PLATFORM_AUTH=on
PLATFORM_ADMIN_PASSWORD=<强口令>
PLATFORM_FORCE_PASSWORD_CHANGE=1
PLATFORM_COOKIE_SECURE=1
PLATFORM_TRUST_PROXY=1
PLATFORM_ALLOWED_HOSTS=tianshu.example.com
EOF
chmod 600 /etc/tianshu/platform.env
cp platform/deploy/platform.service /etc/systemd/system/tianshu.service
systemctl daemon-reload && systemctl enable --now tianshu
systemctl status tianshu --no-pager
curl -s http://127.0.0.1:8848/api/health
```

> 不要直接复制 `.env.example` 作为裸机环境文件：其中 `PLATFORM_DATA=/app/data` 是容器内路径，
> 裸机使用会导致日志/导出/备份目录不可写。未设置数据路径时默认使用 `platform/data/`。

单元文件已启用 `NoNewPrivileges`、`ProtectSystem=strict`、`PrivateTmp`，
仅 `data/` 可写；日志用 `journalctl -u tianshu -f` 查看。

Windows 单机可直接双击 `deploy/start.bat`，或用计划任务托管
`python server.py --host 127.0.0.1 --port 8848`。

---

## 4. Nginx TLS 反向代理

```bash
cp deploy/nginx.conf /etc/nginx/conf.d/tianshu.conf
# 把证书放到 /etc/nginx/certs/tianshu.crt|key，修改 server_name
nginx -t && systemctl reload nginx
```

- 80 端口 301 跳转 443；启用 HSTS；
- `/api/auth/login` 独立限速（10 次/分钟/IP），应用层另有 5 次失败锁定；
- `/mock/`、`/mcp` 对公网拒绝（应用层也有回环限制）；
- 长耗时接口（评估/攻击）读超时 300s；
- 反代后需设置 `PLATFORM_TRUST_PROXY=1`，否则 `Secure` Cookie 与
  `X-Forwarded-*` 不生效。

访问 `https://tianshu.example.com/login.html` 登录，未登录访问 `/` 会自动跳转。

---

## 5. 首次登录与账号

1. 打开 `/login.html`，使用 `PLATFORM_ADMIN_ACCOUNT` / `PLATFORM_ADMIN_PASSWORD` 登录；
2. `PLATFORM_FORCE_PASSWORD_CHANGE=1` 时强制跳转改密页，修改后才能进入控制台；
3. 进入「账号与安全」：
   - **用户管理**：新建/编辑/停用账号、重置密码（生成一次性临时密码）；
   - **角色与权限**：5 个内置角色（平台管理员/红队/蓝队/裁判/只读审计），
     可按「资源 × 动作」在线调整，保存后接口级立即生效；
   - **会话**：查看在线会话、强制下线；
   - **登录日志**：成功/失败记录（账号、IP、UA、原因）；
   - **安全设置**：密码策略、锁定策略、CSRF、Cookie 状态与本人改密。
4. 新建账号默认 `must_change=1`，首次登录必须改密。

> 内置管理员 `admin` 的权限矩阵不可编辑（防止把系统锁死），其余角色可自由调整。

---

## 6. 备份、恢复与巡检

工具：`tools/ops.py`（零依赖，跨平台）

```bash
python3 tools/ops.py health                     # 健康检查（监控探针可直接调用）
python3 tools/ops.py backup --keep 14 --note "发布前"
python3 tools/ops.py list                       # 查看备份与备注
python3 tools/ops.py verify data/backups/platform-20260101-120000.db
python3 tools/ops.py restore data/backups/platform-20260101-120000.db
```

- 备份使用 SQLite **在线备份 API**，WAL 模式下不阻塞读写，输出含完整性校验；
- 恢复前自动把当前库另存为 `pre-restore-*.db`；
- 服务运行中默认拒绝恢复，需先 `systemctl stop tianshu` 或
  `docker compose stop platform`（`--force` 可热恢复，不推荐）；
- 建议：每日 02:00 定时备份（cron / 计划任务），备份目录异地同步；
  保留 ≥ 14 天，重要发布前手动备份一次。

cron 示例：

```cron
0 2 * * * cd /opt/tianshu/platform && /usr/bin/python3 tools/ops.py backup --keep 30 >> data/logs/backup.log 2>&1
*/5 * * * * cd /opt/tianshu/platform && /usr/bin/python3 tools/ops.py health >/dev/null || echo "tianshu health fail" | mail -s alert ops@example.com
```

---

## 7. 环境变量速查

完整清单见 `deploy/.env.example`，关键项：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PLATFORM_AUTH` | `on` | 认证开关；`off` 仅限本机排障 |
| `PLATFORM_ADMIN_ACCOUNT/PASSWORD` | `admin` / `Admin@123456` | 首次初始化管理员（**必改**） |
| `PLATFORM_FORCE_PASSWORD_CHANGE` | `1` | 首次登录强制改密 |
| `PLATFORM_SESSION_TTL` | `28800` | 会话有效期（秒，滑动续期） |
| `PLATFORM_COOKIE_SECURE` | `auto` | HTTPS 部署建议 `1` |
| `PLATFORM_TRUST_PROXY` | `0` | 反代后设 `1`（信任 `X-Forwarded-*`、跳过回环 Host 校验） |
| `PLATFORM_ALLOWED_HOSTS` | 空 | 允许访问的域名（逗号分隔），反代未开 TRUST_PROXY 时放行 |
| `PLATFORM_HOST_CHECK` | `1` | Host 头校验开关（防 DNS rebinding；仅排障时关） |
| `PLATFORM_MAX_LOGIN_FAIL` / `LOCK_MINUTES` | `5` / `15` | 登录锁定策略 |
| `PLATFORM_LOGIN_RPM` | `30` | 单 IP 每分钟失败尝试上限（成功登录不计数） |
| `PLATFORM_PASSWORD_MIN` | `8` | 口令最小长度（且需 ≥3 类字符） |
| `PLATFORM_HSTS` | `0` | HTTPS 稳定后设 `1` |
| `PLATFORM_DATA` | `./data` | 数据目录（DB/日志/导出/备份） |

修改后重启服务生效。**`PLATFORM_ADMIN_PASSWORD` 只在数据库无管理员时生效**，
已有实例请用「重置密码」或 `tools/ops.py` 恢复。

---

## 8. 监控与日志

- 健康检查：`GET /api/health`（公开，返回 `status/db/version/auth/uptimeSec/sessions`）；
- 系统信息：`GET /api/system/info`（需登录，含用户数、在线会话、今日登录、审计数、DB 大小）；
- 访问日志：`data/logs/access.log`（时间、IP、账号、方法、路径、耗时，20MB 轮转）；
- 业务审计：`audit` 表 + 控制台「系统管理 → 审计日志」；
- 登录审计：`login_log` 表 + 「账号与安全 → 登录日志」；
- 容器日志：`docker compose logs -f platform`；systemd：`journalctl -u tianshu -f`。

建议监控项：`/api/health` 可用性、DB 文件大小、在线会话数、登录失败突增、
`sessions` 异常增长（撞库/暴力破解信号）。

---

## 9. 安全加固清单

- [ ] 修改默认管理员口令，关闭演示账号或改为强口令；
- [ ] `PLATFORM_COOKIE_SECURE=1`，全站 HTTPS，HTTP 301 跳转；
- [ ] `PLATFORM_TRUST_PROXY=1`（反代场景），确认 `X-Forwarded-Proto` 由网关写入；
- [ ] 生产保持 `PLATFORM_AUTH=on`，不要暴露 `PLATFORM_AUTH=off`；
- [ ] Nginx 拒绝 `/mock/`、`/mcp` 公网访问；MCP 仅在内网使用 API Key；
- [ ] 防火墙只放行 443（及运维跳板），8848 仅监听回环；
- [ ] 定期备份并演练恢复；备份文件按数据敏感级别加密存储；
- [ ] 账号按最小权限分配角色，离职/交接及时停用；
- [ ] 定期查看登录日志中的失败记录与异地 IP；
- [ ] 升级前备份，升级后跑一遍 `tools/` 验收脚本。

---

## 10. 常见问题

| 现象 | 排查 |
| --- | --- |
| 打开首页一直跳登录页 | 正常：未登录会 302 到 `/login.html`；登录后仍跳转请检查 Cookie 是否被浏览器拦截、`PLATFORM_COOKIE_SECURE=1` 但用 HTTP 访问 |
| 登录提示「账号已锁定」 | 连续 5 次密码错误锁定 15 分钟；等待或管理员在「用户管理」重置密码 |
| 写操作返回 4031 | CSRF 校验失败：确认前端带 `X-CSRF-Token`（控制台已内置），第三方调用请先登录拿会话并带 Cookie |
| 接口返回 403 4030 | 当前角色无该资源/动作权限，在「角色与权限」中调整 |
| 接口返回 403 4032 | 首次登录未改密，跳转 `login.html?force=1` 完成改密 |
| `/api/health` 正常但页面 404 | 静态资源目录 `web/` 未随包部署 |
| 容器 unhealthy | `docker compose logs platform`；确认 `data/` 可写、端口未被占用 |
| 恢复备份后登录失效 | 会话表随备份回滚属正常，重新登录即可；审计/登录日志同样回滚 |
| 反向代理后 IP 全是 127.0.0.1 | 设置 `PLATFORM_TRUST_PROXY=1` 并由 Nginx 传 `X-Real-IP`/`X-Forwarded-For` |

---

## 11. Kubernetes 部署（集群版）

`deploy/k8s/` 提供部署清单模板；apply 前需补齐 ServiceAccount、PVC 与 Secret 引用
（示例见仓库根 `部署文档.md` 第 7 节）：

| 文件 | 内容 |
| --- | --- |
| `00-namespace.yaml` | 命名空间 `tianshu-attack` |
| `10-platform.yaml` | Deployment（2 副本、非 root、只读根文件系统、资源限额）+ Service |
| `20-networkpolicy.yaml` | 默认拒绝 + 最小放行（仅 ingress 网关可访问 8848） |
| `30-range-pod.yaml` | 红蓝演练靶标 Pod（`runtimeClassName: kata`，强隔离） |
| `40-quota.yaml` | ResourceQuota + HPA（CPU 70% 扩容） |

```bash
kubectl apply -f deploy/k8s/00-namespace.yaml
kubectl -n tianshu-attack create secret generic platform-secrets \
  --from-literal=PLATFORM_ADMIN_PASSWORD='<强口令>'
kubectl apply -f deploy/k8s/
kubectl -n tianshu-attack rollout status deploy/tianshu-platform
```

注意：

- 镜像需替换为内网仓库地址（`10-platform.yaml` 中 `image:` 字段）；
- 需先创建 `tianshu-platform` ServiceAccount、`tianshu-data` PVC 与 `platform-secrets`，
  并为容器补充 Secret 环境变量引用；否则 Pod 会停留在 Pending/Forbidden，管理员口令回落到默认值；
- SQLite 为单写者模型，多副本部署时请使用 `ReadWriteOnce` PVC 并保持
  **单副本**（或改用外部数据库适配）；HPA 扩副本仅适用于读多写少的展示层，
  默认清单以单副本 + 重启自愈为主；
- `NetworkPolicy` 需要集群 CNI 支持（Calico/Cilium 等）；
- 演练靶标依赖 Kata Containers，未安装时可先不应用 `30-range-pod.yaml`。

## 12. 第三方防护工具对接

`deploy/adapters/` 提供 HTTP/JSON 与 gRPC 两种协议样例，用于把阿里云内容安全、
腾讯天御或自建审核服务接入「防护插件」：

- `guard.proto`：`ContentGuard.CheckInput/CheckOutput` 契约；
- `guard_http.py`：HTTP 适配器 + 厂商响应归一化（`blocked/risk/labels/vendor`）；
- 平台内「防护插件 → 新增插件」填写 endpoint/鉴权/超时/失败策略，支持
  A/B 对比拦截率与漏报率。

无第三方凭据时适配器只输出归一化契约、不发起真实调用，便于离线演示。

## 13. 离线 / 内网环境

- 平台本体零第三方依赖，复制目录 + Python 3.11+ 即可运行；
- 模型接入（DeepSeek 等）在「模型网关」配置 base_url 与 API Key，
  内网可指向自建代理/网关；未配置时评估走内置模拟通道；
- 前端无 CDN 依赖，全部静态资源随包提供；
- 备份/恢复/健康检查均为标准库实现，可离线执行。
