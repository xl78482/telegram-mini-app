# 财神商盟 — 项目架构文档

## 项目概览

Telegram Mini App 发卡商城，双应用架构：

| 应用 | 端口 | 目录 | 用途 |
|------|------|------|------|
| mini-app | 3000 | `/workspace/mini-app` | 用户端 Telegram Mini App 商城 |
| mini-app-admin | 3001 | `/workspace/mini-app-admin` | 管理后台（订单/商品/充值管理） |

- 框架：Next.js 15 (mini-app) / Next.js 14 (mini-app-admin)
- 数据库：MySQL，Prisma ORM（Schema 唯一来源 `/workspace/prisma/schema.prisma`）
- 部署：pm2 管理进程，`deploy.sh` 自动化部署

---

## 目录结构

```
/workspace/
├── prisma/
│   ├── schema.prisma          # 数据库 Schema（唯一来源）
│   └── migrations/            # 数据库迁移文件
│
├── mini-app/                  # 用户端 Next.js 应用
│   ├── app/
│   │   ├── api/
│   │   │   ├── products/      # 商品列表/详情 API
│   │   │   ├── orders/        # 订单创建/列表/详情/取消/支付 API
│   │   │   ├── user/          # 用户信息/余额 API
│   │   │   └── profile/       # 用户资料更新 API
│   │   ├── page.tsx           # 首页（商品列表）
│   │   ├── product/[id]/      # 商品详情页
│   │   ├── orders/[id]/       # 订单详情页
│   │   └── profile/           # 个人中心页
│   ├── components/            # 前端组件
│   ├── lib/
│   │   ├── telegram.ts        # Telegram initData HMAC 校验
│   │   ├── api-fetch.ts       # 前端请求封装（自动携带身份）
│   │   ├── payment.ts         # 余额支付核心逻辑（事务内）
│   │   ├── delivery.ts        # 发卡工具函数
│   │   ├── order-lock.ts      # 订单锁/过期释放
│   │   ├── stock.ts           # 库存同步
│   │   └── prisma.ts          # Prisma 客户端
│   └── package.json
│
├── mini-app-admin/            # 管理后台 Next.js 应用
│   ├── app/
│   │   ├── (admin)/           # 后台页面（订单管理、商品管理、充值等）
│   │   └── login/             # 登录页
│   └── package.json
│
├── deploy.sh                  # 部署脚本
├── ARCHITECTURE.md            # 本文件
└── README.md                  # 项目说明
```

---

## 一、用户认证与信息获取

该项目没有传统账号密码登录，完全依赖 Telegram WebApp 身份系统。

### 流程

```
用户打开 Telegram Mini App
        │
        ▼
Telegram 客户端注入 window.Telegram.WebApp（含 initData）
        │
        ▼
前端请求 → api-fetch.ts 自动读取 initData
        │  放到 x-init-data 请求头
        ▼
后端 API 收到请求头 x-init-data
        │
        ▼
parseTelegramUser(initData)
        │
        ├─ validateTelegramData(initData)
        │    │  HMAC-SHA256 校验
        │    │  密钥链：HMAC('sha256', 'WebAppData').update(BOT_TOKEN) → secretKey
        │    │        HMAC('sha256', secretKey).update(dataCheckString).digest('hex') → expectedHash
        │    │  比对 expectedHash === hash
        │    ▼
        ├─ 校验通过 → 解析 JSON.parse(data.user)
        │    → { id, username, first_name, last_name, photo_url }
        │
        ▼
prisma.user.upsert({ where: { tgId } })
    ├─ create: 首次访问 → 自动创建用户（balance: 0）
    └─ update: 已存在 → 更新用户名/头像等资料
```

### 关键特性

- **用户自动创建**：任何 API 首次访问时自动注册，无需手动登录
- **无状态**：每次请求独立验证 initData 签名，不依赖 session/token
- **所有 API 统一身份来源**：`x-init-data` 请求头

### 涉及文件

