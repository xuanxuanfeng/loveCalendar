# 情侣纪念日小程序

情侣纪念日微信小程序，支持日历记录、纪念日管理、情侣绑定和小厨房功能。

## 技术栈

- **前端**: 微信小程序原生（WXML + WXSS + JavaScript）
- **后端**: 微信云开发（Cloud Functions / Cloud Database / Cloud Storage）
- **云环境 ID**: `dev-5gu57acl6acc6a6b`
- **Node.js**: 18.15（云函数运行时）

## 模块边界

```
loveCalendar/
├── miniprogram/          # 前端小程序
│   ├── app.js            # 应用入口，初始化云环境
│   ├── app.json          # 页面路由、tabBar、窗口配置
│   ├── pages/            # 14 个页面
│   ├── components/       # 3 个组件（calendar, cloudbase-badge, page-header）
│   ├── utils/            # 工具模块
│   └── images/           # 静态资源
├── cloudfunctions/       # 30 个云函数
│   └── AGENTS.md         # 云函数职责说明
└── docs/                 # 文档
```

**关键约束**: 前端和后端是两个独立的运行时环境。`miniprogram/` 运行在微信客户端，`cloudfunctions/` 运行在微信云服务器。它们通过 `wx.cloud.callFunction()` 通信。

## TabBar 页面

| Tab | 页面路径 | 功能 |
|-----|---------|------|
| 日历 | `pages/index/index` | 主页，日历视图 + 当日记录 |
| 小厨房 | `pages/kitchen/kitchen` | 菜品管理 + 每日菜单投票 |
| 纪念日 | `pages/anniversaries/anniversaries` | 纪念日列表 + 倒计时 |
| 我们 | `pages/couple-bind/couple-bind` | 情侣绑定 + 关系管理 |

## 高风险文件

修改以下文件前需特别谨慎，它们影响范围大或变更频率高：

| 文件 | 原因 |
|------|------|
| `miniprogram/pages/index/index.js` | 主页逻辑，变更最频繁（churn 648），调用多个云函数 |
| `miniprogram/components/calendar/calendar.js` | 共享组件，被 6+ 页面引用，变更波及所有消费者 |
| `miniprogram/utils/cloud.js` | 所有云函数调用的统一封装，修改影响全局 |
| `miniprogram/utils/constants.js` | 全局常量（集合名、限制值），修改需同步前后端 |
| `cloudfunctions/createRecord/index.js` | 核心 CRUD，与 updateRecord 共享隐式契约 |

## 数据库集合

| 集合名 | 用途 | 权限 |
|--------|------|------|
| `users` | 用户资料 | 本人读写 |
| `records` | 日历记录 | 本人 + 情侣读写 |
| `anniversaries` | 纪念日 | 本人 + 情侣读写 |
| `couples` | 情侣关系 | 双方读写 |
| `coupleRequests` | 绑定请求 | 请求双方读写 |

权限规则定义在 `cloudfunctions/database-rules.json`，需在云开发控制台配置。

## 关键约定

- 图片上限: **9 张**（`MAX_IMAGES`）
- 记录内容: **1000 字**（`MAX_CONTENT_LENGTH`）
- 纪念日名称: **50 字**（`MAX_NAME_LENGTH`）
- 日期格式: `YYYY-MM-DD`
- 图片存储: `cloud://` 前缀路径
- 云函数返回格式: `{ success: boolean, error?: string, ...data }`
- 前端调用云函数: 统一使用 `utils/cloud.js` 的 `callCloud()` 方法

## 云函数调用模式

```javascript
// 前端调用
const { callCloud } = require('../../utils/cloud')
const result = await callCloud('createRecord', { date, content, images })

// 云函数返回
return { success: true, recordId: '...' }
return { success: false, error: '错误描述' }
```

## 本地缓存

应用使用 `wx.setStorageSync` / `wx.getStorageSync` 实现离线支持：
- `cache_calendar_data` — 日历数据缓存
- `cache_my_dishes` — 菜品列表缓存
- `cache_anniversaries` — 纪念日缓存

离线时显示顶部横幅提示"网络不可用，当前显示缓存数据"。
