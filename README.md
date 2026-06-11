## Prisma Schema 唯一来源

所有数据库 schema 统一维护在 `/prisma/schema.prisma`。前台 (mini-app) 和后台 (mini-app-admin) 都必须基于此 schema 生成 Prisma Client：

```bash
npx prisma generate --schema ../prisma/schema.prisma
npx prisma migrate deploy --schema ../prisma/schema.prisma
```

禁止在子目录维护独立 schema 副本。

### 首次初始化迁移

如果 `prisma/migrations` 目录为空（新环境首次部署），需要先创建初始迁移：

```bash
# 开发环境（有数据库连接时）
cd mini-app
DATABASE_URL="mysql://..." npx prisma migrate dev --schema ../prisma/schema.prisma --name initial

# 生产环境（数据库已有数据，不需要重建表）
# 使用 migrate resolve 标记当前 schema 状态：
DATABASE_URL="mysql://..." npx prisma migrate resolve --schema ../prisma/schema.prisma --applied 20260000000000_initial
```

**注意**：不要在生产环境使用 `prisma db push --accept-data-loss`。