# loveCalendar 完整重构计划

> 目标：修复已知缺陷、提取公共模块、新增"小厨房"功能、建立记录归属与版本追踪体系，最终形成可读性高、架构清晰、可扩展的小程序。

---

## 一、现状概览

| 维度 | 现状 | 目标 |
|------|------|------|
| 页面 | 7 个页面，无 tabBar | 引入 tabBar，5 个主入口 |
| 公共代码 | 无 utils，大量重复代码 | 提取 `utils/` 模块 |
| 数据库集合 | 5 个（users, records, anniversaries, couples, coupleRequests） | 新增 4 个（dishes, menus, menuVotes, recordVersions） |
| 云函数 | 17 个，无输入校验，部分权限漏洞 | 统一校验 + 新增厨房/版本相关函数 |
| 安全 | 图片删除无鉴权、情侣管理部分接口无权限检查 | 全面加固 |
| 时区处理 | 多处 `toISOString()` 导致 UTC 偏移 | 统一本地日期工具函数 |

---

## 二、分阶段实施

### Phase 1 — 缺陷修复（优先级：P0）

> 预计工时：1-2 天

#### 1.1 日历组件时区 Bug
**文件**：`miniprogram/components/calendar/calendar.js`

```
// 问题：toISOString() 按 UTC 转换，UTC+8 下日期可能偏移一天
// 修复：用本地格式化函数替代
```

- `onPrevMonth` / `onNextMonth` 中的 `date.toISOString().split('T')[0]` → 使用 `utils/date.js` 的 `formatDate(date)`
- 影响范围：日历月份切换、日期标记显示

#### 1.2 日历首页日期范围计算
**文件**：`miniprogram/pages/index/index.js`

- `getFirstDayOfMonth()` / `getLastDayOfMonth()` 使用 `new Date()` 而非当前展示月份
- 修复：传入当前展示的年月参数

#### 1.3 WXML 模板调用 JS 方法
**文件**：`miniprogram/pages/day-detail/day-detail.wxml`

- `{{formatTime(item.createdAt)}}` 在 WXML 中无法调用 JS 方法
- 修复：在 JS 层预处理数据，将格式化后的值附加到每条 record 上

#### 1.4 纪念日去重 Bug
**文件**：`cloudfunctions/getAllAnniversaries/index.js`

- 按名称去重会误删同名不同日期的纪念日
- 修复：改为按 `_id` 去重，或按 `name + date` 组合键去重

#### 1.5 情侣管理权限漏洞
**文件**：`cloudfunctions/manageCouple/index.js`

- `updateCouple` 无权限检查 → 添加双方身份校验
- `deleteCouple` 运算符优先级问题 → 加括号明确逻辑

#### 1.6 initUser 竞态条件
**文件**：`miniprogram/app.js`

- `initUser()` 未 await，后续页面可能在用户信息就绪前执行
- 修复：使用 Promise 链或回调通知机制，确保页面在用户就绪后加载数据

---

### Phase 2 — 公共模块提取（优先级：P0）

> 预计工时：1-2 天

#### 2.1 新建 `miniprogram/utils/` 目录

```
miniprogram/utils/
├── date.js          # 日期格式化、计算、时区安全转换
├── countdown.js     # 纪念日倒数日计算（消除 index.js 和 anniversaries.js 的 ~75 行重复）
├── cloud.js         # 云函数调用封装（统一错误处理、loading 状态）
├── auth.js          # 权限判断（是否情侣、是否记录作者）
├── validator.js     # 输入校验（日期格式、内容长度、图片数量）
└── constants.js     # 全局常量（云环境 ID、最大图片数、集合名称等）
```

#### 2.2 `utils/date.js` 核心函数

```javascript
// 本地日期格式化（替代 toISOString）
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 解析日期字符串为本地 Date（避免时区偏移）
function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// 显示友好日期
function formatDisplayDate(dateStr) { /* ... */ }

// 显示友好时间
function formatTime(dateOrTimestamp) { /* ... */ }
```

