# yanjing 小程序

三端业务骨架项目（客户、销售员、管理者）。

## 目录说明
- `miniprogram/pages/entry`：角色选择入口
- `miniprogram/pages/home`：首页
- `miniprogram/pages/workbench`：功能页
- `miniprogram/pages/stats`：统计页
- `miniprogram/pages/mine`：我的页
- `miniprogram/pages/member-create`：新增会员
- `miniprogram/pages/order-create`：普通/验光开单
- `miniprogram/pages/order-list`：配镜记录
- `miniprogram/pages/order-detail`：订单详情
- `miniprogram/pages/after-sale`：售后追踪（回访/复查/历史）
- `miniprogram/pages/appointment`：服务预约
- `miniprogram/pages/training`：视训中心（方案/核销/设备/提醒）
- `miniprogram/pages/inventory`：库存查询（不足/超限/追踪）
- `miniprogram/pages/member-query`：会员查询
- `miniprogram/pages/vision-profile`：视力档案
- `miniprogram/pages/finance-summary`：财务汇总
- `miniprogram/pages/optometry-create`：新增验光
- `miniprogram/pages/purchase`：采购管理
- `miniprogram/pages/settings`：系统设置（公告/打印/费率/权限）
- `miniprogram/pages/payment`：收款
- `miniprogram/pages/delivery`：顾客取件
- `miniprogram/components/bottom-nav`：底部导航
- `miniprogram/services/auth-session.ts`：登录引导、角色切换、鉴权就绪检查
- `miniprogram/services/auth.ts`：认证接口服务
- `miniprogram/services/mock/server.ts`：本地 mock API
- `miniprogram/store/app-state.ts`：全局状态与存储持久化
- `miniprogram/utils/request.ts`：统一请求封装
- `miniprogram/utils/role.ts`：角色展示与角色选项
- `miniprogram/types`：公共类型定义
- `miniprogram/utils/mock-data.ts`：演示数据

## 运行方式
1. 微信开发者工具打开项目目录 `C:\tool\study\yanjing`。
2. 进入后默认打开 `pages/entry/index`，选择角色进入对应视图。
3. 当前为骨架版本，菜单点击为占位提示。

## TypeScript 检查
1. 安装依赖：`npm.cmd install`
2. 单次检查：`npm.cmd run typecheck`
3. 持续监听：`npm.cmd run typecheck:watch`

## P0 基础层现状
1. 已支持 `wx.login -> /auth/login -> /auth/profile` 认证流程。
2. 当前默认启用 mock 接口：`miniprogram/config/env.ts` 中 `useMockApi: true`。
3. 切换角色会触发重新登录并刷新全局权限上下文。
4. 已完成两批驱动改造：`auth/member/order/vision/purchase/settings/finance` 已接入驱动层。
5. 已支持运行时联调配置：系统设置页可切换 `Mock/真实后端` 并配置 `API Base URL`。
6. 已支持请求字段风格切换：`snake_case / camelCase / 双写兼容`。

## 当前策略（2026-04-15）
1. 开发优先级：先完成小程序功能，不阻塞在正式域名采购与备案。
2. 开发阶段默认使用 `Mock`；需要联调时可短时切换真实后端测试域名。
3. 正式域名采购、备案与云托管自定义域名绑定放到上线前统一执行。

## 下一步建议
1. 继续按业务模块完成功能开发与页面收口（默认 `Mock`）。
2. 需要验证真实接口时，在 `系统设置 -> 系统设置 Tab -> 联调配置` 关闭 `Mock` 并填写 `API Base URL`。
3. 点击 `联调自检`，先验证 `auth/member/order` 三条链路可用。
4. 点击 `主链路联调（写入）`，执行 `auth -> member -> order -> payment -> delivery` 一次完整写入校验。
5. 若失败，按页面展示的联调日志和错误码（含 `url`）定位后端问题。
6. 上线前统一完成正式域名与小程序合法域名配置。

## 联调文档
1. [接口联调清单（驱动层）](C:/tool/study/yanjing/接口联调清单（驱动层）.md)
