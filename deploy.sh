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

echo "[deploy] Installing mini-app dependencies..."
cd "$APP_DIR/mini-app"
npm install --prefer-offline
npx prisma generate --schema ../prisma/schema.prisma

echo "[deploy] Running database migrations..."
npx prisma migrate deploy --schema ../prisma/schema.prisma

echo "[deploy] Building mini-app..."
rm -rf .next
npm run build

echo "[deploy] Installing mini-app-admin dependencies..."
cd "$APP_DIR/mini-app-admin"
npm install --prefer-offline
npx prisma generate --schema ../prisma/schema.prisma

echo "[deploy] Building mini-app-admin..."
rm -rf .next
npm run build

echo "[deploy] Restarting services..."
pm2 restart mini-app --update-env || PORT=3000 HOSTNAME=0.0.0.0 pm2 start npm --name mini-app -- start --prefix "$APP_DIR/mini-app"
pm2 restart mini-app-admin --update-env || PORT=3001 HOSTNAME=0.0.0.0 pm2 start npm --name mini-app-admin -- start --prefix "$APP_DIR/mini-app-admin"

pm2 save

echo "[deploy] Done!"