#### 2.3 `utils/countdown.js`

```javascript
// 统一倒数日计算（消除 index.js / anniversaries.js 中的重复代码）
function calculateCountdown(dateStr, countdownDays) { /* ... */ }

// 生成所有倒数日节点
function getAllCountdowns(startDateStr, countdownDaysList) { /* ... */ }
```

#### 2.4 `utils/cloud.js`

```javascript
// 统一云函数调用
async function callCloud(name, data = {}) {
  wx.showLoading({ title: '加载中...' })
  try {
    const res = await wx.cloud.callFunction({ name, data })
    return res.result
  } catch (err) {
    wx.showToast({ title: '网络异常', icon: 'none' })
    throw err
  } finally {
    wx.hideLoading()
  }
}
```

#### 2.5 消除重复代码清单

| 重复函数 | 出现位置 | 提取到 |
|----------|----------|--------|
| `calculateCountdown()` | index.js, anniversaries.js | `utils/countdown.js` |
| `formatDisplayDate()` | index.js, day-detail.js, record-detail.js | `utils/date.js` |
| `formatTime()` | day-detail.js, record-detail.js | `utils/date.js` |
| 日期格式化逻辑 | calendar.js, 多处 | `utils/date.js` |

---

### Phase 3 — 安全加固（优先级：P1）

> 预计工时：1 天

#### 3.1 图片删除鉴权
**文件**：`cloudfunctions/deleteImages/index.js`

```javascript
// 修复：验证 fileID 属于当前用户
// 1. 从 records 集合中查询这些 fileID
// 2. 确认 _openid === wxContext.OPENID 或为情侣关系
// 3. 校验通过后才执行删除
```

#### 3.2 云函数输入校验
所有云函数统一添加：
- 日期格式校验（正则 `^\d{4}-\d{2}-\d{2}$`）
- 内容长度限制（content ≤ 1000 字符）
- 图片数量限制（images ≤ 9）
- 必填字段检查

#### 3.3 数据库权限规则
在云开发控制台配置集合安全规则：
- `records`：创建者或情侣可读写
- `anniversaries`：创建者或情侣可读写
- `dishes`：创建者可读写，情侣可读
- `menus` / `menuVotes`：情侣双方可读写

---

### Phase 4 — 记录归属与版本追踪（优先级：P1）

> 预计工时：3-4 天

#### 4.1 数据库 Schema 变更

**records 集合 — 新增字段：**

```javascript
{
  _id: "xxx",
  _openid: "创建者openid",       // 已有，原始作者
  authorOpenid: "创建者openid",   // 冗余字段，方便查询
  authorNickname: "小明",         // 创建时快照的昵称
  authorAvatar: "url",            // 创建时快照的头像

  date: Date,
  content: "原始内容",
  images: ["cloud://..."],

  // 新增字段
  lastEditedBy: "openid",         // 最后编辑者
  lastEditedAt: Date,             // 最后编辑时间
  version: 3,                     // 当前版本号
  editCount: 3,                   // 编辑次数
}
```

**新增 recordVersions 集合 — 版本历史：**

```javascript
{
  _id: "xxx",
  recordId: "关联记录ID",
  version: 1,                     // 版本号
  content: "该版本的内容",
  images: ["该版本的图片列表"],
  editedBy: "openid",             // 本次编辑者
  editedAt: Date,                 // 编辑时间
  editorNickname: "小明",         // 编辑者昵称快照
  changeType: "create|edit",      // 变更类型
  changeNote: "",                 // 可选的修改说明
}
```

**新增 recordComments 集合 — 评论：**

```javascript
{
  _id: "xxx",
  recordId: "关联记录ID",
  authorOpenid: "评论者openid",
  authorNickname: "小红",
  authorAvatar: "url",
  content: "好棒的记录！",
  createdAt: Date,
}
```

#### 4.2 云函数改造

