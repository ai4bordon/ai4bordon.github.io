#!/usr/bin/env bash
# Развёртывание портфолио на этом сервере: сайт плюс приём заявок в Telegram.
# Запуск: bash /opt/bordon/deploy.sh
# Секреты берутся из /opt/bordon/.env, в командную строку не попадают.
set -euo pipefail

APP_DIR=/opt/bordon
NET=dokploy-network
DOMAIN=bordon.digitai.icu
IMAGE=node:22-alpine
PORT_IN=3000

cd "$APP_DIR"

# AUD-12, SSOT: фронт (app.js API_BASE) обязан указывать на этот же домен.
if ! grep -q "https://$DOMAIN" app.js; then
  echo "app.js не ссылается на https://$DOMAIN — обновите API_BASE" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "нет $APP_DIR/.env — создайте его с TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  echo "в .env не заданы TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID" >&2
  exit 1
fi

echo "==> перезапуск"
RULE='Host(`'"$DOMAIN"'`)'
docker rm -f bordon >/dev/null 2>&1 || true

docker run -d --name bordon \
  --restart unless-stopped \
  --network "$NET" \
  -e PORT="$PORT_IN" \
  -e TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
  -e TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID" \
  -e ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-https://ai4bordon.github.io}" \
  -v "$APP_DIR:/app" -w /app \
  --label traefik.enable=true \
  --label "traefik.docker.network=$NET" \
  --label "traefik.http.routers.bordon-http.entrypoints=web" \
  --label "traefik.http.routers.bordon-http.middlewares=redirect-to-https@file" \
  --label "traefik.http.routers.bordon-http.rule=$RULE" \
  --label "traefik.http.routers.bordon-https.entrypoints=websecure" \
  --label "traefik.http.routers.bordon-https.rule=$RULE" \
  --label "traefik.http.routers.bordon-https.tls=true" \
  --label "traefik.http.routers.bordon-https.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.bordon.loadbalancer.server.port=$PORT_IN" \
  "$IMAGE" node server.js >/dev/null

sleep 5
echo -n "  контейнер: "
docker ps --filter "name=^bordon$" --format '{{.Status}}'
echo -n "  сайт:      "
curl -s -o /dev/null -w '%{http_code}\n' "https://$DOMAIN/"
echo -n "  приём:     "
curl -s "https://$DOMAIN/api/health"
echo
