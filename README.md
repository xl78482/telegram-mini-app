# Telegram Mini App

一个基于 Telegram Mini App 的电商系统，包含前端用户端和后台管理系统。

## 技术栈

- **前端**: Next.js 14 + Tailwind CSS + Telegram Mini App SDK
- **后台**: Next.js 14 + Tailwind CSS + TOTP 2FA
- **数据库**: MySQL + Prisma ORM
- **运行时**: Node.js 20

## 项目结构

```
.
├── prisma/              # 数据库 Schema
│   └── schema.prisma
├── mini-app/            # 前端 Telegram Mini App (端口 3000)
└── mini-app-admin/      # 后台管理系统 (端口 3001)
```

## 快速开始

### 1. 配置数据库

```bash
# 复制环境变量
cp .env.example .env
# 填写 MySQL 连接信息
```

### 2. 初始化数据库

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. 启动前端

```bash
cd mini-app
pnpm install
pnpm dev
```

### 4. 启动后台

```bash
cd mini-app-admin
pnpm install
pnpm dev
```

## 后台登录

首次访问 `/setup` 页面扫码绑定 Google Authenticator，之后访问 `/login` 输入6位验证码登录。