**改造 `createRecord`：**
```javascript
// 新增：写入 authorOpenid, authorNickname, authorAvatar
// 新增：创建第一条 version 记录（changeType: 'create'）
```

**改造 `updateRecord`：**
```javascript
// 新增：更新 lastEditedBy, lastEditedAt, version++
// 新增：写入新的 version 记录（changeType: 'edit'）
// 新增：清理被移除的旧图片（调用 deleteImages）
```

**新增 `getRecordVersions` 云函数：**
```javascript
// 输入：recordId
// 输出：该记录的所有版本记录，按 version 降序
```

**新增 `addRecordComment` 云函数：**
```javascript
// 输入：recordId, content
// 输出：创建的评论
```

**新增 `getRecordComments` 云函数：**
```javascript
// 输入：recordId
// 输出：该记录的所有评论，按时间升序
```

#### 4.3 前端页面改造

**记录详情页 (`record-detail`) 新增区域：**

```
┌─────────────────────────────┐
│  记录内容                    │
│  作者：小明  最后编辑：小红   │
│  编辑次数：3  版本：v3       │
├─────────────────────────────┤
│  [查看历史版本]              │
├─────────────────────────────┤
│  评论区域                    │
│  ┌─ 小红：好棒！             │
│  └─ 小明：谢谢～             │
│  [输入评论...]        [发送] │
└─────────────────────────────┘
```

**新增版本历史页面 (`record-versions`)：**

```
┌─────────────────────────────┐
│  版本历史                    │
├─────────────────────────────┤
│  v3 - 小红 2024-03-15 14:30 │
│  修改说明：更新了照片        │
│  [查看此版本]               │
├─────────────────────────────┤
│  v2 - 小明 2024-03-14 10:00 │
│  修改说明：补充了文字        │
│  [查看此版本]               │
├─────────────────────────────┤
│  v1 - 小明 2024-03-13 20:00 │
│  初始创建                    │
└─────────────────────────────┘
```

---

### Phase 5 — 小厨房功能（优先级：P2）

> 预计工时：5-7 天

#### 5.1 功能设计

参考成熟方案（如"今天吃什么"、"饭好"等 App），核心流程：

```
上架菜品 → 组建菜单 → 对方选择/投票 → 确定今晚吃什么
```

**角色模型：**
- 双方都可以上架菜品（自己的"拿手菜"）
- 每天由一方发起"今晚吃什么"，对方从候选中挑选
- 支持"随便"选项（让对方决定）

#### 5.2 数据库设计

**新增 dishes 集合 — 菜品库：**

```javascript
{
  _id: "xxx",
  _openid: "创建者openid",
  authorOpenid: "创建者openid",
  authorNickname: "小明",

  name: "番茄炒蛋",
  description: "酸甜可口，简单易做",
  category: "家常菜",           // 分类：家常菜/硬菜/汤/主食/小吃/饮品
  tags: ["快手", "下饭"],       // 标签
  imageUrl: "cloud://...",      // 菜品图片（可选）

  // 元数据
  difficulty: "easy",           // easy / medium / hard
  estimatedTime: 20,            // 预估时间（分钟）
  ingredients: "番茄、鸡蛋、糖、盐", // 食材（可选）

  // 状态
  isActive: true,               // 是否上架
  likeCount: 5,                 // 被点赞/选择次数
  createdAt: Date,
  updatedAt: Date,
}
```

**新增 menus 集合 — 每日菜单：**

```javascript
{
  _id: "xxx",
  _openid: "发起人openid",

  date: "2024-03-15",           // 菜单日期
  mealType: "dinner",           // breakfast / lunch / dinner / snack

  // 候选菜品（从菜品库选取或临时添加）
  candidates: [
    { dishId: "xxx", dishName: "番茄炒蛋", imageUrl: "..." },
    { dishId: "yyy", dishName: "红烧肉", imageUrl: "..." },
    { dishId: "zzz", dishName: "随便", imageUrl: null },
  ],

  // 状态
  status: "voting",             // voting / decided / cancelled
  decidedDishId: "xxx",         // 最终确定的菜品
  decidedBy: "openid",          // 谁决定的
  decidedAt: Date,

  createdAt: Date,
  updatedAt: Date,
}
```

