# -*- coding: utf-8 -*-
"""需求覆盖真相计算：一条需求 = 后端接口可复现 + 页面可操作。

判定规则（与 audit/ROUND2_BRIEF.md 一致）：
- done：该需求列举的接口全部已注册，且对应页面存在
- partial：接口部分存在
- missing：无接口
不再使用任何写死的「已实现」。
"""
import re

# 域 → [(接口正则, 页面 id, 说明)]
EVIDENCE = {
    "1": [("^/api/overview$", "dashboard", "架构分层与总览"), ("^/api/admin$", "admin", "分层与租户")],
    "2": [("^/api/models$", "models", "多协议模型接入"), ("^/api/defense$", "defense", "防护热插拔"),
          ("^/api/models/(\\d+)/probe$", "models", "动态挂载与探活")],
    "3.1.1": [("^/api/tasks/(\\d+)/turns$", "tasks", "上下文提取多轮明细"), ("^/api/tasks/(\\d+)/quality$", "tasks", "提取质量评分")],
    "3.1.2": [("^/api/kb/(\\d+)/docs$", "envs", "知识库文档与 ACL"), ("^/api/kb/(\\d+)/search$", "envs", "检索旁路与水印判定")],
    "3.2.1": [("^/api/encode$", "samples", "多层指令隐藏编码器"), ("^/api/samples/(\\d+)/split$", "samples", "载荷分片")],
    "3.2.2": [("^/api/tasks/(\\d+)/inject$", "tasks", "上下文劫持注入"), ("^/api/tasks/(\\d+)$", "tasks", "长程对话事件")],
    "3.3.1": [("^/api/tasks/(\\d+)/tools$", "tasks", "工具行为与权限判定")],
    "3.3.2": [("^/api/tasks/(\\d+)/tools$", "tasks", "工具链污染记录"), ("^/api/mcp/(\\d+)/scan$", "agents", "依赖关系欺骗检测")],
    "3.4.1": [("^/api/mcp/(\\d+)/scan$", "agents", "工具描述投毒扫描"), ("^/api/mcp$", "agents", "MCP 注册与回调")],
    "3.4.2": [("^/api/mcp/(\\d+)/invoke$", "agents", "同名/命名空间实测"), ("^/api/mcp$", "agents", "优先级与命名空间")],
    "3.5.1": [("^/api/scan/pickle$", "studio", "Pickle 反序列化扫描")],
    "3.5.2": [("^/api/infra$", "infra", "沙箱与容器隔离"), ("^/api/scan/url$", "studio", "网络策略探测")],
    "3.6.1": [("^/api/studio/templates$", "studio", "可视化编排与 DSL"), ("^/api/studio/validate$", "studio", "链路校验")],
    "3.6.2": [("^/api/studio/templates/(\\d+)/clone$", "studio", "模板化复用"),
              ("^/api/scene-matrix$", "studio", "六大攻击场景矩阵总览（R5 补充）")],
    "3.7.1": [("^/api/tasks/(\\d+)/turns$", "tasks", "攻击链还原"), ("^/api/cases$", "tasks", "真实案例库"),
              ("^/api/tasks/(\\d+)/quality$", "tasks", "三维评分"),
              ("^/api/intel$", "tasks", "威胁情报接入与用例转化（R5 补充）")],
    "3.7.2": [("^/api/evals$", "evals", "评估任务创建"), ("^/api/evals/(\\d+)/report$", "evals", "报告与热力矩阵"),
              ("^/api/evals/(\\d+)/logs$", "evals", "实时日志"), ("^/api/evals/(\\d+)/simulate$", "evals", "多轮用户模拟"),
              ("^/api/eval-rules$", "evals", "自定义规则库")],
    "3.8.1": [("^/api/models$", "models", "多厂商协议统一纳管")],
    "3.8.2": [(r"^/api/env-config/(\d+)$", "envs", "环境参数化"), ("^/api/env-templates$", "envs", "模板复用"),
              ("^/api/envs/from-template$", "envs", "模板实例化")],
    "3.8.3": [("^/api/infra$", "infra", "资源与容器纳管"), ("^/api/infra/containers/(\\d+)/action$", "infra", "容器启停"),
              ("^/api/infra/containers/(\\d+)/console$", "infra", "Web 控制台")],
    "3.8.4": [("^/api/defense$", "defense", "防护插件热插拔"), ("^/api/plugins/(\\d+)/versions$", "defense", "插件版本"),
              ("^/api/defense/policy$", "defense", "策略分级")],
    "3.9.1": [("^/api/samples/generalize$", "samples", "泛化引擎"), ("^/api/components$", "samples", "五维组件"),
              ("^/api/encode$", "samples", "普通/高级混淆"), ("^/api/generate$", "samples", "三种生成模式")],
    "3.9.2": [("^/api/samples$", "samples", "样本 CRUD"), ("^/api/sample-libs$", "samples", "样本库管理"),
              ("^/api/reflow$", "samples", "数据回流"), ("^/api/clean/run$", "samples", "真实清洗"),
              ("^/api/samples/sync$", "samples", "远程同步"), ("^/api/sample-cats$", "samples", "分类树")],
    "3.10.1": [("^/api/agents$", "agents", "智能体管理"), ("^/api/agents/(\\d+)/chat$", "agents", "真实对话"),
               ("^/api/agents/(\\d+)/tactic$", "agents", "战术编排"), ("^/api/agents/(\\d+)/chain$", "agents", "复合攻击链"),
               ("^/api/skills$", "agents", "skill 创建"), ("^/api/mcp$", "agents", "MCP 注册")],
    "3.10.2": [("^/api/tasks$", "tasks", "任务历史"), ("^/api/tasks/(\\d+)/rerun$", "tasks", "幂等重跑"),
               ("^/api/tasks/(\\d+)/report$", "tasks", "任务报告")],
    "3.10.3": [("^/api/sample-cats$", "samples", "TC260 分类树"), ("^/api/sample-libs$", "samples", "样本库"),
               ("^/api/samples/import$", "samples", "导入")],
    "3.11.1": [("^/api/evals/(\\d+)/report$", "evals", "风险全覆盖判定")],
    "3.11.2": [("^/api/evals/benchmark$", "evals", "多模型横向对标"), ("^/api/evals/benchmark/run$", "evals", "基准重算")],
    "3.11.3": [("^/api/evals/(\\d+)/export$", "evals", "报告导出"), ("^/api/tasks/(\\d+)/export$", "tasks", "导出")],
    "3.12.1": [("^/api/models$", "models", "攻击侧接口统一管理"), ("^/api/models/(\\d+)/probe$", "models", "连通性校验"),
               ("^/api/models/(\\d+)/invoke$", "models", "统一调用")],
    "3.12.2": [("^/api/infra$", "dashboard", "监控驾驶舱"), ("^/api/infra/alerts/(\\d+)/ack$", "infra", "告警确认")],
    "3.12.3": [("^/api/cost$", "dashboard", "成本计量"), ("^/api/cost/report$", "dashboard", "多维成本报表"),
               ("^/api/quota$", "infra", "预算配额熔断")],
    "3.13.1": [("^/api/data$", "data", "四类数据结构化留存")],
    "3.13.2": [("^/api/data/export$", "data", "JSONL 导出"), ("^/api/data/export/parquet$", "data", "Parquet 导出")],
    "3.14.1": [("^/api/tenant/whoami$", "admin", "多租户"), ("^/api/admin$", "admin", "RBAC 与审计"),
               ("^/api/tenant/switch$", "admin", "租户切换"),
               ("^/api/exercises$", "admin", "红蓝对抗演练与计分卡（R5 补充）")],
    "3.14.2": [("^/api/envs$", "envs", "资源池与沙箱"), ("^/api/infra$", "infra", "容器与硬隔离")],
    "3.14.3": [("^/api/envs$", "envs", "测试环境"), ("^/api/studio/templates$", "studio", "工作流/DSL"),
               ("^/api/images$", "envs", "镜像导入"), ("^/api/knowledge$", "envs", "知识库"),
               ("^/api/tools$", "envs", "自定义工具")],
    "3.15.1": [("GET ^/api/open/keys$", "open", "密钥列表"), ("POST ^/api/open/keys$", "open", "密钥签发"),
               ("^/api/open/keys/(\\d+)/rotate$", "open", "轮换"),
               ("^/api/open/security$", "open", "安全策略")],
    "3.15.2": [("^/api/auth/check$", "open", "服务端鉴权"), ("^/api/auth/policy$", "open", "IP/限流/TTL"),
               ("^/api/auth/log$", "open", "鉴权审计")],
    "3.15.3": [("^/mcp$", "open", "MCP Server JSON-RPC"), ("^/api/open/contracts$", "open", "契约清单")],
    "3.15.4": [("^/openapi.json$", "open", "OpenAPI 3.0"), ("^/api/samples/page$", "samples", "分页"),
               ("^/api/open/async-upload$", "open", "异步上传"), ("^/api/open/async/(\\w+)$", "open", "异步轮询")],
    "3.15.5": [("^/api/data/export$", "data", "CSV/PDF/Word 导出"), ("^/api/features$", "data", "特征库"),
               ("^/api/features/sync$", "data", "增量同步")],
    "4": [("^/api/infra$", "infra", "性能与容量"), ("^/api/clean/run$", "samples", "十万级清洗")],
}


