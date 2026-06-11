## Prisma Schema 唯一来源

所有数据库 schema 统一维护在 `/prisma/schema.prisma`。前台 (mini-app) 和后台 (mini-app-admin) 都必须基于此 schema 生成 Prisma Client：

```bash
npx prisma generate --schema ../prisma/schema.prisma
npx prisma migrate deploy --schema ../prisma/schema.prisma
```

禁止在子目录维护独立 schema 副本。

### 数据库迁移方案

项目已提供完整的 migration SQL 文件，位于 `prisma/migrations/` 目录：

- `20260612000000_initial/` — 完整建表 SQL（含所有表、索引、外键）
- `20260612000100_add_payment_idempotency_indexes/` — 新增幂等性唯一索引（适用于已有数据的数据库 baseline）

#### 方案 A：空数据库部署

适用于全新服务器、没有历史数据的数据库。首次使用 `migrate deploy` 会自动按顺序执行所有 migration：

```bash
cd mini-app
DATABASE_URL="mysql://user:pass@host:3306/dbname" npx prisma migrate deploy --schema ../prisma/schema.prisma
```

#### 方案 B：已有数据的数据库（由 db push 创建）

如果数据库已经由 `prisma db push` 创建过，表已存在，不可以直接执行 initial migration（会因为表已存在而报错）。请按以下步骤 baseline：

```bash
# 1. 标记 initial migration 为已应用（跳过建表，只记录状态）
cd mini-app
DATABASE_URL="mysql://user:pass@host:3306/dbname" npx prisma migrate resolve --schema ../prisma/schema.prisma --applied 20260612000000_initial

# 2. 然后执行增量 migration（只新增唯一索引）
DATABASE_URL="mysql://user:pass@host:3306/dbname" npx prisma migrate deploy --schema ../prisma/schema.prisma
```

部署脚本 `deploy.sh` 已配置为自动执行 `npx prisma migrate deploy`。

**注意**：不要在生产环境使用 `prisma db push --accept-data-loss`。