# 财神商盟 — 项目架构文档

> 本文档按当前仓库实际运行逻辑整理。当前项目只启用余额支付，EPUSDT / OKPAY 相关字段和表属于数据库预留能力，不参与当前支付闭环。

## 项目概览

Telegram Mini App 发卡商城，采用用户端 + 管理后台双应用架构。

| 应用 | 端口 | 目录 | 用途 |
| --- | --- | --- | --- |
| `mini-app` | `3000` | `mini-app/` | 用户端 Telegram Mini App 商城 |
| `mini-app-admin` | `3001` | `mini-app-admin/` | 管理后台，负责订单、商品、卡密、充值管理 |

当前实际技术栈：

- 用户端：Next.js `15.1.3`，React `19`
- 管理后台：Next.js `14.2.3`，React `18`
- 数据库：MySQL
- ORM：Prisma `5.22.0`
- Prisma Schema 单一来源：`prisma/schema.prisma`
- 部署脚本：`deploy.sh`
- 生产部署目录：`/www/wwwroot/telegram-mini-app`
- 进程管理：PM2，进程名分别为 `mini-app` 和 `mini-app-admin`
- 当前支付能力：仅余额支付 `BALANCE`

## 目录结构

```text
telegram-mini-app/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── mini-app/
│   ├── app/
│   │   ├── api/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── user/
│   │   ├── page.tsx
│   │   ├── product/[id]/
│   │   ├── orders/[id]/
│   │   └── profile/
│   ├── components/
│   ├── lib/
│   │   ├── telegram.ts
│   │   ├── telegram-user.ts
│   │   ├── api-fetch.ts
│   │   ├── payment.ts
│   │   ├── delivery.ts
│   │   ├── order-lock.ts
│   │   ├── stock.ts
│   │   └── prisma.ts
│   └── package.json
│
├── mini-app-admin/
│   ├── app/
│   │   ├── api/admin/
│   │   ├── (admin)/
│   │   └── login/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── session.ts
│   │   ├── stock.ts
│   │   └── prisma.ts
│   └── package.json
│
├── deploy.sh
├── ARCHITECTURE.md
└── README.md
```

## 一、用户认证与自动建档

用户端没有传统账号密码登录，身份来自 Telegram WebApp 的 `initData`。

```text
Telegram Mini App 打开
        │
        ▼
前端通过 window.Telegram.WebApp.initData 获取身份数据
        │
        ▼
api-fetch.ts 请求 API 时写入请求头 x-init-data
        │
        ▼
后端 parseTelegramUser(initData)
        │
        ├─ validateTelegramData(initData)
        │    ├─ URLSearchParams 解析 initData
        │    ├─ 删除 hash 字段
        │    ├─ 其余字段按 key 排序并组成 dataCheckString
        │    ├─ secretKey = HMAC-SHA256('WebAppData', TELEGRAM_BOT_TOKEN)
        │    ├─ expectedHash = HMAC-SHA256(secretKey, dataCheckString)
        │    └─ expectedHash 必须等于 initData.hash
        │
        └─ JSON.parse(data.user)
              得到 Telegram 用户信息
        │
        ▼
getOrCreateTelegramUser / 等价 upsert 逻辑
        │
        ▼
prisma.user.upsert({ where: { tgId } })
    ├─ 新用户：创建 users 记录，balance 默认为 0
    └─ 老用户：同步 username / firstName / lastName / avatarUrl
```

当前实际状态：

- `/api/user` 使用 `mini-app/lib/telegram-user.ts` 的 `getOrCreateTelegramUser`。
- `/api/orders/[id]`、`/api/orders/[id]/cancel`、`/api/orders/[id]/pay/balance` 已接入 `getOrCreateTelegramUser`。
- `/api/orders` 当前文件内保留了等价的本地 upsert 实现，运行效果与 `getOrCreateTelegramUser` 一致。
- 商品列表和商品详情 API 是公开接口，不需要 Telegram 身份。

相关文件：

