# 架构与数据流

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                  微信小程序客户端                      │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  页面层   │  │  组件层   │  │    工具层         │  │
│  │ 14 pages │  │ 3 comps  │  │ cloud.js         │  │
│  │          │  │ calendar │  │ date.js          │  │
│  │          │  │ page-hdr │  │ constants.js     │  │
│  │          │  │ cb-badge │  │ countdown.js     │  │
│  └────┬─────┘  └──────────┘  └────────┬─────────┘  │
│       │                                │            │
│       └──────── wx.cloud API ──────────┘            │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  微信云开发后端                        │
│                                                     │
│  ─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  云函数      │  │ 云数据库  │  │  云存储        │  │
│  │ 30 functions│  │ 8 集合    │  │ records/      │  │
│  │             │  │          │  │ dishes/       │  │
│  │ shared/     │  │          │  │               │  │
│  │ validators  │  │          │  │               │  │
│  └─────────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 前端数据流

### 应用启动

```
app.onLaunch()
  → wx.cloud.init({ env: 'dev-5gu57acl6acc6a6b' })
  → callCloud('initUser')
  → 写入 globalData: { userId, openid, isNewUser, userReady: true }
  → 创建 userReadyPromise
  → notifyPagesToUpdate() → 调用各页 onUserLogin()
```

### 页面数据加载

```
page.onLoad() / page.onShow()
  → await app.waitForUser()          // 等待用户初始化完成
  → wx.cloud.callFunction({ name, data })
  → 云函数返回 { success: true, ...data }
  → page.setData({ ... })
  → wx.setStorageSync(key, data)     // 可选：写入本地缓存
```

### 离线策略

| 缓存 Key | 页面 | 缓存内容 |
|----------|------|---------|
| `cache_calendar` / `cache_calendar_data` | index | `{ recordsMap, anniversariesMap }` |
| `cache_anniversaries` | index | 最近纪念日数组（前 3） |
| `cache_my_dishes` | kitchen | `{ myDishes, myDishCount }` |

离线时设置 `isOffline = true`，页面顶部显示黄色横幅提示。

## 云函数调用模式

### 统一封装（推荐）

```javascript
const { callCloud } = require('../../utils/cloud')
const result = await callCloud('createRecord', { date, content, images })
// 自动显示 loading，错误时 toast 提示
```

### 直接调用（部分页面使用）

```javascript
const res = await wx.cloud.callFunction({
  name: 'getCalendarData',
  data: { startDate, endDate }
})
const { success, ...data } = res.result
```

> **注意**：当前项目中两种调用方式并存，新代码应统一使用 `callCloud()`。

## 数据库集合与关系

```
users ──┬── couples ──┬── records
        │             ├── anniversaries
        │             ├── dishes
        │             └── menus
        └── coupleRequests
```

| 集合 | 权限模型 |
|------|---------|
| `users` | 仅本人读写 |
| `records` | 创建者 + 情侣双方读写 |
| `anniversaries` | 创建者 + 情侣双方读写 |
| `couples` | 关系双方读写 |
| `coupleRequests` | 请求双方读写 |
| `dishes` | 情侣双方读写 |
| `menus` | 情侣双方读写 |
| `recordVersions` | 系统写入，本人读取 |

## 情侣数据隔离模式

所有查询类云函数遵循统一模式：

```
1. 获取当前用户 openId
2. 查询 couples 集合，获取情侣关系
3. 有情侣关系 → 用 coupleOpenids 数组查询双方数据
4. 无情侣关系 → 仅查询本人数据
```

## 云函数分组

| 分组 | 数量 | 函数 |
|------|------|------|
| 用户管理 | 4 | getOpenId, getOpenIdByPhone, initUser, deleteImages |
| 情侣关系 | 3 | manageCouple, handleCoupleRequest, getOpenIdByPhone |
| 日历记录 CRUD | 8 | createRecord, updateRecord, deleteRecord, getRecordById, getRecordsByDate, getRecordsByDateRange, getRecordVersions, getCalendarData |
| 记录评论 | 2 | addRecordComment, getRecordComments |
| 纪念日 CRUD | 5 | createAnniversary, updateAnniversary, deleteAnniversary, getAllAnniversaries, getAnniversaries |
| 小厨房-菜品 | 4 | createDish, updateDish, deleteDish, getDishes |
| 小厨房-菜单投票 | 5 | createMenu, getMenu, getMenuHistory, voteMenu, decideMenu |

## 共享校验模块

CRUD 配对函数共享校验逻辑，位于 `cloudfunctions/shared/validators/`：

| 模块 | 配对函数 | 校验内容 |
|------|---------|---------|
| `record.js` | createRecord / updateRecord | 日期格式、内容长度 ≤1000、图片 ≤9 张、cloud:// 前缀 |
| `anniversary.js` | createAnniversary / updateAnniversary | 日期格式、名称 ≤50 字、倒数日 ≤20 个 |
| `dish.js` | createDish / updateDish | 名称 1-30 字、分类枚举、难度枚举 |

## 关键文件依赖

```
pages/index/index.js
  ├── components/calendar/calendar.js
  ├── utils/cloud.js (callCloud)
  ├── utils/date.js
  └── 云函数: getCalendarData, getAllAnniversaries, manageCouple

components/calendar/calendar.js
  └── 被 pages/index/index 唯一引用

utils/cloud.js
  └── 被 7 个页面引用（其余页面直接调 wx.cloud.callFunction）

utils/constants.js
  └── 被全局引用（集合名、限制值）
```
