#!/bin/bash
set -e

cd /www/wwwroot/telegram-mini-app

echo "1. 拉取最新 main"
git fetch origin main
git reset --hard origin/main

echo "2. 同步环境变量"
cp .env mini-app/.env
cp .env mini-app-admin/.env

echo "3. 构建前端 mini-app"
cd /www/wwwroot/telegram-mini-app/mini-app
npm install --registry=https://registry.npmmirror.com
npx prisma generate --schema ../prisma/schema.prisma
npm run build

echo "4. 构建后台 mini-app-admin"
cd /www/wwwroot/telegram-mini-app/mini-app-admin
npm install --registry=https://registry.npmmirror.com
npx prisma generate --schema ../prisma/schema.prisma
npm run build

echo "5. 同步数据库"
cd /www/wwwroot/telegram-mini-app/mini-app
npx prisma db push --schema ../prisma/schema.prisma

echo "6. 重启 PM2"
pm2 restart mini-app || pm2 start npm --name mini-app --prefix /www/wwwroot/telegram-mini-app/mini-app -- start
pm2 restart mini-app-admin || pm2 start npm --name mini-app-admin --prefix /www/wwwroot/telegram-mini-app/mini-app-admin -- start

pm2 save

echo "部署完成"