**新增 menuVotes 集合 — 投票/选择：**

```javascript
{
  _id: "xxx",
  menuId: "关联菜单ID",
  voterOpenid: "投票者openid",
  voterNickname: "小红",

  votes: ["xxx", "yyy"],        // 想吃的菜品 ID 列表（可多选）
  comment: "想吃番茄炒蛋！",     // 可选留言
  createdAt: Date,
}
```

#### 5.3 页面结构

```
miniprogram/pages/kitchen/
├── kitchen.js/wxml/wxss/json     # 小厨房首页（今日菜单 + 快捷操作）
├── dish-list.js/wxml/wxss/json   # 菜品库列表（按分类浏览）
├── dish-detail.js/wxml/wxss/json # 菜品详情（含食材、做法）
├── add-dish.js/wxml/wxss/json    # 上架新菜品
├── menu-create.js/wxml/wxss/json # 发起今日菜单
└── menu-result.js/wxml/wxss/json # 投票结果 / 最终决定
```

#### 5.4 页面设计稿

**小厨房首页 (`kitchen`)：**

```
┌─────────────────────────────────┐
│  🍳 小厨房                      │
├─────────────────────────────────┤
│                                 │
│  ┌─── 今日晚餐 ──────────────┐  │
│  │  状态：投票中              │  │
│  │                            │  │
│  │  🍅 番茄炒蛋    [已选 ✓]  │  │
│  │  🥩 红烧肉      [  选  ]  │  │
│  │  🍜 随便        [  选  ]  │  │
│  │                            │  │
│  │  小红选了：番茄炒蛋        │  │
│  │                            │  │
│  │  [提交选择]                │  │
│  └────────────────────────────┘  │
│                                 │
│  ┌─── 快捷操作 ──────────────┐  │
│  │  [上架新菜]  [发起菜单]   │  │
│  └────────────────────────────┘  │
│                                 │
│  ┌─── 我的菜品 (12) ─────────┐  │
│  │  🍅 番茄炒蛋  ⭐ 被选5次  │  │
│  │  🥩 红烧肉    ⭐ 被选3次  │  │
│  │  ...                      │  │
│  │  [查看全部 →]              │  │
│  └────────────────────────────┘  │
│                                 │
│  ┌─── 历史记录 ──────────────┐  │
│  │  昨天：可乐鸡翅（小红选的）│  │
│  │  前天：酸菜鱼（小明选的） │  │
│  └────────────────────────────┘  │
└─────────────────────────────────┘
```

**上架新菜品 (`add-dish`)：**