| 文件 | 实际作用 |
| --- | --- |
| `mini-app/lib/telegram.ts` | Telegram `initData` HMAC 校验与用户解析 |
| `mini-app/lib/telegram-user.ts` | 用户端统一 upsert Telegram 用户 |
| `mini-app/lib/api-fetch.ts` | 前端请求封装，自动携带 `x-init-data` |
| `mini-app/app/api/user/route.ts` | 返回用户资料和余额，并自动 upsert 用户 |
| `mini-app/app/api/orders/route.ts` | 订单列表/创建，当前文件内有等价本地 upsert 逻辑 |

## 二、商品展示逻辑

### 商品列表

```text
首页 / 
  │
  ▼
GET /api/products
  │
  ▼
查询 isActive = true 的商品
按 sortOrder 升序返回
同时返回 isActive = true 的规格列表
价格 Decimal → string
  │
  ▼
前端展示商品卡片与分类筛选
```

### 商品详情

```text
/product/[id]
  │
  ├─ GET /api/products/[id]  获取商品详情、规格、库存
  └─ GET /api/user           获取用户余额，用于余额支付弹窗
       │
       ▼
用户选择规格、数量
点击立即购买
```

当前前端逻辑：

- 有规格商品必须选择规格才能下单。
- 数量最多取 `库存` 和 `10` 的较小值。
- 当前商品详情页只用 `BALANCE` 创建订单。
- 余额支付确认弹窗展示订单金额、当前余额、支付后余额。

## 三、下单与锁卡逻辑

当前下单接口只允许余额支付。

```text
POST /api/orders
Body: {
  items: [{ productId, specId?, quantity }],
  paymentMethod: 'BALANCE'
}
```

接口实际处理：

```text
1. 校验 Telegram 身份，自动 upsert 用户
2. 校验 paymentMethod，只允许 BALANCE
3. 校验 items，每次只允许一种商品/规格组合
4. 校验 productId、specId、quantity 必须合法
5. 查询商品，确认商品存在且 isActive = true
6. 如果商品有规格：必须传入有效且启用的 specId
7. 如果商品无规格：specId 强制为 null
8. 使用 Prisma.Decimal 计算 totalAmount = unitPrice * quantity
9. 读取 system_settings.order_expire_minutes，默认 15 分钟
10. 在事务内查找可用卡密并创建订单
```

事务内核心步骤：

```text
1. cardSecret.findMany({ productId, specId, status:'AVAILABLE' })
   - specId 精确匹配
   - 无规格商品只匹配 specId = null 的卡密
   - orderBy id asc
   - take quantity
   - 不足数量则抛出“库存不足”，事务回滚

2. order.create(...)
   - status = PENDING
   - payStatus = PENDING
   - paymentMethod = BALANCE
   - expiresAt = 当前时间 + 过期分钟
   - 同时创建 order_items

3. cardSecret.updateMany({ id in cardIds, status:'AVAILABLE' })
   - 更新为 LOCKED
   - 写入 lockedOrderId 和 lockedAt
   - count !== quantity 时抛错回滚，防止并发超卖
```

事务提交后：

```text
syncProductStock(productId, specId)
返回订单基础信息
前端弹出余额支付确认弹窗
```

## 四、余额支付与自动发卡逻辑

余额支付入口：

```text
POST /api/orders/[id]/pay/balance
```

接口层处理：

```text
1. 校验 orderId
2. 校验 Telegram initData
3. 自动 upsert Telegram 用户
4. 先执行 expirePendingOrders()，释放已过期待支付订单
5. 在 Prisma transaction 内调用 processBalancePayment(tx, orderId, user.id)
```

`processBalancePayment` 实际逻辑：