| 文件 | 作用 |
|------|------|
| [telegram.ts](file:///workspace/mini-app/lib/telegram.ts) | HMAC 签名验证、用户信息解析 |
| [api-fetch.ts](file:///workspace/mini-app/lib/api-fetch.ts) | 前端自动注入 x-init-data 头 |
| [user/route.ts](file:///workspace/mini-app/app/api/user/route.ts) | GET /api/user → 返回用户信息和余额 |

---

## 二、商品展示流程

### 首页商品列表

```
访问 / → HomePage
        │
        ▼
fetch('/api/products')           ← 公开接口，无需身份
        │
        ▼
GET /api/products (products/route.ts)
    prisma.product.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { specs: { where: { isActive: true } } }
    })
        │
        ▼
返回 JSON（price 转为字符串避免精度丢失）
前端按分类筛选展示商品卡片
```

### 商品详情页

```
访问 /product/[id]
        │
        ▼
并行请求：
├─ apiFetch(`/api/products/${id}`) → 商品信息 + 规格列表
└─ apiFetch('/api/user')          → 用户余额（用于支付弹窗）
        │
        ▼
用户操作：
    1. 选择规格（如有）
    2. 选择数量（1～库存/最多10）
    3. 点击"立即购买"
```

### 涉及文件

| 文件 | 作用 |
|------|------|
| [products/route.ts](file:///workspace/mini-app/app/api/products/route.ts) | 商品列表/详情 API |
| [page.tsx](file:///workspace/mini-app/app/page.tsx) | 首页（商品列表 + 分类筛选） |
| [product/[id]/page.tsx](file:///workspace/mini-app/app/product/[id]/page.tsx) | 商品详情页（下单入口） |

---

## 三、下单与余额支付闭环

核心业务流程：下单 → 锁定卡密 → 余额支付 → 自动发卡 → 展示卡密

### Step 1: 创建订单（锁定卡密防超卖）

```
POST /api/orders
Body: {
    items: [{ productId, specId?, quantity }],
    paymentMethod: 'BALANCE'
}
        │
        ▼
校验：商品存在且上架 → 规格匹配 → 数量合法（每次限1种商品）
        │
        ▼
Prisma $transaction（原子操作）:
    1. 查可用卡密
       cardSecret.findMany({
           where: { productId, specId, status: 'AVAILABLE' },
           orderBy: { id: 'asc' },
           take: quantity
       })
       → 不足 quantity 条 → 抛异常"库存不足"（事务回滚）

    2. 创建订单
       order.create({ orderNo, userId, status:'PENDING', payStatus:'PENDING', ... })
       + orderItem.create({ productId, specId, quantity, price, ... })

    3. 锁定卡密
       cardSecret.updateMany({
           where: { id: { in: cardIds }, status: 'AVAILABLE' },
           data: { status: 'LOCKED', lockedOrderId: newOrder.id, lockedAt: now }
       })
       → count !== quantity → 抛异常（并发超卖防护）

    4. 订单创建成功
        │
        ▼
事务外：syncProductStock(productId, specId) 同步库存
        │
        ▼
返回 { id, orderNo, status, totalAmount, expiresAt }
前端弹出支付确认窗（显示余额、订单金额、支付后余额）
```

### Step 2: 余额支付

```
POST /api/orders/[id]/pay/balance
        │
        ▼
前置：expirePendingOrders() 清理已过期订单
        │
        ▼
Prisma $transaction → processBalancePayment(tx, orderId, userId)：
        │
    ── 原子状态锁 ──
    1. order.updateMany({ id, userId, status:'PENDING', payStatus:'PENDING' })
         data: { status: 'PROCESSING' }
       → count === 0:
         - 已 COMPLETED → 幂等返回成功
         - 已 CANCELLED → 返回"订单已取消"
         - 已 PROCESSING → 返回"正在处理，请勿重复支付"
         - 其他 → 返回"订单状态异常"

    ── 校验 ──
    2. 确认 paymentMethod === 'BALANCE'
    3. 确认未超时（expiresAt）
    4. 确认锁定卡密数 = 订单购买数

    ── 扣款 ──
    5. user.updateMany({ id: userId, balance: { gte: totalAmount } })
         data: { balance: { decrement: totalAmount } }
       → count === 0 → 余额不足，回滚状态为 PENDING，返回"余额不足"

    ── 记录流水 ──
    6. balanceLog.create({ type:'PAY_ORDER', amount: -totalAmount, balanceBefore, balanceAfter })
    7. paymentRecord.upsert({ where: { orderId_channel: 'BALANCE' } })
       → upsert 幂等，防止重复支付

    ── 发卡 ──
    8. cardSecret.updateMany({ where: { lockedOrderId, status:'LOCKED' } })
         data: { status:'SOLD', soldOrderId, soldToUserId, soldAt }
       → count !== quantity → 抛异常

    9. deliveryLog.createMany({ skipDuplicates: true })
       → 配合 @@unique([cardSecretId]) 表级约束，防止重复发卡

    ── 完成 ──
    10. order.update({ status:'COMPLETED', payStatus:'SUCCESS', paidAt: now })
    11. syncProductStock(productId, specId, tx) 同步库存
        │
        ▼
返回 { ok: true, deliveredCount }
前端跳转 /orders/[id] 查看卡密
```

### Step 3: 查看卡密

```
访问 /orders/[id]
        │
        ▼
GET /api/orders/[id]
        │
        ▼
orders/[id]/route.ts 返回订单详情 + 卡密
    getOrderCardKeys() 只对 payStatus='SUCCESS' 的订单返回卡密
        │
        ▼
前端渲染卡密列表，每条显示：
    • 序号（卡密 #1, #2, ...）
    • content（明文卡密）
    • "复制"按钮（navigator.clipboard.writeText）
```

### 超时/取消处理

```
用户取消 → POST /api/orders/[id]/cancel
            │
            ▼
releaseOrderLockedCards(orderId, 'USER_CANCELLED')
    1. order.updateMany({ status:'PENDING'→'CANCELLED', payStatus:'FAILED' })
    2. cardSecret.updateMany({ status:'LOCKED'→'AVAILABLE', lockedOrderId: null })
    3. syncProductStock() 同步库存

定时过期 → expirePendingOrders()（支付前/下单查询前调用）
            │
            ▼
扫描全部 status=PENDING + expiresAt < now 的订单
逐条调用 releaseOrderLockedCards(orderId, 'TIMEOUT')
```

### 并发安全设计

| 层级 | 措施 |
|------|------|
| 数据库约束 | `@@unique([orderId, channel])` — 防止重复支付记录 |
| 数据库约束 | `@@unique([cardSecretId])` — 防止重复发卡 |
| 原子锁 | `updateMany` + `where` 条件作为行锁（PENDING→PROCESSING） |
| 事务 | 所有写操作在 Prisma Transaction 内，异常自动回滚 |
| 幂等写入 | `upsert` + `createMany(skipDuplicates: true)` |
| 并发扣款 | `updateMany({ balance: { gte: amount } })` + `decrement` |
| 超卖防护 | 锁定卡密后校验 count === quantity |

### 涉及文件

| 文件 | 作用 |
|------|------|
| [orders/route.ts](file:///workspace/mini-app/app/api/orders/route.ts) | 订单创建/列表 API |
| [orders/[id]/route.ts](file:///workspace/mini-app/app/api/orders/[id]/route.ts) | 订单详情 API |
| [pay/balance/route.ts](file:///workspace/mini-app/app/api/orders/[id]/pay/balance/route.ts) | 余额支付 API |
| [payment.ts](file:///workspace/mini-app/lib/payment.ts) | 余额支付核心逻辑 |
| [delivery.ts](file:///workspace/mini-app/lib/delivery.ts) | 发卡工具 |
| [order-lock.ts](file:///workspace/mini-app/lib/order-lock.ts) | 订单取消/过期释放 |
| [stock.ts](file:///workspace/mini-app/lib/stock.ts) | 库存同步 |
| [product/[id]/page.tsx](file:///workspace/mini-app/app/product/[id]/page.tsx) | 商品详情页（下单+支付） |
| [orders/[id]/page.tsx](file:///workspace/mini-app/app/orders/[id]/page.tsx) | 订单详情页（展示卡密） |

---

## 四、管理员后台

### 认证

- TOTP（基于时间的一次性密码）双因子认证
- TOTP 密钥存储于 `admin_config` 表
- 首次使用需通过 `/api/admin/auth/setup` 初始化

### 功能

| 功能 | API 路径 | 说明 |
|------|----------|------|
| 订单管理 | `/api/admin/orders` | 订单列表（含发卡数统计） |
| 查看卡密 | `/api/admin/orders/[id]/cards` | 查看订单卡密明文 |
| 商品管理 | CRUD 接口 | 商品/规格增删改查 |
| 卡密导入 | 导入接口 | 批量导入卡密 |
| 用户充值 | 充值接口 | 手动充值余额（记录 recharge_logs） |

---

## 五、部署流程

[deploy.sh](file:///workspace/deploy.sh) 执行步骤：

```
1. git fetch origin main && git reset --hard origin/main
   → 拉取最新代码

2. 复制 .env → mini-app/.env + mini-app-admin/.env

3. cd mini-app
   npm install
   npx prisma generate --schema ../prisma/schema.prisma

4. npx prisma migrate deploy --schema ../prisma/schema.prisma
   → 只应用未执行的迁移文件（代替危险的 db push）

5. rm -rf .next && npm run build

6. cd mini-app-admin
   npm install
   npx prisma generate --schema ../prisma/schema.prisma
   rm -rf .next && npm run build

7. pm2 restart mini-app (port 3000)
   pm2 restart mini-app-admin (port 3001)
   pm2 save
```

---

## 六、数据库模型关系

```
┌──────────┐       ┌───────────┐       ┌────────────┐
│   User   │1──N──→│   Order   │1──N──→│  OrderItem │
└──────────┘       └───────────┘       └────────────┘
     │                   │1──N──→ PaymentRecord
     │1──N──→ BalanceLog
     │1──N──→ RechargeLog
     │1──N──→ DeliveryLog ───N:1──→ CardSecret
                                      │
                                      N:1
                                      │
                               ┌──────────┐       ┌─────────────┐
                               │ Product  │1──N──→│ ProductSpec │
                               └──────────┘       └─────────────┘
                                    │1──N──→ CardSecret

辅助表：
- AdminConfig     → TOTP 密钥
- SystemSetting   → KV 配置（USDT 汇率、订单过期时间、支付网关参数等）
- PaymentCallbackLog → 第三方支付回调日志
```

### 核心模型字段说明

| 模型 | 关键字段 | 说明 |
|------|----------|------|
| User | tgId (BigInt, unique) | Telegram 用户 ID，唯一标识 |
| Order | status, payStatus, expiresAt | 状态机：PENDING→PAID/PROCESSING→COMPLETED/CANCELLED |
| CardSecret | content (unique), status, lockedOrderId | 卡密内容唯一，状态机：AVAILABLE→LOCKED→SOLD |
| PaymentRecord | orderId+channel unique | 每笔订单每种支付方式最多一条记录 |
| DeliveryLog | cardSecretId unique | 每条卡密最多发一次 |
| ProductSpec | productId FK | 商品可选规格（月卡/季卡/年卡等） |

---

## 七、关键设计原则

1. **数据完整 > 性能**：宁可慢，不能丢数据或重复发卡
2. **幂等优先**：所有关键写入（支付、发卡）都保证幂等
3. **数据库约束兜底**：应用层防不住时，数据库唯一索引作为最后防线
4. **原子操作防并发**：使用 `updateMany` + `where` 条件模拟行锁，不用应用层互斥锁
5. **Prisma Schema 单一来源**：两个应用共用 `/workspace/prisma/schema.prisma`，通过 `--schema` 参数指定