```
┌─────────────────────────────────┐
│  上架新菜品                      │
├─────────────────────────────────┤
│  菜品名称                        │
│  ┌───────────────────────────┐  │
│  │ 番茄炒蛋                   │  │
│  └───────────────────────────┘  │
│                                 │
│  分类                            │
│  [家常菜] [硬菜] [汤]           │
│  [主食] [小吃] [饮品]           │
│                                 │
│  难度        预估时间            │
│  [简单 ▼]   [20] 分钟           │
│                                 │
│  食材（可选）                    │
│  ┌───────────────────────────┐  │
│  │ 番茄、鸡蛋、糖、盐         │  │
│  └───────────────────────────┘  │
│                                 │
│  菜品图片                        │
│  ┌──────┐                       │
│  │  +   │ 点击拍照或选择        │
│  └──────┘                       │
│                                 │
│  ┌───────────────────────────┐  │
│  │       上架这道菜           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

#### 5.5 云函数

**新增厨房相关云函数：**

```
cloudfunctions/
├── createDish/          # 创建菜品
├── getDishes/           # 获取菜品列表（支持分类筛选）
├── updateDish/          # 更新菜品
├── deleteDish/          # 下架菜品（软删除）
├── createMenu/          # 发起今日菜单
├── getMenu/             # 获取今日菜单（含投票情况）
├── voteMenu/            # 投票/选择
├── decideMenu/          # 最终确定
└── getMenuHistory/      # 获取历史菜单
```

#### 5.6 与现有功能的集成

- **首页日历**：在日历格子上标记"有菜单"的小图标（类似纪念日标记）
- **情侣绑定**：厨房功能依赖情侣关系，未绑定时引导绑定
- **tabBar**：小厨房作为独立 tab 入口

---

### Phase 6 — 导航与 UX 优化（优先级：P2）

> 预计工时：2-3 天

#### 6.1 引入 tabBar

**`app.json` 配置：**

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#85C1DC",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "日历",
        "iconPath": "images/tab/calendar.png",
        "selectedIconPath": "images/tab/calendar-active.png"
      },
      {
        "pagePath": "pages/kitchen/kitchen",
        "text": "小厨房",
        "iconPath": "images/tab/kitchen.png",
        "selectedIconPath": "images/tab/kitchen-active.png"
      },
      {
        "pagePath": "pages/anniversaries/anniversaries",
        "text": "纪念日",
        "iconPath": "images/tab/anniversary.png",
        "selectedIconPath": "images/tab/anniversary-active.png"
      },
      {
        "pagePath": "pages/couple-bind/couple-bind",
        "text": "我们",
        "iconPath": "images/tab/couple.png",
        "selectedIconPath": "images/tab/couple-active.png"
      }
    ]
  }
}
```

> 注意：tabBar 页面不能有自定义导航栏，需要调整 header 样式。

#### 6.2 情侣绑定 UX 改进

**现状**：显示原始 OpenID 让用户复制粘贴 — 体验差。

**改进方案：**

```
方案 A：分享卡片邀请
┌─────────────────────┐
│  小明邀请你成为 TA 的│
│  另一半 💕           │
│                     │
│  [接受邀请]          │
│  [拒绝]              │
└─────────────────────┘
通过小程序分享卡片，对方点击直接进入绑定确认页

方案 B：扫码绑定
生成包含请求 ID 的小程序码，对方扫码直接绑定

方案 C：保留 ID 方式（优化）
将 OpenID 转为 6 位短码，对方输入短码绑定
```

#### 6.3 页面头部统一

- 提取通用 header 组件（非 tabBar 页面使用）
- 统一返回按钮样式、标题居中

---

### Phase 7 — 性能与体验优化（优先级：P3）

> 预计工时：1-2 天

#### 7.1 图片优化
- 上传时压缩（使用 `wx.compressImage`）
- 列表页使用缩略图尺寸（云开发图片处理参数）
- 懒加载（`lazy-load` 属性）

#### 7.2 数据缓存
- 首页日历数据本地缓存（`wx.setStorageSync`）
- 菜品列表本地缓存
- 离线时展示缓存数据 + 提示

#### 7.3 按需加载
- 版本历史、评论等次要数据延迟加载
- 菜品图片按需加载（进入详情才加载大图）

---

## 三、新增文件清单

### 前端新增

```
miniprogram/
├── utils/
│   ├── date.js
│   ├── countdown.js
│   ├── cloud.js
│   ├── auth.js
│   ├── validator.js
│   └── constants.js
├── components/
│   ├── header/              # 通用页面头部
│   │   ├── header.js
│   │   ├── header.wxml
│   │   ├── header.wxss
│   │   └── header.json
│   └── dish-card/           # 菜品卡片组件
│       ├── dish-card.js
│       ├── dish-card.wxml
│       ├── dish-card.wxss
│       └── dish-card.json
├── pages/
│   ├── kitchen/             # 小厨房首页
│   ├── dish-list/           # 菜品库列表
│   ├── dish-detail/         # 菜品详情
│   ├── add-dish/            # 上架新菜品
│   ├── menu-create/         # 发起今日菜单
│   ├── menu-result/         # 投票结果
│   ├── record-versions/     # 版本历史
│   └── couple-invite/       # 情侣邀请（分享卡片方式）
└── images/
    └── tab/                 # tabBar 图标
        ├── calendar.png
        ├── calendar-active.png
        ├── kitchen.png
        ├── kitchen-active.png
        ├── anniversary.png
        ├── anniversary-active.png
        ├── couple.png
        └── couple-active.png
```

