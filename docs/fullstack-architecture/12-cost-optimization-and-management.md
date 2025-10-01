# 12. 成本優化與管理

*   **按需缩放 (Autoscaling):** Azure App Service 将配置自动缩放规则，在流量高峰期自动增加实例数量，在流量低谷期自动减少，以确保性能的同时优化成本。
*   **选择合适的层级 (Tier Selection):** 为 Staging 和 Production 环境选择不同性能和成本的服务层级。例如，为数据库选择“突发”性能层级以降低开发成本。
*   **成本预算与告警:** 在 Azure Cost Management 中设置每月预算，并在支出接近预算时自动发送告警，以避免意外的成本超支。
*   **资源标记 (Tagging):** 所有 Azure 资源都将使用一致的标签（如 `environment=production`, `project=IT-PM-Platform`）进行标记，以便我们能精确地分析和归属成本。