```text
1. 原子状态锁
   order.updateMany({
     id,
     userId,
     status:'PENDING',
     payStatus:'PENDING',
     paymentMethod:'BALANCE'
   }, data: { status:'PROCESSING' })

2. 如果抢锁失败
   - 当前用户的订单已 COMPLETED + SUCCESS → 幂等返回成功
   - CANCELLED → 返回订单已取消
   - PROCESSING → 返回正在处理中
   - 其他 → 返回订单状态异常

3. 查询订单和订单明细，必须属于当前 userId

4. 超时检查
   - 如果 expiresAt 已过期：
     - 释放该订单 LOCKED 卡密为 AVAILABLE
     - 订单改为 CANCELLED
     - payStatus 改为 EXPIRED
     - cancelReason = TIMEOUT
     - 同步库存
     - 返回订单已超时

5. 严格校验卡密数量
   - lockedCards.length 必须等于订单购买总数量
   - 不允许大于或小于，避免少发或多发卡

6. 原子扣款
   user.updateMany({ id:userId, balance:{ gte: totalAmount } }, decrement totalAmount)
   - count !== 1 → 余额不足，订单状态恢复 PENDING，返回余额不足

7. 写余额流水
   balance_logs:
   - type = PAY_ORDER
   - amount = -totalAmount
   - balanceBefore / balanceAfter 精确记录

8. 写支付流水
   payment_records upsert({ orderId + channel:BALANCE })
   - 依赖数据库唯一约束 @@unique([orderId, channel])

9. 自动发卡
   cardSecret.updateMany({ lockedOrderId, status:'LOCKED' })
   - 改为 SOLD
   - 写入 soldOrderId / soldToUserId / soldAt
   - count 必须等于订单购买数量

10. 写发卡日志
    delivery_logs createMany(skipDuplicates:true)
    - 依赖数据库唯一约束 @@unique([cardSecretId])

11. 完成订单
    order.status = COMPLETED
    order.payStatus = SUCCESS
    order.paidAt = now

12. 事务内同步库存
    syncProductStock(productId, specId, tx)
```

返回给前端：

```json
{
  "ok": true,
  "message": "支付成功",
  "deliveredCount": 1
}
```

## 五、订单详情与卡密展示

订单详情入口：

```text
GET /api/orders/[id]
```

实际逻辑：

```text
1. 校验 orderId
2. 校验 Telegram initData
3. 自动 upsert 用户
4. 先执行 expirePendingOrders()
5. 查询当前用户自己的订单
6. 查询订单明细 items
7. 调用 getOrderCardKeys(prisma, order.id, user.id)
8. 返回订单详情和 cardKeys
```

`getOrderCardKeys` 只在以下条件返回卡密：

```text
1. 订单必须属于当前 userId
2. payStatus 必须是 SUCCESS
3. status 必须是 COMPLETED 或 PAID
4. 只返回 soldOrderId = orderId 且 soldToUserId = userId 的卡密
```

前端订单详情页负责渲染卡密内容和复制按钮。

## 六、订单取消与过期释放

### 用户手动取消

```text
POST /api/orders/[id]/cancel
```

接口层：

```text
1. 校验 orderId
2. 校验 Telegram initData
3. 自动 upsert 用户
4. 查询当前用户自己的订单
5. 只有 status = PENDING 才能取消
6. 调用 releaseOrderLockedCards(order.id, 'USER_CANCELLED')
```

`releaseOrderLockedCards` 实际逻辑：

```text
1. order.updateMany({ id, status:'PENDING' })
   - 设置 status = CANCELLED
   - cancelReason = USER_CANCELLED
   - payStatus = FAILED

2. 如果 count !== 1，说明订单已不是 PENDING，幂等跳过

3. 找到该订单 status = LOCKED 的卡密

4. cardSecret.updateMany({ lockedOrderId, status:'LOCKED' })
   - 改为 AVAILABLE
   - lockedOrderId = null
   - lockedAt = null

5. 事务内 syncProductStock(productId, specId, tx)
```

### 订单超时释放

`expirePendingOrders()` 实际不是定时任务，而是在多个 API 请求前被调用：

- `GET /api/orders`
- `GET /api/orders/[id]`
- `POST /api/orders/[id]/pay/balance`

实际逻辑：

```text
1. 扫描 status = PENDING 且 expiresAt < now 的订单
2. 逐个调用 releaseOrderLockedCards(orderId, 'TIMEOUT')
3. TIMEOUT 会让 payStatus = EXPIRED
4. 被释放的卡密恢复 AVAILABLE
5. 同步库存
```

另外，如果订单刚进入余额支付事务后发现超时，`payment.ts` 会在事务内释放该订单卡密，并将订单改为：

```text
status = CANCELLED
payStatus = EXPIRED
cancelReason = TIMEOUT
```

## 七、库存同步规则

用户端和后台各有一个 `stock.ts`，逻辑保持一致：