### 云函数新增

```
cloudfunctions/
├── createDish/
├── getDishes/
├── updateDish/
├── deleteDish/
├── createMenu/
├── getMenu/
├── voteMenu/
├── decideMenu/
├── getMenuHistory/
├── getRecordVersions/
├── addRecordComment/
├── getRecordComments/
└── generateShortCode/       # 生成 6 位短码（情侣邀请用）
```

### 数据库新增集合

```
dishes           # 菜品库
menus            # 每日菜单
menuVotes        # 投票记录
recordVersions   # 记录版本历史
recordComments   # 记录评论
```

---

## 四、实施顺序与依赖关系

```
Phase 1 (缺陷修复)
    │
    ▼
Phase 2 (公共模块提取) ──────┐
    │                        │
    ▼                        ▼
Phase 3 (安全加固)    Phase 4 (归属与版本)
    │                        │
    │    ┌───────────────────┘
    ▼    ▼
Phase 5 (小厨房) ──── 依赖 Phase 2 的 utils 和 Phase 3 的权限模型
    │
    ▼
Phase 6 (导航与 UX) ──── 依赖 Phase 5 的页面注册
    │
    ▼
Phase 7 (性能优化) ──── 最后阶段，所有功能就位后优化
```

**建议里程碑：**

| 里程碑 | 包含阶段 | 预计工时 | 交付物 |
|--------|----------|----------|--------|
| M1 | Phase 1 + 2 | 3-4 天 | 无 Bug、代码整洁 |
| M2 | Phase 3 + 4 | 4-5 天 | 安全可控、归属可追溯 |
| M3 | Phase 5 | 5-7 天 | 小厨房功能完整 |
| M4 | Phase 6 + 7 | 3-5 天 | 体验完整、性能达标 |

---

## 五、架构扩展性设计

### 5.1 模块化原则

- 每个功能域（记录、纪念日、厨房）独立管理自己的页面和云函数
- 共享逻辑全部下沉到 `utils/` 和 `components/`
- 新增功能只需添加新的页面 + 云函数 + 集合，不改动现有模块

### 5.2 数据模型扩展模式

所有新集合统一包含以下基础字段：

```javascript
{
  _id: "自动生成",
  _openid: "创建者（微信自动注入）",
  authorOpenid: "创建者（冗余，方便查询）",
  authorNickname: "创建者昵称快照",
  createdAt: Date,
  updatedAt: Date,
  isActive: true,           // 软删除标记
}
```

### 5.3 未来可扩展方向

- **宠物系统**：已有 CSS 变量（hunger/mood/energy/exp），可基于互动频率激活
- **相册功能**：基于 records 的 images 字段，构建独立相册视图
- **消息通知**：订阅消息推送（对方做了菜、评论了你的记录）
- **数据统计**：记录频率、菜品偏好、纪念日统计图表
- **多语言**：提取所有文案到 `i18n/` 目录

---

## 六、风险与注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| tabBar 页面不支持自定义导航栏 | 现有页面头部需要重构 | 非 tabBar 页面保留自定义 header，tabBar 页面使用原生导航 |
| 版本历史数据量增长 | 数据库存储成本 | 限制保留版本数（如最近 20 个），定期归档 |
| 菜品图片存储 | 云存储成本 | 上传时压缩，限制单张图片大小 |
| 情侣关系解绑后数据归属 | 数据可见性混乱 | 解绑后保留各自创建的数据，厨房数据标记为失效 |
| 时区问题遗留 | 日期显示错误 | Phase 2 统一工具函数后全局排查，编写测试用例 |
