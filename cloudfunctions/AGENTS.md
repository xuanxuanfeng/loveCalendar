# 云函数说明

30 个云函数，运行在微信云开发环境（`cloud.DYNAMIC_CURRENT_ENV`）。

## 返回格式

所有云函数统一返回：
```javascript
{ success: true, ...data }   // 成功
{ success: false, error: '错误描述' }  // 失败
```

## 函数分组

### 用户管理（4）

| 函数 | 参数 | 说明 |
|------|------|------|
| `getOpenId` | 无 | 获取当前用户 openId |
| `getOpenIdByPhone` | `{ phone }` | 通过手机号查找用户 openId |
| `initUser` | `{ action, phone?, nickname?, avatar? }` | 用户初始化/资料更新 |
| `deleteImages` | `{ imageUrls }` | 批量删除云存储图片 |

### 情侣关系（3）

| 函数 | 参数 | 说明 |
|------|------|------|
| `manageCouple` | `{ action, partnerOpenid?, coupleName? }` | 创建/管理情侣关系 |
| `handleCoupleRequest` | `{ action, targetOpenid?, requestId? }` | 发送/接受/拒绝绑定请求 |
| `getOpenIdByPhone` | `{ phone }` | 通过手机号查找伴侣 |

### 日历记录 CRUD（8）

| 函数 | 参数 | 说明 |
|------|------|------|
| `createRecord` | `{ date, content, images }` | 创建记录 |
| `updateRecord` | `{ recordId, date?, content?, images?, changeNote? }` | 更新记录（保留版本历史） |
| `deleteRecord` | `{ recordId }` | 删除记录 |
| `getRecordById` | `{ recordId }` | 获取单条记录详情 |
| `getRecordsByDate` | `{ date }` | 获取指定日期记录 |
| `getRecordsByDateRange` | `{ startDate, endDate }` | 获取日期范围记录（日历视图） |
| `getRecordVersions` | `{ recordId }` | 获取记录版本历史 |
| `getCalendarData` | `{ startDate, endDate }` | 获取日历数据（记录 + 纪念日） |

### 记录评论（2）

| 函数 | 参数 | 说明 |
|------|------|------|
| `addRecordComment` | `{ recordId, content }` | 添加评论 |
| `getRecordComments` | `{ recordId }` | 获取记录评论列表 |

### 纪念日 CRUD（3）

| 函数 | 参数 | 说明 |
|------|------|------|
| `createAnniversary` | `{ name, date, isCountdownMode?, countdownDays? }` | 创建纪念日 |
| `updateAnniversary` | `{ anniversaryId, name?, date?, isCountdownMode?, countdownDays? }` | 更新纪念日 |
| `deleteAnniversary` | `{ anniversaryId }` | 删除纪念日 |
| `getAllAnniversaries` | 无 | 获取全部纪念日 |
| `getAnniversaries` | 无 | 获取纪念日列表 |

### 小厨房 — 菜品 CRUD（3）

| 函数 | 参数 | 说明 |
|------|------|------|
| `createDish` | `{ name, description?, category, tags?, imageUrl?, difficulty?, estimatedTime?, ingredients? }` | 创建菜品 |
| `updateDish` | `{ dishId, name?, ... }` | 更新菜品 |
| `deleteDish` | `{ dishId }` | 删除菜品 |
| `getDishes` | 无 | 获取我的菜品列表 |

**菜品校验规则**:
- 名称: 1-30字，仅中英文数字（`NAME_REGEX`）
- 分类: `家常菜 | 硬菜 | 汤 | 主食 | 小吃 | 饮品`
- 难度: `easy | medium | hard`

### 小厨房 — 菜单投票（4）

| 函数 | 参数 | 说明 |
|------|------|------|
| `createMenu` | `{ date, mealType, candidates }` | 创建每日菜单 |
| `getMenu` | `{ menuId?, date?, mealType? }` | 查询菜单（按 ID 或日期） |
| `getMenuHistory` | `{ page?, pageSize? }` | 分页获取历史菜单 |
| `voteMenu` | `{ menuId, votes, comment? }` | 投票 |
| `decideMenu` | `{ menuId, dishId }` | 确定最终菜品 |

## CRUD 配对约定

create/update 函数对共享校验逻辑（日期格式、字段长度、枚举值）。修改字段时两端需同步。

| 配对 | 共享校验 |
|------|---------|
| `createRecord` / `updateRecord` | `DATE_REGEX`, `MAX_CONTENT_LENGTH=1000`, `MAX_IMAGES=9`, `cloud://` 前缀 |
| `createAnniversary` / `updateAnniversary` | `DATE_REGEX`, `MAX_NAME_LENGTH=50`, `MAX_COUNTDOWN_DAYS=20` |
| `createDish` / `updateDish` | `NAME_REGEX`, `CATEGORIES`, `DIFFICULTIES` |

## 情侣数据隔离模式

大多数查询函数遵循相同模式：
1. 获取当前用户 `openId`
2. 查询 `couples` 集合获取情侣关系
3. 如果有情侣关系，用 `coupleOpenids` 数组查询双方数据
4. 如果无情侣关系，仅查询本人数据
