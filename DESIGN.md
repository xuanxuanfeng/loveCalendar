# 视觉规则

## 色彩体系

### 品牌色

| 用途 | 色值 |
|------|------|
| 主色（导航栏、Tab 选中、主按钮） | `#85C1DC` |
| 主色深色（标题、强调文字） | `#5D8CAE` |
| 浅蓝背景（标签、徽章） | `#E8F4FD` |

### 页面背景

所有页面统一使用暖粉渐变：

```css
background: linear-gradient(135deg, #FFF5F5 0%, #FFECEC 50%, #FFE0E0 100%);
```

### 功能色

| 用途 | 色值 |
|------|------|
| 记录标记点 | `#F1C27D` |
| 纪念日标记点 | `#dc8591` |
| 成功/已确定 | `#66BB6A` / `#4CAF50` |
| 投票中 | `#FFB347` |
| 删除/错误 | `#ff4757` / `#ff6b6b` |
| 接受 | `#52c41a` |
| 拒绝 | `#ff4d4f` |
| 取消 | `#faad14` |
| 离线横幅背景 | `#FFF3CD` |
| 离线横幅文字 | `#856404` |

### 状态栏渐变色

| 状态 | 渐变 |
|------|------|
| 饥饿度 | `#FFA500` → `#FF8C00` |
| 心情 | `#FF69B4` → `#FF1493` |
| 精力 | `#32CD32` → `#008000` |
| 经验值 | `#1E90FF` → `#0000CD` |

### TabBar

| 状态 | 色值 |
|------|------|
| 选中 | `#85C1DC` |
| 未选中 | `#999999` |
| 背景 | `#ffffff` |

## 字体

### 字号层级

| 字号 | 用途 |
|------|------|
| `28px` | 页面大标题 |
| `24px` | 月份显示、图标 |
| `22px` | 菜品名称（详情页） |
| `20px` | 标题图标 |
| `18px` | 头部标题、返回箭头 |
| `16px` | 区块标题、输入框、正文 |
| `15px` | 菜品名称、候选名称 |
| `14px` | 基础正文、记录文字、卡片信息 |
| `13px` | "更多"链接、分类标签、元数据 |
| `12px` | 说明文字、计数、徽章、倒计时 |
| `11px` | 评论时间、标签文字 |

### 字体族

```css
/* 正文 */
font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
  'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei',
  Arial, sans-serif;

/* 标题 */
font-family: "思源黑体", "苹方", "冬青黑体", sans-serif;
```

## 间距

| 场景 | 值 |
|------|-----|
| 页面容器水平内边距 | `15px` ~ `20px` |
| 卡片内边距 | `16px` ~ `20px` |
| 卡片外边距（两侧） | `10px` ~ `15px` |
| 卡片底部间距 | `12px` |
| 元素间距 | `8px` ~ `12px` |
| 区块间距 | `12px` ~ `15px` |

## 圆角

| 圆角 | 用途 |
|------|------|
| `4px` | 小按钮（编辑/删除） |
| `6px` | 记录图片、候选图片 |
| `8px` | 卡片、输入框、表单区块 |
| `12px` | 纪念日卡片、记录卡片（主要圆角） |
| `16px` | 操作卡片、情侣状态卡片 |
| `20px` | 返回按钮、徽章药丸 |
| `22px` | 提交按钮（44px 高的一半） |
| `25px` | 主保存按钮（50px 高的一半） |
| `50%` | 头像、圆形标记 |

## 通用模式

### 卡片

```css
background: white;
border-radius: 12px;
padding: 16px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
```

### 主按钮渐变

```css
background: linear-gradient(135deg, #85C1DC 0%, #5D8CAE 100%);
```

### 卡片悬停

```css
transform: translateY(-2px);
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
transition: all 0.3s ease;
```

### 粘性头部

```css
position: sticky;
top: 0;
z-index: 100;
```

### 图片网格

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
```