```text
Product.stock = card_secrets 中 productId 相同且 status = AVAILABLE 的数量
ProductSpec.stock = card_secrets 中 specId 相同且 status = AVAILABLE 的数量
```

调用场景：

- 创建订单并锁卡后同步库存。
- 支付发卡后同步库存。
- 取消订单释放卡密后同步库存。
- 订单过期释放卡密后同步库存。
- 后台导入卡密后同步库存。
- 后台启用/禁用卡密后同步库存。

注意：

- 无规格商品的卡密必须是 `specId = null`。
- 有规格商品导入卡密时必须选择有效规格。
- 后台不能直接修改商品或规格库存，库存由卡密状态自动计算。

## 八、后台管理实际逻辑

### 后台认证

后台认证使用 TOTP + iron-session。

```text
/api/admin/auth/setup
  GET  → 生成 TOTP secret 和二维码，写入 admin_config，isSetup=false
  POST → 校验验证码，成功后 isSetup=true

/api/admin/auth/login
  POST → 校验 TOTP code，成功后写入 iron-session：session.isLoggedIn = true

requireAuth()
  读取 iron-session
  session.isLoggedIn 不存在时 redirect('/login')
```

配置表：`admin_config`。

Session cookie 名称：`admin_session`。

### 后台功能

| 功能 | API | 当前实际逻辑 |
| --- | --- | --- |
| 商品列表 | `GET /api/admin/products` | 返回商品、规格和卡密状态统计 |
| 创建商品 | `POST /api/admin/products` | 校验名称、价格、排序，库存强制 0，库存由卡密同步 |
| 修改商品 | `PUT /api/admin/products/[id]` | 忽略 `stock` 和 `sales`，校验价格与图片 |
| 删除商品 | `DELETE /api/admin/products/[id]` | 软删除，设置 `isActive=false` |
| 规格列表 | `GET /api/admin/products/[id]/specs` | 返回某商品全部规格 |
| 创建规格 | `POST /api/admin/products/[id]/specs` | 校验名称、Decimal 价格，初始库存 0 |
| 修改规格 | `PUT /api/admin/specs/[id]` | 忽略直接传入的 stock |
| 删除规格 | `DELETE /api/admin/specs/[id]` | 若仍有 AVAILABLE / LOCKED 卡密则禁止删除 |
| 卡密列表 | `GET /api/admin/cards` | 支持 productId、specId、status、keyword、分页筛选 |
| 导入卡密 | `POST /api/admin/cards` | 校验商品/规格归属，批量去重，createMany + skipDuplicates |
| 修改卡密状态 | `PUT /api/admin/cards/[id]` | SOLD 禁止改；LOCKED 禁止手动释放；只允许 AVAILABLE ↔ DISABLED |
| 删除卡密 | `DELETE /api/admin/cards/[id]` | SOLD 禁止删除；其他状态软禁用为 DISABLED |
| 用户列表 | `GET /api/admin/users` | 返回最多 200 个用户和订单数 |
| 管理员充值 | `PATCH /api/admin/users` | Decimal 增加余额，同时写 `recharge_logs` 与 `balance_logs` |
| 订单列表 | `GET /api/admin/orders` | 返回最近 100 条订单，可按 status 筛选，含 deliveryCount |

## 九、数据库模型关系

```text
User 1 ── N Order 1 ── N OrderItem
User 1 ── N RechargeLog
User 1 ── N BalanceLog
User 1 ── N PaymentRecord
User 1 ── N DeliveryLog

Product 1 ── N ProductSpec
Product 1 ── N CardSecret
Product 1 ── N OrderItem

Order 1 ── N PaymentRecord
Order 1 ── N DeliveryLog
CardSecret 1 ── 0/1 DeliveryLog
```

关键唯一约束：

| 表/模型 | 唯一约束 | 作用 |
| --- | --- | --- |
| `users` / `User` | `tgId` | 一个 Telegram 用户只对应一个用户记录 |
| `orders` / `Order` | `orderNo` | 订单号唯一 |
| `card_secrets` / `CardSecret` | `content` | 卡密内容不能重复导入 |
| `payment_records` / `PaymentRecord` | `orderId + channel` | 同一订单同一支付渠道最多一条支付记录 |
| `delivery_logs` / `DeliveryLog` | `cardSecretId` | 同一张卡密最多发放一次 |
| `system_settings` / `SystemSetting` | `key` | 系统配置 key 唯一 |

