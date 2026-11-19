# 第三方防护工具对接样例（R-3.8.4-05）

平台「防护插件」支持热插拔接入第三方内容安全能力，提供两种协议样例：

| 协议 | 文件 | 说明 |
| --- | --- | --- |
| HTTP/JSON | `guard_http.py` | 请求 `{text,stage,request_id}`；响应经 `normalize()` 归一化为 `{blocked,risk,labels,vendor}`，内置阿里云 / 腾讯天御 / 自建 YAML 三种映射 |
| gRPC | `guard.proto` | `ContentGuard.CheckInput/CheckOutput`，字段与 HTTP 契约一一对应；用 `grpc_tools.protoc` 生成客户端 |

平台侧接入步骤：
1. 「防护插件」页 → 新增插件 → 填 endpoint / 鉴权 / 超时 / 失败策略（fail-open/fail-close）；
2. 选择作用域（请求级 / 会话级 / 全局级）与强度；
3. 用「A/B 对比」在同一批样本上开关插件，比较拦截率与漏报率。

> 说明：本目录是可执行样例与 IDL，生产接入需替换为厂商真实端点与凭据；无第三方服务时脚本会输出归一化契约而不报错。
