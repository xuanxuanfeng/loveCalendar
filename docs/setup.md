# 开发环境设置

## 前置条件

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（稳定版）
- Node.js >= 16（云函数运行时为 Node.js 18.15）
- Git

## 1. 克隆项目

```bash
git clone <repo-url>
cd loveCalendar
```

## 2. 微信开发者工具配置

1. 打开微信开发者工具，导入项目，选择 `miniprogram/` 目录
2. 在 `project.config.json` 中确认 AppID（需替换为你自己的测试 AppID）
3. 开通云开发：工具栏 → 云开发 → 开通（免费额度即可）
4. 记录云环境 ID（默认：`dev-5gu57acl6acc6a6b`，需在 `miniprogram/utils/constants.js` 中同步修改）

## 3. 云环境初始化

### 3.1 创建数据库集合

在云开发控制台 → 数据库中，创建以下集合：

| 集合名 | 用途 |
|--------|------|
| `users` | 用户信息 |
| `records` | 日历记录 |
| `recordVersions` | 记录版本历史 |
| `anniversaries` | 纪念日 |
| `couples` | 情侣关系 |
| `coupleRequests` | 情侣邀请 |
| `dishes` | 小厨房菜品 |
| `menus` | 小厨房菜单投票 |

### 3.2 配置数据库权限

参考 `cloudfunctions/database-rules.json`，在控制台为每个集合设置权限规则。

核心原则：
- `users`：仅本人可读写
- `records` / `anniversaries`：创建者或情侣双方可读写
- `couples` / `coupleRequests`：关系双方可读写
- `dishes` / `menus`：情侣双方可读写

### 3.3 创建存储目录

在云开发控制台 → 存储中，创建 `records/` 目录用于存放日历记录图片。

## 4. 部署云函数

### 逐个部署

在微信开发者工具中，右键每个云函数目录 → 上传并部署：云端安装依赖。

### 批量部署

```bash
# 在云函数目录下逐个部署
cd cloudfunctions
for func in */; do
  if [ -f "$func/index.js" ]; then
    echo "部署 $func ..."
    # 在开发者工具中右键部署，或使用 tcb 命令行
  fi
done
```

### 部署顺序

无严格依赖，但建议：
1. `initUser`、`getOpenId` — 基础用户函数
2. `manageCouple`、`handleCoupleRequest` — 情侣关系
3. `createRecord`、`updateRecord`、`deleteRecord` — 记录 CRUD
4. 其余函数

## 5. 安装测试依赖

```bash
npm install
npm test
```

当前测试覆盖：
- `miniprogram/utils/` — 日期、倒计时、校验工具（56 个测试）
- `cloudfunctions/shared/` — 云函数共享校验器（28 个测试）
- `miniprogram/components/calendar/` — 日历组件（10 个测试）

## 6. 关键约定

| 约定 | 值 |
|------|-----|
| 图片上限 | 9 张 / 记录 |
| 内容长度 | 1000 字 |
| 名称长度 | 50 字 |
| 评论长度 | 500 字 |
| 倒数日上限 | 20 个 / 纪念日 |
| 云环境 ID | `dev-5gu57acl6acc6a6b` |

## 常见问题

**Q: 云函数调用返回"函数不存在"**
A: 确认已在开发者工具中上传并部署该云函数。

**Q: 数据库操作报权限错误**
A: 检查集合的权限规则是否已按 `database-rules.json` 配置。

**Q: 图片上传失败**
A: 确认云存储已开通，且图片 URL 以 `cloud://` 开头。
