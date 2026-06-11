#!/bin/bash
set -e

APP_DIR="/www/wwwroot/telegram-mini-app"

echo "[deploy] Pulling latest code..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

echo "[deploy] Copying .env..."
cp .env mini-app/.env
cp .env mini-app-admin/.env

echo "[deploy] Running prisma db push..."
cd "$APP_DIR/mini-app"
npm install --prefer-offline
npx prisma generate --schema ../prisma/schema.prisma
npx prisma db push --schema ../prisma/schema.prisma --accept-data-loss

echo "[deploy] Building mini-app..."
npm run build

echo "[deploy] Building mini-app-admin..."
cd "$APP_DIR/mini-app-admin"
npm install --prefer-offline
npx prisma generate --schema ../prisma/schema.prisma
npm run build

echo "[deploy] Restarting services..."
pm2 restart mini-app || pm2 start npm --name mini-app -- start --prefix "$APP_DIR/mini-app"
pm2 restart mini-app-admin || pm2 start npm --name mini-app-admin -- start --prefix "$APP_DIR/mini-app-admin"
pm2 save

echo "[deploy] Done!"