## 十、状态机

### 订单状态 `Order.status`

```text
PENDING      待支付，卡密已 LOCKED
PROCESSING   余额支付事务处理中
COMPLETED    支付成功且卡密已 SOLD
CANCELLED    用户取消或超时取消
PAID         Schema 兼容/预留，当前主流程不主动使用
```

### 支付状态 `Order.payStatus`

```text
PENDING   待支付
SUCCESS   支付成功
FAILED    用户取消或支付失败
EXPIRED   超时取消
```

### 卡密状态 `CardSecret.status`

```text
AVAILABLE   可购买
LOCKED      已被待支付订单锁定
SOLD        已支付并发给用户
DISABLED    后台禁用，不参与库存
```

## 十一、并发安全设计

| 层级 | 措施 |
| --- | --- |
| 下单防超卖 | 先查 AVAILABLE 卡密，再 `updateMany({ id in cardIds, status:'AVAILABLE' })`，校验 `count === quantity` |
| 支付防重复 | `order.updateMany({ status:'PENDING', payStatus:'PENDING' })` 抢状态锁，改为 `PROCESSING` |
| 扣款防并发 | `user.updateMany({ balance:{ gte: amount } })` + `decrement` |
| 支付记录幂等 | `paymentRecord.upsert` + `@@unique([orderId, channel])` |
| 发卡幂等 | `deliveryLog.createMany({ skipDuplicates:true })` + `@@unique([cardSecretId])` |
| 卡密数量校验 | 支付前要求 `lockedCards.length === order.items.quantity 总和` |
| 事务回滚 | 余额扣款、支付记录、发卡、订单完成均在同一 transaction 内 |
| 库存一致 | 每次锁卡、发卡、释放卡密后调用 `syncProductStock` |

## 十二、部署流程

实际 `deploy.sh` 使用生产目录：

```bash
APP_DIR="/www/wwwroot/telegram-mini-app"
```

执行步骤：

```text
1. cd /www/wwwroot/telegram-mini-app
2. git fetch origin main
3. git reset --hard origin/main
4. cp .env mini-app/.env
5. cp .env mini-app-admin/.env
6. cd mini-app
7. npm install --prefer-offline
8. npx prisma generate --schema ../prisma/schema.prisma
9. npx prisma migrate deploy --schema ../prisma/schema.prisma
10. rm -rf .next && npm run build
11. cd ../mini-app-admin
12. npm install --prefer-offline
13. npx prisma generate --schema ../prisma/schema.prisma
14. rm -rf .next && npm run build
15. pm2 restart mini-app --update-env || PORT=3000 HOSTNAME=0.0.0.0 pm2 start npm --name mini-app -- start --prefix "$APP_DIR/mini-app"
16. pm2 restart mini-app-admin --update-env || PORT=3001 HOSTNAME=0.0.0.0 pm2 start npm --name mini-app-admin -- start --prefix "$APP_DIR/mini-app-admin"
17. pm2 save
```

数据库迁移使用 `migrate deploy`，不再使用危险的 `db push --accept-data-loss`。

## 十三、当前支付边界

当前项目主流程只支持余额支付：

- 下单接口只接受 `paymentMethod = BALANCE`。
- 前端商品详情页创建订单时只传 `BALANCE`。
- 已有 `EPUSDT`、`OKPAY`、`PaymentCallbackLog`、`usdtAmount`、`SystemSetting` 支付网关字段属于预留设计。
- 在真正接入第三方支付前，不应允许用户创建 `EPUSDT / OKPAY` 订单。

## 十四、关键设计原则

1. 余额、价格、订单金额一律用 Prisma Decimal，避免 JS 浮点误差。
2. 卡密库存是计算值，来源于 `card_secrets.status = AVAILABLE` 的数量。
3. 商品和规格库存不允许后台直接改，由 `syncProductStock` 自动同步。
4. 支付和发卡必须在事务内完成，异常自动回滚。
5. 任何支付/发卡重复请求都必须幂等。
6. 数据库唯一约束作为最后防线。
7. 当前未接入第三方支付，不开放三方支付入口。
