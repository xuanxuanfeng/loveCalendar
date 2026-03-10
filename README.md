# 情侣纪念日小程序

## 项目简介

情侣纪念日小程序是一个面向情侣的应用，帮助用户记录和管理重要的纪念日和日常回忆。小程序以日历形式展示，用户可以在任意日期添加多条记录，每条记录支持上传多张图片。用户还可以将特定日期标记为纪念日，系统会自动计算并展示距离下次纪念日的天数。

## 功能特性

### 1. 日历首页
- 以日历形式展示月份视图
- 高亮显示有记录或纪念日的日期
- 支持月份切换
- 标记今日日期
- 显示情侣关系状态

### 2. 记录管理
- 添加记录（支持文字和多张图片）
- 查看指定日期的所有记录
- 编辑已有记录
- 删除记录（同时清理相关图片）
- 选择性分享给伴侣

### 3. 纪念日管理
- 添加纪念日（名称和日期）
- 查看所有纪念日列表
- 显示距离纪念日的倒计时
- 编辑和删除纪念日
- 选择性分享给伴侣

### 4. 情侣关系功能（新增）
- 情侣绑定：通过请求方式建立情侣关系
- 数据共享：情侣双方可以查看彼此的记录和纪念日
- 协同编辑：情侣双方都可以编辑共享的数据
- 分享控制：可以选择性地分享特定记录或纪念日给伴侣
- 请求管理：支持发送、接受、拒绝情侣关系请求

### 5. 云存储管理
- 图片上传到云存储
- 自动清理删除记录时的相关图片
- 支持多图片上传

## 技术架构

### 前端技术
- 微信小程序框架
- WXML、WXSS、JavaScript
- 云开发能力集成

### 后端技术
- 腾讯云云开发（CloudBase）
- 云函数（Node.js）
- 云数据库（NoSQL）
- 云存储

### 数据库设计
- `users`: 用户信息集合
- `records`: 记录信息集合
- `anniversaries`: 纪念日信息集合
- `couples`: 情侣关系集合

## 云函数列表

### 记录相关
- `createRecord`: 创建记录（支持情侣数据共享）
- `updateRecord`: 更新记录（支持情侣数据共享）
- `deleteRecord`: 删除记录（含图片清理，支持情侣数据共享）
- `getRecordById`: 获取单条记录
- `getRecordsByDate`: 获取指定日期记录
- `getRecordsByDateRange`: 获取日期范围内的记录

### 纪念日相关
- `createAnniversary`: 创建纪念日（支持情侣数据共享）
- `updateAnniversary`: 更新纪念日（支持情侣数据共享）
- `deleteAnniversary`: 删除纪念日
- `getAllAnniversaries`: 获取所有纪念日
- `getAnniversaries`: 获取纪念日列表

### 情侣关系相关（新增）
- `handleCoupleRequest`: 处理情侣关系请求（发送、接受、拒绝、取消）
- `manageCouple`: 管理情侣关系（创建、获取、更新、删除）

### 其他功能
- `getCalendarData`: 获取日历数据（支持情侣数据共享）
- `initUser`: 初始化用户
- `getOpenId`: 获取用户OpenID
- `deleteImages`: 删除图片文件

## 项目结构

```
miniprogram/                 # 小程序前端代码
├── app.js                   # 小程序入口文件
├── app.json                 # 小程序配置
├── app.wxss                 # 全局样式
├── components/              # 组件
│   └── calendar/           # 日历组件
├── pages/                  # 页面
│   ├── index/             # 首页
│   ├── day-detail/        # 日期详情页
│   ├── add-record/        # 添加记录页
│   ├── record-detail/     # 记录详情页
│   ├── anniversaries/     # 纪念日列表页
│   ├── add-anniversary/   # 添加纪念日页
│   └── couple-bind/       # 情侣绑定页
└── sitemap.json           # 站点地图配置

cloudfunctions/             # 云函数代码
├── createRecord/           # 创建记录
├── updateRecord/           # 更新记录
├── deleteRecord/           # 删除记录
├── getRecordById/          # 获取记录详情
├── getRecordsByDate/       # 获取指定日期记录
├── getRecordsByDateRange/  # 获取日期范围记录
├── createAnniversary/      # 创建纪念日
├── updateAnniversary/      # 更新纪念日
├── deleteAnniversary/      # 删除纪念日
├── getAllAnniversaries/    # 获取所有纪念日
├── getCalendarData/        # 获取日历数据
├── initUser/               # 初始化用户
├── manageCouple/           # 管理情侣关系
├── handleCoupleRequest/    # 处理情侣关系请求
├── getOpenId/              # 获取OpenID
└── deleteImages/           # 删除图片
```

## 部署说明

1. 确保已开通腾讯云云开发环境
2. 在微信开发者工具中打开项目
3. 上传并部署所有云函数（运行环境：Nodejs18.15）
4. 在云开发控制台配置数据库权限
5. 预览和发布小程序

### 云函数运行环境

**重要：所有云函数必须使用 Nodejs18.15 运行环境**

- 运行环境：`Nodejs18.15`
- 依赖安装：已启用
- 权限配置：已设置

## 安全说明

- 数据库采用私有权限控制
- 用户数据隔离，仅可访问自己的数据
- 图片上传有格式和大小限制
- 云函数进行用户身份验证

## 开发说明

本项目使用微信小程序云开发能力，无需额外服务器配置。所有业务逻辑通过云函数实现，数据存储使用云数据库，文件存储使用云存储。

## 版权信息

本项目为情侣纪念日小程序，旨在帮助情侣记录美好时光。