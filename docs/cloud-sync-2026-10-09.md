# 云函数同步与验证（2026-10-09）

环境：`dev-5gu57acl6acc6a6b`。

## 部署结果

本地 31 个云函数已同步，云端状态均为 Active。逐个下载实际部署 ZIP，校验 SHA-256，并核对入口、package.json 和全部共享模块，31 个包均与部署目录一致。保留云端独有的 `migrateDateFormat`、`getEditLogs`、`searchRecords`。

## 修复内容

- 新记录和纪念日继续使用现有 `YYYY-MM-DD` 字符串格式；查询兼容旧 Date 字段，并统一返回日期字符串。没有批量迁移原有数据。
- 保留记录标题、标签及旧编辑日志，补齐新版本历史。旧记录首次编辑时保存原始版本；历史图片在整条记录删除时清理。
- 菜单查询、历史及投票限定在本人和当前情侣范围；按情侣范围判断餐次重复，兼容单候选和 `random` 菜品。
- 删除记录兼容微信 SDK 的 `stats.removed` 返回值，清理版本、评论和历史图片。删除前验证归属。
- 创建 `recordVersions`、`recordComments`、`dishes`、`menus`、`menuVotes`，配置 ADMINONLY 权限，由云函数完成身份与归属校验。
- 独立目录打包共享模块，避免修改工作区 require 路径或漏传共享文件。

## 验证

- Jest：9 个套件，135 项测试通过。
- ESLint：`cloudfunctions` 和 `scripts` 通过。
- 微信开发者工具：使用项目真实 AppID 和微信身份连接；四个 Tab 页面正常，未捕获异常或 console error。
- 8 项读取接口通过，现有日历记录与纪念日可查询。
- 25 项写入与业务断言通过，涵盖记录创建、编辑、版本、评论、删除、纪念日 CRUD、菜品 CRUD、单候选菜单、重复餐次拒绝、投票、random 决策和菜单历史。
- 删除返回值修复后重新创建临时记录和评论，确认删除返回 true，版本及评论集合归零。
- 临时测试数据已清理；原有 records=43、anniversaries=4、editLogs=11、users=259。新增五个集合均为空。

本次没有使用真实用户图片进行上传/删除验证；历史图片保留和清理通过回归测试验证。

## 后续打包

Windows 或其他支持 Node.js 的系统：

```powershell
node scripts/prepare-cloud-functions.js
```

输出 JSON 中的 `root` 为独立部署目录。CloudBase MCP 更新时，将其作为 `functionRootPath`，并指定函数名及云端依赖安装；部署后检查 Active 状态。

Linux/Git Bash 可运行 `bash scripts/deploy-cloud-functions.sh`，它在独立目录生成 cloudbaserc 并调用 CloudBase CLI，保留部署目录供检查。

请使用上述打包流程；源文件中的 `../shared` 引用需要在部署包中改为 `./shared` 并携带完整 shared 目录。

## 备份和证据

本机备份及核验文件位于：

`C:/Users/22729/AppData/Local/Temp/loveCalendar-cloud-audit-20261009/`

- `backups/`：同步前 31 个云函数的 ZIP 备份，均已校验 SHA-256。
- `deployed-packages/`：最终实际部署包。
- `wechat-read-smoke.json`、`wechat-write-smoke.json`、`wechat-page-smoke.json`：开发者工具验证结果。
- `wechat-index.png`：小程序主页截图。

开发者工具保留在主页；自动化连接已断开。项目配置是本机忽略文件，未包含访问令牌。