import os

_WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web", "pages")


def _routes():
    """返回 (method, pattern) 列表：覆盖判定必须同时看方法与页面，不能只看正则。"""
    import api
    return [(r[0], r[1]) for r in api.ROUTES]


def _page_exists(page):
    return bool(page) and os.path.isfile(os.path.join(_WEB, page + ".js"))


def status(code):
    """返回 (status, evidence[], pages[])；已实现 = 方法+路由命中 且 落地页面存在。"""
    m = re.match(r"R-(\d+(?:\.\d+)*)-\d+$", code)
    dom = m.group(1) if m else ""
    ev = EVIDENCE.get(dom)
    if not ev:
        return "未实现", [], []
    routes = _routes()
    hit, miss, pages = [], [], []
    for rx, page, desc in ev:
        method = None
        if rx.startswith(("GET ", "POST ", "PUT ", "DELETE ")):
            method, rx = rx.split(" ", 1)
        probe = (rx.replace("(\\d+)", "1").replace("(\\w+)", "demo")
                 .replace("^", "").replace("$", ""))
        route_ok = any((method is None or mm == method) and re.match(r, probe) for mm, r in routes)
        if route_ok and _page_exists(page):
            hit.append(desc)
            pages.append(page)
        else:
            why = "页面缺失" if route_ok and not _page_exists(page) else "接口缺失"
            miss.append("%s（%s）" % (desc, why))
    if not miss:
        return "已实现", hit, sorted(set(pages))
    if hit:
        return "部分实现", hit, sorted(set(pages))
    return "未实现", [], []


# 第四批能力（RBAC / SBOM / RAG 投毒 / 插件 A-B）的覆盖证据
_ADD_EVIDENCE = {
    "3.1.2": [("^/api/rag/poison$", "data", "RAG 投毒文档注入与列表"),
              ("^/api/rag/query$", "data", "检索泄露验证与水印判定")],
    "3.5.1": [("^/api/supply/sbom$", "admin", "SBOM 组件清单与许可证风险")],
    "3.8.4": [("^/api/defense/ab$", "defense", "插件关闭/开启 A-B 净收益对比")],
    "3.14.1": [("^/api/admin/rbac$", "admin", "RBAC 三级权限矩阵"),
               ("^/api/auth/check$", "admin", "三级授权校验与审计日志")],
}
for _k, _v in _ADD_EVIDENCE.items():
    EVIDENCE.setdefault(_k, [])
    for _it in _v:
        if _it not in EVIDENCE[_k]:
            EVIDENCE[_k].append(_it)
