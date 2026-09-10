# 组件 API 文档

## 组件清单

| 组件 | 路径 | 用途 |
|------|------|------|
| calendar | `components/calendar/calendar` | 月历网格，显示记录/纪念日标记 |
| page-header | `components/page-header/page-header` | 粘性页面头部，含返回按钮和标题 |
| cloudbase-badge | `components/cloudbase-badge/index` | CloudBase AI ToolKit 推广徽章 |

---

## calendar

月历组件，渲染 6×7 的日期网格，支持记录标记和纪念日标记。

### Properties

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentDate` | String | `formatDate(new Date())` | 当前显示的月份（YYYY-MM-DD 格式，取年月部分） |
| `recordsMap` | Object | `{}` | 记录映射表，key 为 `YYYY-MM-DD`，value 为记录数组 |
| `anniversariesMap` | Object | `{}` | 纪念日映射表，key 为 `YYYY-MM-DD`，value 为纪念日数组 |

### Events

| 事件 | detail | 触发时机 |
|------|--------|---------|
| `dayClick` | `{ date: string }` | 用户点击任意日期格子 |
| `monthChange` | `{ date: string }` | 用户点击上月/下月箭头 |

### 内部数据结构

**calendarDays** — 42 个日期对象数组（6 行 × 7 列）：

```javascript
{
  date: 'YYYY-MM-DD',     // 完整日期
  day: Number,            // 日（1-31）
  isCurrentMonth: Boolean, // 是否属于当前月份
  hasRecord: Boolean,      // 该日是否有记录
  isAnniversary: Boolean,  // 该日是否是纪念日
  isToday: Boolean         // 是否今日
}
```

### 使用示例

```xml
<!-- WXML -->
<calendar
  currentDate="{{currentDate}}"
  recordsMap="{{recordsMap}}"
  anniversariesMap="{{anniversariesMap}}"
  bind:dayClick="onDayClick"
  bind:monthChange="onMonthChange"
/>
```

```javascript
// JS
Page({
  data: {
    currentDate: '2026-09-09',
    recordsMap: {
      '2026-09-01': [{ _id: 'r1', content: '...' }],
      '2026-09-05': [{ _id: 'r2', content: '...' }]
    },
    anniversariesMap: {
      '2026-09-15': [{ _id: 'a1', name: '在一起' }]
    }
  },
  onDayClick(e) {
    const { date } = e.detail
    wx.navigateTo({ url: `/pages/day-detail/day-detail?date=${date}` })
  },
  onMonthChange(e) {
    const { date } = e.detail
    this.setData({ currentDate: date })
    this.loadCalendarData(date)
  }
})
```

### 观察者行为

| 监听属性 | 行为 |
|----------|------|
| `currentDate` 变化 | 重新生成 42 格日历（`generateCalendar()`） |
| `recordsMap` 或 `anniversariesMap` 变化 | 仅更新标记位（`updateCalendarMarkers()`），不重建网格 |

### 视觉说明

| 元素 | 样式 |
|------|------|
| 日历容器背景 | `linear-gradient(#FCE8E6, #FADBD8)` |
| 今日格子 | 蓝色渐变 `#85C1DC` → `#5D8CAE`，白色文字 |
| 有记录的日期数字 | 橙色 `#F1C27D` |
| 记录标记点 | 橙色圆点 `#F1C27D` |
| 纪念日标记点 | 粉色圆点 `#dc8591` |
| 非当月日期 | 灰色文字 `#ccc`，半透明背景 |

### 消费页面

| 页面 | 用途 |
|------|------|
| `pages/index/index` | 首页日历视图 |

---

## page-header

粘性页面头部组件，提供统一的返回按钮和标题。

### Properties

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | String | `''` | 页面标题 |

### Methods

| 方法 | 说明 |
|------|------|
| `onBack()` | 调用 `wx.navigateBack()`，失败时回退到 `wx.switchTab({ url: '/pages/index/index' })` |

### 使用示例

```xml
<page-header title="记录详情" />
```

### 视觉说明

- 位置：`position: sticky; top: 0; z-index: 100`
- 背景：白色
- 返回按钮：圆形，蓝色 `#85C1DC`
- 标题：`18px`，深色 `#5D8CAE`

### 消费页面

所有非 TabBar 子页面均使用此组件（day-detail、add-record、record-detail、record-versions、add-anniversary、dish-list、dish-detail、add-dish、menu-create、menu-result）。

---

## cloudbase-badge

CloudBase AI ToolKit 推广徽章，点击后跳转小程序或复制链接。

### Properties

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showText` | Boolean | `false` | 是否显示文字说明 |
| `size` | String | `'normal'` | 尺寸：`normal` / `small` / `large` |

### Methods

| 方法 | 说明 |
|------|------|
| `onTapBadge()` | 尝试 `wx.navigateToMiniProgram()` 跳转，失败则复制链接到剪贴板 |

### 使用示例

```xml
<cloudbase-badge showText="{{true}}" size="small" />
```
