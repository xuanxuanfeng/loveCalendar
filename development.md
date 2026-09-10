# 开发指南

## 环境准备

详见 [docs/setup.md](docs/setup.md)，核心步骤：

1. 安装微信开发者工具（稳定版）
2. 克隆项目，导入 `miniprogram/` 目录
3. 开通云开发，配置环境 ID `dev-5gu57acl6acc6a6b`
4. 创建 8 个数据库集合，配置权限规则
5. 部署全部 30 个云函数（Node.js 18.15）

## 常用命令

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 运行单个测试文件
npx jest miniprogram/__tests__/utils/date.test.js

# 运行指定测试（按名称匹配）
npx jest -t "formatDate"

# 查看测试覆盖率
npx jest --coverage
```

## 项目结构速查

```
miniprogram/
├── app.js                    # 入口：云初始化 + 用户初始化
├── app.json                  # 路由、tabBar、窗口配置
├── app.wxss                  # 全局样式 + CSS 变量
├── pages/                    # 14 个页面
│   ├── index/                # [Tab] 日历首页
│   ├── kitchen/              # [Tab] 小厨房首页
│   ├── anniversaries/        # [Tab] 纪念日列表
│   ├── couple-bind/          # [Tab] 情侣绑定
│   ├── day-detail/           # 日期详情页
│   ├── add-record/           # 添加/编辑记录
│   ├── record-detail/        # 记录详情（含评论）
│   ├── record-versions/      # 记录版本历史
│   ├── add-anniversary/      # 添加/编辑纪念日
│   ├── dish-list/            # 菜品列表（搜索/筛选）
│   ├── dish-detail/          # 菜品详情
│   ├── add-dish/             # 添加/编辑菜品
│   ├── menu-create/          # 创建菜单投票
│   └── menu-result/          # 菜单结果
├── components/
│   ├── calendar/             # 日历组件
│   ├── page-header/          # 页面头部（返回 + 标题）
│   └── cloudbase-badge/      # CloudBase 推广徽章
└── utils/
    ├── cloud.js              # 云函数调用封装
    ├── constants.js          # 全局常量
    ├── date.js               # 日期工具
    └── countdown.js          # 倒计时计算
```

## 开发约定

### 云函数调用

新代码统一使用 `callCloud()` 封装：

```javascript
const { callCloud } = require('../../utils/cloud')
const result = await callCloud('createRecord', { date, content, images })
```

### 云函数返回格式

```javascript
// 成功
return { success: true, ...data }
// 失败
return { success: false, error: '错误描述' }
```

### 前端常量

修改限制值时同步更新 `utils/constants.js` 和对应云函数的校验逻辑：

| 常量 | 值 | 位置 |
|------|-----|------|
| `MAX_IMAGES` | 9 | constants.js + record validator |
| `MAX_CONTENT_LENGTH` | 1000 | constants.js + record validator |
| `MAX_NAME_LENGTH` | 50 | constants.js + anniversary validator |

### 日期格式

统一使用 `YYYY-MM-DD`，工具函数位于 `utils/date.js`。

### 图片存储路径

| 类型 | 路径格式 |
|------|---------|
| 记录图片 | `records/{timestamp}_{random}.jpg` |
| 菜品图片 | `dishes/{timestamp}-{random}.jpg` |

上传前自动压缩至质量 60。

## 高风险文件

修改以下文件前需充分测试：

| 文件 | 原因 |
|------|------|
| `pages/index/index.js` | 主页逻辑，变更最频繁（churn 648） |
| `components/calendar/calendar.js` | 共享组件，被多页面引用 |
| `utils/cloud.js` | 全局云函数调用封装 |
| `utils/constants.js` | 全局常量，修改需同步前后端 |
| `cloudfunctions/createRecord/index.js` | 核心 CRUD |

## 回归清单

修改代码后需验证：

### 核心流程
- [ ] 日历加载并显示当月记录
- [ ] 切换月份正常
- [ ] 添加记录（文字 + 图片）
- [ ] 编辑记录并查看版本历史
- [ ] 删除记录（图片同步清理）
- [ ] 添加/编辑/删除纪念日
- [ ] 情侣绑定流程（发送 → 接受 → 数据共享）
- [ ] 小厨房：添加菜品 → 创建菜单 → 投票 → 确定

### 边界情况
- [ ] 无情侣关系时数据隔离
- [ ] 离线状态显示缓存横幅
- [ ] 图片达到上限（9 张）时提示
- [ ] 跨年/跨月日历渲染
- [ ] 倒数日计算（含闰年）

### 测试
- [ ] `npm test` 全部通过
- [ ] 新增代码有对应测试覆盖

## 部署流程

1. 在微信开发者工具中右键云函数目录 → 上传并部署：云端安装依赖
2. 建议部署顺序：
   - `initUser`、`getOpenId` — 基础用户函数
   - `manageCouple`、`handleCoupleRequest` — 情侣关系
   - `createRecord`、`updateRecord`、`deleteRecord` — 记录 CRUD
   - 其余函数
3. 上传小程序代码 → 提交审核
