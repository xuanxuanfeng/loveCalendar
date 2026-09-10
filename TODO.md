# 当前任务

## 活跃任务

> 基于 Better Harness 分析报告（2026-09-04）的改进计划已全部完成。以下为当前待办。

| 优先级 | 任务 | 状态 |
|--------|------|------|
| P0 | 修复云函数 CRUD 共享校验模块的 ESLint 问题 | 进行中 |
| P1 | 补充小厨房组件（dish-card、menu-vote）的接口文档 | 待开始 |
| P2 | 为 `pages/index/index.js` 编写集成测试 | 待开始 |
| P3 | 云函数批量部署脚本（`scripts/deploy.sh`） | 待开始 |

## 已完成

- [x] 创建 AGENTS.md（根目录 + cloudfunctions）
- [x] 建立测试基础设施（jest + miniprogram-simulate）
- [x] 提取 CRUD 共享校验模块（record / anniversary / dish）
- [x] 编写日历组件接口文档 + 组件测试
- [x] 创建开发环境设置文档（docs/setup.md）

## 技术债

| 项目 | 说明 |
|------|------|
| README.md 过时 | 页面数仍为 7（实际 14），缺少小厨房功能描述 |
| CSS 变量未统一 | `app.wxss` 定义了 `--primary-color` 等变量，但页面级 wxss 未使用 |
| 云函数调用方式不统一 | 部分页面用 `callCloud()`，部分直接调 `wx.cloud.callFunction()` |
