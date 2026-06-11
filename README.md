## Prisma Schema 唯一来源

所有数据库 schema 统一维护在 `/prisma/schema.prisma`。前台 (mini-app) 和后台 (mini-app-admin) 都必须基于此 schema 生成 Prisma Client：

```bash
npx prisma generate --schema ../prisma/schema.prisma
npx prisma migrate deploy --schema ../prisma/schema.prisma
```

禁止在子目录维护独立 schema 副本。

### 数据库迁移方案

项目已提供完整的 migration SQL 文件，位于 `prisma/migrations/` 目录：

- `20260612000000_initial/` — 基础建表 SQL（12 张表、基本索引、外键）
- `20260612000100_add_payment_idempotency_indexes/` — 新增幂等性唯一索引

`migrate deploy` 会按文件名顺序依次执行两个 migration。

#### 方案 A：空数据库部署

适用于全新服务器、没有历史数据的数据库。直接执行：

```bash
cd mini-app
DATABASE_URL="mysql://user:pass@host:3306/dbname" npx prisma migrate deploy --schema ../prisma/schema.prisma
```

执行顺序：
1. `20260612000000_initial` — 创建完整表结构（12 张表 + 基础索引）
2. `20260612000100_add_payment_idempotency_indexes` — 添加唯一索引
3. 最终数据库结构和 `schema.prisma` 完全一致

#### 方案 B：已有数据的数据库（由 db push 创建）

如果表已存在，先 baseline 跳过 initial migration，然后只执行增量 migration。

**⚠️ 执行前必须先检查重复数据**

检查 PaymentRecord 是否存在重复的 `(order_id, channel)`：

```sql
SELECT order_id, channel, COUNT(*) AS cnt
FROM payment_records
WHERE order_id IS NOT NULL
GROUP BY order_id, channel
HAVING cnt > 1;
```

检查 DeliveryLog 是否存在重复的 `card_secret_id`：

```sql
SELECT card_secret_id, COUNT(*) AS cnt
FROM delivery_logs
GROUP BY card_secret_id
HAVING cnt > 1;
```

如果查出重复数据，必须先人工处理重复记录，否则添加唯一索引会失败。

**步骤：**

```bash
# 1. 标记 initial 为已应用（跳过建表，只记录状态）
cd mini-app
DATABASE_URL="mysql://user:pass@host:3306/dbname" npx prisma migrate resolve --schema ../prisma/schema.prisma --applied 20260612000000_initial

# 2. 执行增量 migration（只新增唯一索引）
DATABASE_URL="mysql://user:pass@host:3306/dbname" npx prisma migrate deploy --schema ../prisma/schema.prisma
```

部署脚本 `deploy.sh` 已配置为自动执行 `npx prisma migrate deploy`。

**注意**：不要在生产环境使用 `prisma db push --accept-data-loss`。