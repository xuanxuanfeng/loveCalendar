# Calendar 日历组件

路径: `miniprogram/components/calendar/calendar`

## Properties

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `currentDate` | String | 今天 (YYYY-MM-DD) | 当前选中日期，决定显示的月份 |
| `recordsMap` | Object | `{}` | 日期→记录数组的映射，key 为 `YYYY-MM-DD` |
| `anniversariesMap` | Object | `{}` | 日期→纪念日数组的映射，key 为 `YYYY-MM-DD` |

## Events

| 事件 | detail | 触发时机 |
|------|--------|----------|
| `dayClick` | `{ date: string }` | 点击任意日期格子 |
| `monthChange` | `{ date: string }` | 点击上/下月箭头 |

## 使用示例

```json
{
  "usingComponents": {
    "calendar": "../../components/calendar/calendar"
  }
}
```

```xml
<calendar
  current-date="{{currentDate}}"
  records-map="{{recordsMap}}"
  anniversaries-map="{{anniversariesMap}}"
  bind:dayClick="onDayClick"
  bind:monthChange="onMonthChange"
></calendar>
```

```javascript
onDayClick(e) {
  const { date } = e.detail
  this.setData({ currentDate: date })
  // 加载该日期的记录...
}

onMonthChange(e) {
  const { date } = e.detail
  this.setData({ currentDate: date })
  // 加载该月份的日历数据...
}
```

## 数据格式

### recordsMap

```javascript
{
  '2024-06-15': [{ _id: 'xxx', content: '...', images: [...] }],
  '2024-06-16': [{ _id: 'yyy', content: '...', images: [...] }]
}
```

### anniversariesMap

```javascript
{
  '2024-06-20': [{ _id: 'aaa', name: '纪念日', date: '2023-06-20' }]
}
```

## 内部行为

- 日历网格固定 42 格（6 行 × 7 列），包含上月/下月的补位日期
- `currentDate` 变更时自动重新生成日历（observer）
- `recordsMap` 或 `anniversariesMap` 变更时仅更新标记，不重新生成网格（observer）
- 非当月日期以 `isCurrentMonth: false` 标记，样式灰显
- 今日日期以 `isToday: true` 标记，高亮显示

## 消费页面

| 页面 | 路径 | 绑定方式 |
|------|------|----------|
| 首页（日历） | `pages/index/index` | 完整绑定三个 properties + 两个事件 |

## 变更影响

修改此组件可能影响：
- 首页日历渲染和交互
- 所有通过 `recordsMap` / `anniversariesMap` 传入的数据格式约定
