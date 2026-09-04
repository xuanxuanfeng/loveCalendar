# loveCalendar 项目改进计划

基于 Better Harness 分析报告（2026-09-04），按优先级排列。

---

## 阶段 1：项目指导文件（对应发现 #3，预计 0.5 天）

**目标：** 创建 AGENTS.md，消除每次会话的重复上下文推导。

### 任务

- [ ] 在项目根目录创建 `AGENTS.md`，包含：
  - 项目概述：情侣纪念日微信小程序
  - 技术栈：微信小程序原生 + 云开发（环境 ID `dev-5gu57acl6acc6a6b`）
  - 模块边界：`miniprogram/` 前端 vs `cloudfunctions/` 后端
  - 页面清单与 tabBar 结构（4 个 tab 页：日历、小厨房、纪念日、我们）
  - 高风险文件路由：`index.js`、`calendar` 组件、`cloud.js`
  - 数据库集合名：`users`、`records`、`anniversaries`、`couples`、`coupleRequests`
  - 关键约定：图片上限 9 张、内容 1000 字、名称 50 字
- [ ] 在 `cloudfunctions/` 下创建 `AGENTS.md`，列出 30 个云函数的职责分组

### 验收

新会话中 Agent 能直接引用 AGENTS.md 信息，无需重新探索项目结构。

---

## 阶段 2：最小测试基础设施（对应发现 #1，预计 2 天）

**目标：** 为最高频变更的代码建立行为验证基线。

### 任务

- [ ] 在 `miniprogram/` 下建立测试目录结构
  ```
  miniprogram/__tests__/
    pages/
      index.test.js
      anniversaries.test.js
    components/
      calendar.test.js
    utils/
      date.test.js
      countdown.test.js
      validator.test.js
  ```
- [ ] 选择测试框架（推荐 miniprogram-simulate + jest）
- [ ] 编写第一批测试，覆盖核心数据流：
  - `utils/date.js` — 日期格式化、月份计算
  - `utils/countdown.js` — 倒计时计算
  - `utils/validator.js` — 字段校验
  - `pages/index/index.js` — 数据加载、月份切换
  - `components/calendar/calendar.js` — 日期渲染、点击事件
- [ ] 在 `package.json` 中添加 `test` 脚本

### 验收

- `npm test` 能运行并全部通过
- 修改 `date.js` 的一个逻辑，测试能捕获回归

---

## 阶段 3：云函数契约校验（对应发现 #2，预计 1 天）

**目标：** 为 CRUD 配对函数建立共享校验，消除隐式契约依赖。

### 任务

- [ ] 提取 `createRecord` / `updateRecord` 的共同字段校验到共享模块
  ```
  cloudfunctions/shared/validators/record.js
  ```
- [ ] 提取 `createAnniversary` / `updateAnniversary` 的共同校验
  ```
  cloudfunctions/shared/validators/anniversary.js
  ```
- [ ] 提取 `createDish` / `updateDish` 的共同校验
  ```
  cloudfunctions/shared/validators/dish.js
  ```
- [ ] 各 create/update 云函数引用共享校验模块，删除重复逻辑
- [ ] 为共享校验模块编写单元测试

### 验收

- 修改一个字段名，create 和 update 两端的校验同步更新
- 共享校验模块的测试全部通过

---

## 阶段 4：组件接口契约（对应发现 #4，预计 1 天）

**目标：** 为日历组件定义明确的接口边界，约束变更影响范围。

### 任务

- [ ] 在 `miniprogram/components/calendar/` 下创建 `README.md`，文档化：
  - 组件 properties（输入）
  - 组件 triggers/events（输出）
  - 使用示例
- [ ] 编写组件级测试（阶段 2 基础设施上），覆盖：
  - 日期渲染正确性
  - 点击事件传递
  - 月份切换边界（跨年、跨月）
  - properties 变更后的重新渲染
- [ ] 梳理所有消费 calendar 组件的页面，确认接口一致性

### 验收

- 修改 calendar 内部逻辑，组件测试能捕获接口变更
- 所有消费页面的调用方式与文档一致

---

## 阶段 5：环境就绪性文档（对应发现 #5，预计 0.5 天）

**目标：** 文档化开发环境设置和云函数部署路径。

### 任务

- [ ] 在项目根目录创建 `docs/setup.md`，包含：
  - 微信开发者工具安装与配置
  - 云环境初始化（环境 ID、开通服务）
  - 数据库集合创建与权限规则（引用 `database-rules.json`）
  - 云函数部署命令（逐个或批量）
  - 测试数据初始化方法
- [ ] 可选：创建 `scripts/deploy.sh` 批量部署云函数脚本

### 验收

- 新开发者能按文档独立完成环境设置
- Agent 能引用文档执行云函数部署

---

## 执行顺序与依赖

```
阶段 1（AGENTS.md）  ──→  无依赖，立即执行
阶段 2（测试基础设施）──→  无依赖，可与阶段 1 并行
阶段 3（契约校验）  ──→  依赖阶段 2 的测试基础设施
阶段 4（组件契约）  ──→  依赖阶段 2 的测试基础设施
阶段 5（环境文档）  ──→  无依赖，可随时执行
```

**建议执行顺序：** 1 → 2 → (3 + 4 并行) → 5

**总预计工时：** 5 天
