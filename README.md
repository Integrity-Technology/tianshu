# 天枢 · 大模型内容安全攻防平台 部署包

版本 **v1.0.16** ｜ 构建日期 2026-11-13 ｜ 纯净部署包

本包只包含运行代码、Web 控制台、部署资产与运维工具，不含数据库、日志、导出、
测试/审计脚本、缓存与任何口令、令牌、API Key。

## 许可证与使用限制

本项目采用自定义非商业使用许可证（Non-Commercial Software License，NCSL 1.0）。

完整授权条款请参阅项目根目录下的 `LICENSE` 文件。

### 允许的使用方式

- 个人学习、研究及技术交流；
- 非商业性质的测试与评估；
- 学术研究及教育用途；
- 在遵守 `LICENSE` 条款的前提下进行非商业性修改和使用。

### 禁止的使用方式

未经版权所有者事先书面授权，禁止以下行为：

- 将本项目用于商业产品或商业服务；
- 将本项目或其任何部分集成到商业软件、安全产品或其他收费产品中；
- 将本项目用于企业商业生产环境；
- 将本项目用于 OEM、ODM、贴牌或商业分发；
- 基于本项目提供收费部署、托管或技术服务；
- 将本项目的代码或衍生作品用于开发、运营商业竞争产品。

### 商业授权

如需将本项目用于商业用途，包括商业部署、产品集成、OEM 交付、商业销售及其他商业应用，请事先联系版权所有者并取得书面商业授权。

商业授权的范围、期限及费用以双方另行签署的书面协议为准。

### 版权声明

本项目及其相关代码、文档和部署资产的权利归相应版权所有者所有。

未经明确授权，任何组织或个人不得超出 `LICENSE` 授予的范围使用本项目。

## 目录

```text
tianshu-v1.0.16/
├─ 部署文档.md / 部署文档.docx   部署与运维手册（先读这个）
├─ 操作说明.md / 操作说明.docx   平台操作与使用方法
├─ reqs.py                       需求覆盖数据源（167 条）
├─ README.md                     本文件
├─ VERSION / CHANGELOG.md        版本与变更记录
├─ MANIFEST.txt                 文件清单（路径、大小、SHA256）
├─ SHA256SUMS.txt               文件校验清单
└─ platform/                    平台程序（服务、前端、部署资产、ops.py）
```

## 快速启动

Windows：

```bat
cd /d D:\tianshu-v1.0.16\platform
deploy\start.bat
```

Linux：

```bash
cd tianshu-v1.0.16/platform
bash deploy/start.sh
```

Docker Compose：

```bash
cd tianshu-v1.0.16/platform/deploy
cp .env.example .env && chmod 600 .env
vi .env
docker compose up -d --build
```

默认访问 <http://127.0.0.1:8848>，默认管理员 `admin` / `Admin@123456`，
首次登录必须修改口令。生产部署前请阅读《部署文档》第 14 节安全加固清单。

## 校验

```bash
sha256sum -c SHA256SUMS.txt
```

## 文档

- `部署文档.md` / `部署文档.docx`：Windows、Linux systemd、Docker Compose、K8s 全路径部署，
  含 Nginx TLS、环境变量、备份恢复、升级回滚、监控巡检与 FAQ；
- `操作说明.md` / `操作说明.docx`：登录、15 个功能页面的操作方法与典型场景；
- `platform/README.md`：平台功能、页面、接口与实现说明；
- `platform/deploy/README.md`：部署资产速查与 K8s 清单说明。
