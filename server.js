// Bordon portfolio: отдаёт сайт и принимает заявки на разбор.
// Отправляет заявку в Telegram. Ноль зависимостей, только стандартная библиотека Node.
//
// Переменные окружения:
//   TELEGRAM_BOT_TOKEN  токен бота от @BotFather (обязательно)
//   TELEGRAM_CHAT_ID    куда слать заявки (обязательно)
//   PORT                порт, по умолчанию 3000
//   ALLOWED_ORIGIN      origin для CORS, по умолчанию пусто (только свой домен)
//   BRIEF_LOG           файл для резервной записи заявок, по умолчанию data/briefs.jsonl

import { createServer } from "node:http";
import { readFile, appendFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";
const BRIEF_LOG = process.env.BRIEF_LOG || join(ROOT, "data", "briefs.jsonl");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const MAX_BODY = 16 * 1024; // больше заявке не нужно
const MAX_FIELD = 1200; // предел на одно поле
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5; // заявок с одного адреса в час

/** @type {Map<string, number[]>} */
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function cors(req) {
  const origin = req.headers.origin;
  const allow = ALLOWED_ORIGIN
    ? ALLOWED_ORIGIN.split(",").map((s) => s.trim())
    : [];
  if (origin && (allow.includes(origin) || allow.includes("*"))) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      Vary: "Origin",
    };
  }
  return {};
}

function send(res, code, body, extra = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type":
      typeof body === "string"
        ? "text/plain; charset=utf-8"
        : "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extra,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("too-large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function clean(value) {
  return String(value == null ? "" : value)
    .trim()
    .slice(0, MAX_FIELD);
}

function composeBrief(fields) {
  const lines = [
    "Заявка на разбор с сайта",
    "",
    `Имя: ${fields.name}`,
    `Контакт: ${fields.contact}`,
    `Задача: ${fields.task}`,
  ];
  if (fields.pain) lines.push(`Что не работает: ${fields.pain}`);
  if (fields.limits) lines.push(`Сроки и бюджет: ${fields.limits}`);
  lines.push("", `Когда: ${new Date().toISOString()}`);
  return lines.join("\n");
}

async function remember(text, meta) {
  try {
    await mkdir(dirname(BRIEF_LOG), { recursive: true });
    await appendFile(
      BRIEF_LOG,
      JSON.stringify({ at: new Date().toISOString(), ...meta, text }) + "\n",
      "utf8",
    );
  } catch {
    /* резервная запись не должна ломать отправку */
  }
}

async function toTelegram(text) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok !== true) {
    throw new Error(`telegram: ${res.status} ${data.description || ""}`.trim());
  }
  return true;
}

async function handleBrief(req, res) {
  const headers = cors(req);
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (!TOKEN || !CHAT_ID) {
    send(res, 503, { error: "Отправка не настроена на сервере." }, headers);
    return;
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    send(
      res,
      429,
      { error: "Слишком много заявок с одного адреса. Напишите в Telegram." },
      headers,
    );
    return;
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch {
    send(res, 413, { error: "Заявка слишком большая." }, headers);
    return;
  }

  let body;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    send(res, 400, { error: "Не удалось прочитать заявку." }, headers);
    return;
  }

  // ловушка для ботов: поле скрыто от людей
  if (clean(body.trap)) {
    send(res, 200, { ok: true }, headers);
    return;
  }

  const fields = {
    name: clean(body.name),
    contact: clean(body.contact),
    task: clean(body.task),
    pain: clean(body.pain),
    limits: clean(body.limits),
  };

  if (fields.name.length < 2) {
    send(res, 400, { error: "Напишите, как к вам обращаться." }, headers);
    return;
  }
  if (fields.contact.length < 2) {
    send(res, 400, { error: "Напишите, как с вами связаться." }, headers);
    return;
  }
  if (fields.task.length < 5) {
    send(
      res,
      400,
      { error: "Опишите задачу хотя бы одним предложением." },
      headers,
    );
    return;
  }

  const text = composeBrief(fields);
  await remember(text, { ip });

  try {
    await toTelegram(text);
    send(res, 200, { ok: true }, headers);
  } catch (err) {
    send(
      res,
      502,
      { error: "Не получилось отправить. Напишите в Telegram напрямую." },
      headers,
    );
    void err;
  }
}

async function serveStatic(req, res, urlPath) {
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const target = join(ROOT, normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!target.startsWith(ROOT) || !existsSync(target)) {
    send(res, 404, "Не найдено");
    return;
  }
  try {
    const file = await readFile(target);
    res.writeHead(200, {
      "Content-Type":
        MIME[extname(target).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(file);
  } catch {
    send(res, 500, "Ошибка чтения файла");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname === "/api/health") {
    send(res, 200, { status: "ok", telegram: Boolean(TOKEN && CHAT_ID) });
    return;
  }
  if (url.pathname === "/api/brief") {
    if (req.method !== "POST" && req.method !== "OPTIONS") {
      send(res, 405, { error: "Только POST." }, cors(req));
      return;
    }
    await handleBrief(req, res);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Только GET");
    return;
  }
  await serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  process.stdout.write(`Портфолио: http://localhost:${PORT}
`);
  process.stdout.write(`Отправка в Telegram: ${TOKEN && CHAT_ID ? "настроена" : "не настроена"}
`);
});
