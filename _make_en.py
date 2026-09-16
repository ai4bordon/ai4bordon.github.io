"""Собирает en.html из index.html: заменяет видимый текст на английский.

После замены проверяет, что кириллицы в файле не осталось.
"""

import re
from pathlib import Path

SRC = Path("index.html")
OUT = Path("en.html")

PAIRS = [
 ('<html lang="ru">', '<html lang="en">'),
 (
  "<title>Bordon. ИИ-агенты, LLM и продукты под ключ</title>",
  "<title>Bordon. AI agents, LLM and products end to end</title>",
 ),
 (
  '<link rel="alternate" hreflang="en" href="en.html">',
  '<link rel="alternate" hreflang="ru" href="index.html">',
 ),
 (
  '<a class="skip" href="#works">К работам</a>',
  '<a class="skip" href="#works">Skip to work</a>',
 ),
 ('aria-label="Основная навигация"', 'aria-label="Main navigation"'),
 ('<a href="#do">Что делаю</a>', '<a href="#do">What I do</a>'),
 ('<a href="#works">Работы</a>', '<a href="#works">Work</a>'),
 ('<a href="#shots">Интерфейсы</a>', '<a href="#shots">Interfaces</a>'),
 ('<a href="#formats">Цены</a>', '<a href="#formats">Pricing</a>'),
 ('<a href="#faq">Вопросы</a>', '<a href="#faq">FAQ</a>'),
 ('<a href="#brief">Заявка</a>', '<a href="#brief">Request</a>'),
 ("</span>Доступен", "</span>Available"),
 (
  '<a class="lang" href="en.html" hreflang="en" lang="en">EN</a>',
  '<a class="lang" href="index.html" hreflang="ru" lang="ru">RU</a>',
 ),
 (
  '<h1 class="hero__title">ИИ-агенты<br>и продукты,<br>которые работают</h1>',
  '<h1 class="hero__title">AI agents<br>and products<br>that ship</h1>',
 ),
 (
  """          Мультиагентные сценарии, интеграции с LLM и продукт:<br>
          веб-приложения, админ-панели, трекеры, Telegram-боты и ТМА, лендинги.""",
  """          Multi-agent pipelines, LLM integrations and the product:<br>
          web apps, admin panels, trackers, Telegram bots and TMAs, landing pages.""",
 ),
 (
  '<a class="btn btn--primary" href="#brief">Оставить заявку на разбор</a>',
  '<a class="btn btn--primary" href="#brief">Request a free review</a>',
 ),
 (
  '<a class="link" href="https://t.me/bordon_ai">Или написать в Telegram</a>',
  '<a class="link" href="https://t.me/bordon_ai">Or message me on Telegram</a>',
 ),
 (
  '<p class="offer__badge">Разбор задачи бесплатно</p>',
  '<p class="offer__badge">Free task review</p>',
 ),
 (
  """            Присылаете два предложения о задаче, получаете критерии приёмки, состав работ и дату.
            Материалы остаются у вас. Если задача не моя, скажу сразу.""",
  """            Send two sentences about your task and get acceptance criteria, scope and a delivery date.
            The material stays with you. If the task is not mine, I say so up front.""",
 ),
 ("<h2>Что делаю</h2>", "<h2>What I do</h2>"),
 ('aria-label="Направления работы"', 'aria-label="Work directions"'),
 (">Агенты и LLM</button>", ">Agents and LLM</button>"),
 (">Веб-продукты</button>", ">Web products</button>"),
 (">Лендинги</button>", ">Landing pages</button>"),
 (">Инфраструктура</button>", ">Infrastructure</button>"),
 ("<h3>Мультиагентные сценарии</h3>", "<h3>Multi-agent pipelines</h3>"),
 (
  "<p>Процесс разбивается на роли: один агент достаёт данные, второй оценивает, третий ищет похожие случаи в базе знаний. Работу между ними распределяет координатор, и каждый шаг можно проверить отдельно, а не гадать, что случилось внутри одного большого промпта.</p>",
  "<p>The process is split into roles: one agent extracts data, another scores it, a third looks for similar cases in the knowledge base. A coordinator assigns the work, and every step can be checked on its own instead of guessing what happened inside one large prompt.</p>",
 ),
 ("<h3>Интеграции с LLM</h3>", "<h3>LLM integrations</h3>"),
 (
  "<p>Подключаю OpenAI и Gemini к вашим данным и правилам: где модель отвечает свободно, где работает по жёсткому шаблону, а где обязана сослаться на источник. Настраиваю лимиты, повторы и поведение при отказе модели.</p>",
  "<p>I connect OpenAI and Gemini to your data and your rules: where the model answers freely, where it follows a strict template, and where it must cite a source. Rate limits, retries and fallback behaviour are part of the setup.</p>",
 ),
 ("<h3>Поиск по своим данным</h3>", "<h3>Search over your own data</h3>"),
 (
  "<p>Индексирую документы, регламенты и историю обращений. Ответ приходит со ссылками на фрагменты-источники и оценкой релевантности, поэтому видно, на чём он основан и где мог ошибиться.</p>",
  "<p>I index documents, policies and past conversations. Answers arrive with links to source fragments and a relevance score, so you can see what they are based on and where they might be wrong.</p>",
 ),
 ("<h3>Надёжность агентов</h3>", "<h3>Agent reliability</h3>"),
 (
  "<p>Промпты и сценарии ломаются тихо: ответ стал хуже, и никто не заметил. Закрываю это набором проверок и регрессией в CI. Правка промпта не проходит дальше, если сломала прежние ответы.</p>",
  "<p>Prompts and pipelines break quietly: answers get worse and nobody notices. I close that gap with a test set and regression checks in CI. A prompt change does not pass if it broke earlier answers.</p>",
 ),
 ("<h3>Веб-приложения</h3>", "<h3>Web applications</h3>"),
 (
  "<p>Полноценные приложения под процесс: авторизация, роли, база данных, загрузка файлов, экспорт, интеграции с внешними сервисами. Работает в браузере без установки, открывается с телефона.</p>",
  "<p>Full applications built around a process: authentication, roles, database, file upload, export, third-party integrations. Runs in the browser with no install and opens on a phone.</p>",
 ),
 ("<h3>Административные панели</h3>", "<h3>Admin panels</h3>"),
 (
  "<p>Внутренний инструмент для команды: справочники, модерация, массовые операции, права по ролям, журнал действий. То, что обычно живёт в таблицах и переписке, переезжает в один экран.</p>",
  "<p>An internal tool for the team: reference data, moderation, bulk operations, role-based access, audit log. What usually lives in spreadsheets and chat threads moves into one screen.</p>",
 ),
 ("<h3>Дашборды и отчётность</h3>", "<h3>Dashboards and reporting</h3>"),
 (
  "<p>Воронки, сроки, загрузка исполнителей, сравнение периодов, выгрузка в таблицу. Считаю на стороне сервера, чтобы цифры совпадали у всех, а не зависели от выгрузки в Excel.</p>",
  "<p>Funnels, deadlines, workload, period comparison, export to a spreadsheet. Metrics are computed server-side so the numbers match for everyone instead of depending on one person&rsquo;s export.</p>",
 ),
 ("<h3>Мини-CRM и трекеры</h3>", "<h3>Mini CRM and trackers</h3>"),
 (
  "<p>Контакты, сделки, этапы, история касаний, задачи и канбан со сроками. Роли администратора, менеджера и исполнителя: каждый видит только своё и не может залезть в чужое.</p>",
  "<p>Contacts, deals, stages, activity history, tasks and a kanban with deadlines. Administrator, manager and contractor roles: each sees only their own work and cannot reach into someone else&rsquo;s.</p>",
 ),
 ("<h3>Боты</h3>", "<h3>Bots</h3>"),
 (
  "<p>Приём заявок, уведомления по событиям и срокам, воронки анонсов, ответы по базе знаний. С кэшем и логированием, чтобы при сбое было видно, что именно пришло и что ушло.</p>",
  "<p>Intake, notifications on events and deadlines, announcement funnels, answers from the knowledge base. With caching and logging, so a failure shows exactly what came in and what went out.</p>",
 ),
 ("<h3>Мини-аппы</h3>", "<h3>Mini apps</h3>"),
 (
  "<p>Интерфейс внутри Telegram: формы, списки, карточки, оплата. Не нужна установка приложения и отдельный аккаунт, а данные приходят с того же бэкенда, что и в вебе.</p>",
  "<p>An interface inside Telegram: forms, lists, cards, payments. No app install and no separate account, and the data comes from the same backend as the web version.</p>",
 ),
 ("<h3>Связка с бэкендом</h3>", "<h3>Wired to your backend</h3>"),
 (
  "<p>Бот работает с вашим API, базой и внешними сервисами, а не живёт отдельной игрушкой. Один источник правды: изменения в вебе сразу видны в боте.</p>",
  "<p>The bot works with your API, database and third-party services instead of living as a separate toy. One source of truth: a change in the web app shows up in the bot immediately.</p>",
 ),
 ("<h3>Доступы и роли</h3>", "<h3>Access and roles</h3>"),
 (
  "<p>Кто видит заявки, кто меняет статусы, кто выгружает данные. Ограничения проверяются на сервере, а не спрятаны в кнопках интерфейса.</p>",
  "<p>Who sees requests, who changes statuses, who exports data. Restrictions are enforced on the server, not hidden behind disabled buttons.</p>",
 ),
 ("<h3>Структура под нишу</h3>", "<h3>Structure for the niche</h3>"),
 (
  "<p>Порядок блоков и аргументы собираются под конкретную аудиторию: у психолога, кофейни и платёжного сервиса они разные. Проверено на пяти живых страницах.</p>",
  "<p>Section order and arguments are built for a specific audience: a therapist, a coffee shop and a payment service need different ones. Proven on five live pages.</p>",
 ),
 ("<h3>Форма заявки</h3>", "<h3>Lead form</h3>"),
 (
  "<p>Заявка с уведомлением, выгрузкой и защитой от спама. Видно, откуда пришёл человек и что он хотел, а не просто «новая заявка».</p>",
  "<p>A form with notifications, export and spam protection. You see where the person came from and what they wanted, not just &ldquo;new lead&rdquo;.</p>",
 ),
 ("<h3>Скорость и адаптив</h3>", "<h3>Speed and responsiveness</h3>"),
 (
  "<p>От 320 пикселей, проверка в Safari и на реальном телефоне. Без тяжёлых конструкторов: страница открывается быстро на мобильном интернете.</p>",
  "<p>From 320 pixels up, tested in Safari and on a real phone. No heavy builders: the page opens fast on mobile data.</p>",
 ),
 ("<h3>Аналитика</h3>", "<h3>Analytics</h3>"),
 (
  "<p>Цели на отправку формы и переходы, подключение метрики, разметка для поиска. Чтобы было видно, работает ли страница, а не «вроде красиво».</p>",
  "<p>Goals on form submits and clicks, analytics wired up, markup for search. So you can see whether the page works instead of assuming it looks fine.</p>",
 ),
 ("<h3>Контейнеры и развёртывание</h3>", "<h3>Containers and deployment</h3>"),
 (
  "<p>Приложение упаковано в образ и поднимается одной командой на любом сервере. Пересборка и перезапуск скриптом: старый контейнер работает до готовности нового.</p>",
  "<p>The app ships as an image and starts with one command on any server. Rebuild and restart by script: the old container keeps serving until the new one is ready.</p>",
 ),
 ("<h3>Домены и сертификаты</h3>", "<h3>Domains and certificates</h3>"),
 (
  "<p>Обратный прокси, маршрутизация по доменам, HTTPS с автоматическим продлением. Плюс перенаправление с http на https и заголовки безопасности.</p>",
  "<p>Reverse proxy, routing by domain, HTTPS with automatic renewal. Plus http to https redirects and security headers.</p>",
 ),
 ("<h3>Базы и данные</h3>", "<h3>Databases and data</h3>"),
 (
  "<p>PostgreSQL с миграциями, регулярные резервные копии, отдельные окружения для разработки и продакшена. Миграции накатываются скриптом, а не руками.</p>",
  "<p>PostgreSQL with migrations, regular backups, separate staging and production environments. Migrations run by script, not by hand.</p>",
 ),
 ("<h3>Наблюдаемость</h3>", "<h3>Observability</h3>"),
 (
  "<p>Эндпоинты здоровья для базы и приложения, логи контейнеров, сбор метрик и алерты на падение. При сбое видно, что именно упало, а не «сайт не работает».</p>",
  "<p>Health endpoints for the database and the app, container logs, metrics and alerts on failure. When something breaks you see what broke, not just &ldquo;the site is down&rdquo;.</p>",
 ),
 ("<h3>Непрерывная поставка</h3>", "<h3>Continuous delivery</h3>"),
 (
  "<p>Проверки и тесты в CI на каждый коммит, сборка образа, автоматический деплой. Ошибка ловится до продакшена, а не после.</p>",
  "<p>Checks and tests in CI on every commit, image build, automated deploy. A mistake is caught before production, not after.</p>",
 ),
 ("<h3>Передача и документация</h3>", "<h3>Handover and documentation</h3>"),
 (
  "<p>README с запуском, схема данных, описание переменных окружения и инструкция по обновлению. Чтобы проект можно было передать другой команде, а не только мне.</p>",
  "<p>A README with run instructions, the data schema, environment variables and an update guide. So the project can be handed to another team, not only to me.</p>",
 ),
 ("<h2>Работы</h2>", "<h2>Work</h2>"),
 (
  '<p class="sec__lead">Фильтр по направлению. Строка раскрывается в детали.</p>',
  '<p class="sec__lead">Filter by direction. Each row expands into the details.</p>',
 ),
 ('aria-label="Фильтр кейсов"', 'aria-label="Case filter"'),
 ('aria-pressed="true">Все</button>', 'aria-pressed="true">All</button>'),
 (
  'aria-pressed="false">ИИ и агенты</button>',
  'aria-pressed="false">AI and agents</button>',
 ),
]

# Переводы кейсов вынесены отдельно: там много длинных строк.
CASE_PAIRS = [
 (">Мультиагентная система</span>", ">Multi-agent system</span>"),
 (
  "Разбор лендинга несколькими агентами: юзабилити, структура, тексты",
  "Landing page review by several agents: usability, structure, copy",
 ),
 (
  "Система разбирает страницу по частям: юзабилити, структура, конверсионные места, тексты. Несколько агентов с разными ролями, результат складывается в один разбор.",
  "The system reviews a page piece by piece: usability, structure, conversion points, copy. Several agents with different roles, merged into one report.",
 ),
 (
  "Аудит без ручного просмотра. Замечания привязаны к конкретным блокам, а не к общим ощущениям.",
  "An audit without manual reading. Notes are tied to specific blocks instead of general impressions.",
 ),
 ("<li>оркестрация агентов</li>", "<li>agent orchestration</li>"),
 (">Мультиагентный конвейер</span>", ">Multi-agent pipeline</span>"),
 (
  "Рекламная кампания собирается агентами по цепочке ролей",
  "A campaign assembled by agents through a chain of roles",
 ),
 (
  "У каждого агента своя роль и зона ответственности. Работа передаётся по цепочке от стратегии к текстам и креативам.",
  "Every agent has a role and an area of responsibility. Work moves along the chain from strategy to copy and creatives.",
 ),
 (
  "Видно, на каком шаге получилось плохо. Можно заменить один шаг, не переделывая весь процесс.",
  "You can see which step went wrong and replace that step without rebuilding the whole process.",
 ),
 (">Инструмент для агентов</span>", ">Agent tooling</span>"),
 (
  "Детерминированная оптимизация контекста: агент не тратит окно на мусор",
  "Deterministic context optimisation: the agent stops wasting its window on noise",
 ),
 (
  "Плагин для Hermes Agent. Оптимизирует контекст инструментов так, что одинаковый вход даёт одинаковый результат.",
  "A plugin for Hermes Agent. It optimises the tool context so the same input produces the same output.",
 ),
 (
  "Именно из-за этого агенты в проде ведут себя по-разному на одинаковых запросах. Здесь поведение воспроизводимо.",
  "This is exactly why agents in production behave differently on identical requests. Here the behaviour is reproducible.",
 ),
 (">Продукт на агентах</span>", ">Product built on agents</span>"),
 (
  "Входящие заявки становятся приоритизированной очередью с историей решений",
  "Incoming requests become a prioritised queue with a decision history",
 ),
 (
  "Конвейер обработки лидов: источники, сырые сигналы, скоринг, очередь и операторские действия на одном API. Отдельный слой поиска по базе знаний с выдачей источников.",
  "A lead processing pipeline: sources, raw signals, scoring, queue and operator actions behind one API. A separate knowledge search layer that returns its sources.",
 ),
 (
  "Не нужно листать почту и таблицы, чтобы понять, что делать первым. Решения оператора фиксируются в истории.",
  "No need to scroll through email and spreadsheets to decide what comes first. Operator decisions are recorded in the history.",
 ),
 (
  "Стенд развёрнут на отдельном сервере и закрыт от публичного доступа. Покажу на созвоне или пришлю доступ по запросу.",
  "The stand runs on a separate server and is closed to the public. I show it on a call or send access on request.",
 ),
 (">Надёжность LLM</span>", ">LLM reliability</span>"),
 (
  "Стенд сравнения промптов: регрессии ловятся в CI, а не клиентом",
  "A prompt comparison bench: regressions are caught in CI, not by your customer",
 ),
 (
  "Ответы сохраняются и сравниваются между версиями промпта. Проверка идёт автоматически, при каждом изменении.",
  "Answers are stored and compared between prompt versions. The check runs automatically on every change.",
 ),
 (
  "Правка промпта не ломает прежние ответы тихо. Поломка видна до выката.",
  "A prompt change does not silently break earlier answers. The break is visible before release.",
 ),
 (">Генерация контента</span>", ">Content generation</span>"),
 (
  "Тексты по фактам со страницы, а не по общим словам про продукт",
  "Copy built from facts on the page instead of generic words about the product",
 ),
 (
  "Сначала разбор веб-страницы, потом генерация постов через OpenAI API по извлечённым фактам.",
  "First the page is parsed, then posts are generated through the OpenAI API from the extracted facts.",
 ),
 (
  "Меньше правок после того, как клиент прочитал очередные «инновационные решения».",
  "Fewer revisions after the client reads another round of &ldquo;innovative solutions&rdquo;.",
 ),
 (">Веб-продукт</span>", ">Web product</span>"),
 (
  "Три роли, канбан с перетаскиванием, история и уведомления. 15 тестов",
  "Three roles, drag and drop kanban, history and notifications. 15 tests",
 ),
 (
  "Трекер проектов и задач: разная видимость данных для трёх ролей, канбан, история изменений, уведомления, поиск с учётом буквы «ё».",
  "A project and task tracker: different data visibility for three roles, kanban, change history, notifications, search that handles Cyrillic properly.",
 ),
 (
  "Команда видит задачи, сроки и загрузку в одном месте. Ноль внешних зависимостей: только стандартная библиотека Node.",
  "The team sees tasks, deadlines and workload in one place. Zero external dependencies: only the Node standard library.",
 ),
 ("<li>15 тестов</li>", "<li>15 tests</li>"),
 (
  "Серии, проценты, тепловая карта. 16 тестов на краевые случаи",
  "Streaks, percentages, heatmap. 16 tests on edge cases",
 ),
 (
  "Трекер привычек: отметка одним нажатием, текущая и лучшая серия, тепловая карта по дням, архив с историей. Отмена отметки пересчитывает статистику.",
  "A habit tracker: one-tap check-in, current and best streak, daily heatmap, archive with history. Undoing a check-in recalculates the stats.",
 ),
 (
  "Видно, где привычка ломается. Серия не рвётся, пока день не закончился, поэтому статистика не врёт.",
  "You can see where a habit breaks. The streak does not break until the day is over, so the stats do not lie.",
 ),
 ("<li>16 тестов</li>", "<li>16 tests</li>"),
 (
  "Пайплайн этапов и отчёты. Просрочка видна до срыва срока. 18 тестов",
  "Stage pipeline and reports. Overdue is visible before the deadline slips. 18 tests",
 ),
 (
  "Трекер этапов заказов: фиксированный пайплайн с историей переходов, назначение исполнителей, отчёты по воронке, времени этапа и загрузке.",
  "An order stage tracker: a fixed pipeline with transition history, contractor assignment, reports on the funnel, stage time and workload.",
 ),
 (
  "Просрочка считается по сроку этапа, а не заказа целиком, поэтому видна заранее.",
  "Overdue is measured by stage deadline rather than the whole order, so it shows up in advance.",
 ),
 ("<li>18 тестов</li>", "<li>18 tests</li>"),
 ("<li>тесты</li>", "<li>tests</li>"),
 (">Страницы под услугу</span>", ">Pages for a service</span>"),
 (
  "Разные ниши: от психолога до мотошколы. У каждой своя структура",
  "Different niches, from a therapist to a motorcycle school. Each has its own structure",
 ),
 (
  "Психолог и коуч, кофейня с заказом онлайн, платёжный шлюз для LatAm, маркетинговое агентство, мотошкола в Санкт-Петербурге.",
  "A therapist and coach, a coffee shop with online ordering, a payment gateway for LatAm, a marketing agency, a motorcycle school in St Petersburg.",
 ),
 (
  "Быстрый способ проверить спрос: страница, форма, заявки. Разные ниши показывают, что структура подбирается под аудиторию.",
  "A fast way to test demand: a page, a form, real requests. The different niches show that structure follows the audience.",
 ),
 (">Психолог и коуч</a></li>", ">Therapist and coach</a></li>"),
 (">Кофейня «Аромат»</a></li>", ">Coffee shop Aromat</a></li>"),
 (
  ">RutaPay, платёжный шлюз в LatAm</a></li>",
  ">RutaPay, payment gateway for LatAm</a></li>",
 ),
 (
  ">Northern Monkey, маркетинговое агентство</a></li>",
  ">Northern Monkey, marketing agency</a></li>",
 ),
 (">Мотошкола «Трек»</a></li>", ">Motorcycle school Trek</a></li>"),
 (">Открыть на GitHub</a>", ">Open on GitHub</a>"),
 (">Открыть живой стенд</a>", ">Open the live stand</a>"),
 ("<h2>Интерфейсы продуктов</h2>", "<h2>Product interfaces</h2>"),
 (
  '<p class="sec__lead">Скриншоты с работающих стендов. Лента листается сама, но можно и вручную.</p>',
  '<p class="sec__lead">Screenshots from live stands. The reel moves on its own, or you can scroll it yourself.</p>',
 ),
 ('aria-label="Предыдущий экран"', 'aria-label="Previous screen"'),
 ('aria-label="Следующий экран"', 'aria-label="Next screen"'),
 ('aria-label="Переход к экрану"', 'aria-label="Go to screen"'),
 (
  "<b>NordFlow Tasks</b>Дашборд: счётчики, графики, лента изменений",
  "<b>NordFlow Tasks</b>Dashboard: counters, charts, activity feed",
 ),
 (
  "<b>NordFlow Tasks</b>Канбан: карточки перетаскиваются мышью",
  "<b>NordFlow Tasks</b>Kanban: cards dragged with the mouse",
 ),
 (
  "<b>HabitFlow</b>Экран «Сегодня»: отметка одним нажатием",
  "<b>HabitFlow</b>Today screen: one-tap check-in",
 ),
 (
  "<b>HabitFlow</b>Серии, проценты, тепловая карта",
  "<b>HabitFlow</b>Streaks, percentages, heatmap",
 ),
 (
  "<b>ТендерПульс</b>Воронка этапов с суммами",
  "<b>TenderPulse</b>Stage funnel with amounts",
 ),
 (
  "<b>ТендерПульс</b>Заказы: фильтры и просрочка",
  "<b>TenderPulse</b>Orders: filters and overdue",
 ),
 (
  "<b>Психолог и коуч</b>Личная страница с записью",
  "<b>Therapist and coach</b>Personal page with booking",
 ),
 (
  "<b>Кофейня «Аромат»</b>Заказ онлайн, забор через 15 минут",
  "<b>Coffee shop Aromat</b>Order online, pick up in 15 minutes",
 ),
 ("<b>RutaPay</b>Платёжный шлюз для LatAm", "<b>RutaPay</b>Payment gateway for LatAm"),
 (
  "<b>Northern Monkey</b>Лендинг маркетингового агентства",
  "<b>Northern Monkey</b>Marketing agency landing page",
 ),
 (
  "<b>Мотошкола «Трек»</b>Набор на обучение",
  "<b>Motorcycle school Trek</b>Enrolment for training",
 ),
 ('alt="NordFlow Tasks, дашборд"', 'alt="NordFlow Tasks dashboard"'),
 ('alt="NordFlow Tasks, канбан"', 'alt="NordFlow Tasks kanban board"'),
 ('alt="HabitFlow, экран Сегодня"', 'alt="HabitFlow today screen"'),
 ('alt="HabitFlow, карточка привычки"', 'alt="HabitFlow habit detail"'),
 ('alt="ТендерПульс, дашборд"', 'alt="TenderPulse dashboard"'),
 ('alt="ТендерПульс, список заказов"', 'alt="TenderPulse order list"'),
 ('alt="Лендинг психолога"', 'alt="Therapist landing page"'),
 ('alt="Лендинг кофейни"', 'alt="Coffee shop landing page"'),
 ('alt="Лендинг платёжного шлюза"', 'alt="Payment gateway landing page"'),
 ('alt="Лендинг маркетингового агентства"', 'alt="Marketing agency landing page"'),
 ('alt="Лендинг мотошколы"', 'alt="Motorcycle school landing page"'),
 ("<h2>Как идёт работа</h2>", "<h2>How the work goes</h2>"),
 (
  '<p class="sec__lead">Четыре шага. На каждом вы получаете то, что можно потрогать.</p>',
  '<p class="sec__lead">Four steps. Each one gives you something you can touch.</p>',
 ),
 ("<h3>Разбор задачи</h3>", "<h3>Task review</h3>"),
 (
  "<p>Читаю описание, задаю вопросы, которые обычно не задают.</p>",
  "<p>I read your description and ask the questions people usually skip.</p>",
 ),
 (
  '<p class="step__out">На выходе: критерии приёмки, объём, дата</p>',
  '<p class="step__out">You get: acceptance criteria, scope, date</p>',
 ),
 ("<h3>Прототип</h3>", "<h3>Prototype</h3>"),
 (
  "<p>Рабочая версия, а не макет: хранит данные, считает, показывает.</p>",
  "<p>A working version, not a mockup: it stores data, computes and displays.</p>",
 ),
 (
  '<p class="step__out">На выходе: живая ссылка</p>',
  '<p class="step__out">You get: a live link</p>',
 ),
 ("<h3>Доработка</h3>", "<h3>Revisions</h3>"),
 (
  "<p>Замечания собираю списком и правлю по нему, спорное обсуждаем.</p>",
  "<p>I collect notes into a list and work through it; anything debatable we discuss.</p>",
 ),
 (
  '<p class="step__out">На выходе: список правок и решений</p>',
  '<p class="step__out">You get: a list of changes and decisions</p>',
 ),
 ("<h3>Сдача</h3>", "<h3>Handover</h3>"),
 (
  "<p>Передаю репозиторий с доступом и показываю, как развернуть у себя.</p>",
  "<p>I hand over the repository with access and show you how to deploy it yourself.</p>",
 ),
 (
  '<p class="step__out">На выходе: код, README, схема, месяц поддержки</p>',
  '<p class="step__out">You get: code, README, schema, one month of support</p>',
 ),
 ("<h2>Сколько стоит</h2>", "<h2>What it costs</h2>"),
 (
  '<p class="sec__lead">Нижние границы. Точная цена после разбора задачи.</p>',
  '<p class="sec__lead">Lower bounds. The exact price comes after the task review.</p>',
 ),
 ("<h3>Сценарий или агент</h3>", "<h3>One pipeline or agent</h3>"),
 ('<p class="plan__price">от 70 000 ₽</p>', '<p class="plan__price">from €700</p>'),
 (
  '<p class="plan__what">Один агент, бот или конвейер, интеграция LLM в текущий процесс.</p>',
  '<p class="plan__what">A single agent, bot or pipeline, or an LLM integration into an existing process.</p>',
 ),
 ("<li>Роли, оркестрация, промпты</li>", "<li>Roles, orchestration, prompts</li>"),
 ("<li>Интеграция с вашими данными</li>", "<li>Integration with your data</li>"),
 ("<li>Тесты на краевых случаях</li>", "<li>Tests on edge cases</li>"),
 (
  "<li>Деплой на поддомене с сертификатом</li>",
  "<li>Deploy to a subdomain with a certificate</li>",
 ),
 ('<p class="plan__time">5–10 дней</p>', '<p class="plan__time">5 to 10 days</p>'),
 ("<h3>Продукт целиком</h3>", "<h3>Full product</h3>"),
 ('<p class="plan__price">от 150 000 ₽</p>', '<p class="plan__price">from €1 500</p>'),
 (
  '<p class="plan__what">Кроме агента нужен интерфейс, база, админ-панель и доступы для команды.</p>',
  '<p class="plan__what">Beyond the agent you also need an interface, a database, an admin panel and team access.</p>',
 ),
 (
  "<li>Архитектура, API, интерфейс, база</li>",
  "<li>Architecture, API, interface, database</li>",
 ),
 (
  "<li>Админ-панель, роли, права, отчётность</li>",
  "<li>Admin panel, roles, permissions, reporting</li>",
 ),
 (
  "<li>Агентный слой внутри продукта</li>",
  "<li>The agent layer inside the product</li>",
 ),
 ("<li>Инфраструктура, домен, бэкапы</li>", "<li>Infrastructure, domain, backups</li>"),
 ('<p class="plan__time">2–4 недели</p>', '<p class="plan__time">2 to 4 weeks</p>'),
 (
  """        В цену всегда входит: разбор задачи, критерии приёмки, тесты, деплой, инструкция запуска
        и правки в рамках согласованных критериев. Домен, сервер и платные API оплачиваются отдельно,
        реальные суммы показываю до старта.""",
  """        Always included: the task review, acceptance criteria, tests, deployment, run instructions
        and revisions within the agreed criteria. Domain, server and paid APIs are billed separately,
        and I show the real amounts before we start.""",
 ),
 ("<h2>Вопросы</h2>", "<h2>FAQ</h2>"),
 ("<summary>Кому принадлежит код?</summary>", "<summary>Who owns the code?</summary>"),
 (
  "<p>Вам. Передаю репозиторий с доступом и правами на ваш аккаунт или организацию. Лицензий, которые мешают распоряжаться кодом, не использую.</p>",
  "<p>You do. I hand over the repository with access and rights on your account or organisation. I do not use licences that stop you from doing what you want with it.</p>",
 ),
 (
  "<summary>Почему не сделать это нейросетью за вечер?</summary>",
  "<summary>Why not just do this with an AI in one evening?</summary>",
 ),
 (
  "<p>Можно, я так и работаю. Разница в проверке: нейросеть выдаёт первое похожее решение, а работа состоит в том, чтобы найти краевые случаи, закрыть их тестами и сделать поведение воспроизводимым.</p>",
  "<p>You can, and that is how I work. The difference is verification: a model produces the first plausible answer, while the actual work is finding edge cases, covering them with tests and making the behaviour reproducible.</p>",
 ),
 (
  "<summary>Что если результат не понравится?</summary>",
  "<summary>What if I do not like the result?</summary>",
 ),
 (
  "<p>Правки в рамках согласованных критериев входят в цену. Если на прототипе видно, что задумка не работает, мы это признаём и меняем подход, а не доводим до сдачи.</p>",
  "<p>Revisions within the agreed criteria are included. If the prototype shows the idea does not work, we admit it and change the approach instead of pushing it to handover.</p>",
 ),
 (
  "<summary>Как вы считаете стоимость?</summary>",
  "<summary>How do you price the work?</summary>",
 ),
 (
  "<p>По объёму работ, а не по часам и не «на глаз». После разбора задачи вы видите состав: что входит, что нет, сколько это занимает. Если объём меняется в процессе, вы узнаёте об этом до того, как я приступлю.</p>",
  "<p>By scope, not by hours and not by guesswork. After the review you see the breakdown: what is included, what is not, and how long it takes. If the scope changes mid-project, you hear about it before I start on it.</p>",
 ),
 (
  "<summary>Что с поддержкой после сдачи?</summary>",
  "<summary>What about support after handover?</summary>",
 ),
 (
  "<p>Месяц входит: правлю то, что сломалось по моей вине, и отвечаю по запуску. Дальше по часам или подписке, считаем отдельно и заранее.</p>",
  "<p>One month is included: I fix anything that broke because of me and answer questions about running it. After that, hourly or by subscription, agreed in advance.</p>",
 ),
 ("<summary>Работаете по NDA?</summary>", "<summary>Do you work under NDA?</summary>"),
 (
  "<p>Да. NDA подписываю до начала разбора, если это нужно. Коммерческие проекты и работы под NDA покажу по запросу, публично не выкладываю.</p>",
  "<p>Yes. I sign an NDA before the review if you need one. Commercial and NDA work I show on request and never publish.</p>",
 ),
 (
  "<summary>Что будет с моими данными?</summary>",
  "<summary>What happens to my data?</summary>",
 ),
 (
  "<p>Данные для прототипа беру только те, что вы передали, и не использую их в других проектах. После сдачи доступы отзываются, копии у меня не остаются.</p>",
  "<p>I only use the data you hand over for the prototype and never reuse it in other projects. After handover the access is revoked and no copies stay with me.</p>",
 ),
 (
  "<summary>Можно начать с маленькой задачи?</summary>",
  "<summary>Can we start with something small?</summary>",
 ),
 (
  "<p>Да, и это разумно. Первым шагом часто идёт один сценарий или один экран: проверяем подход на живом прототипе, потом расширяем. Так риск меньше у обеих сторон.</p>",
  "<p>Yes, and it is sensible. The first step is often a single pipeline or a single screen: we test the approach on a live prototype and expand from there. Less risk on both sides.</p>",
 ),
 (
  "<summary>Как быстро начнёте?</summary>",
  "<summary>How soon can you start?</summary>",
 ),
 (
  "<p>Готов начать на этой неделе. Дату сдачи называю после разбора задачи и не двигаю молча: если срок поедет, вы узнаете об этом сразу.</p>",
  "<p>I can start this week. I give the delivery date after the review and never move it quietly: if the date slips, you hear about it immediately.</p>",
 ),
 ("<h2>Заявка на бесплатный разбор</h2>", "<h2>Request a free review</h2>"),
 (
  """          Опишите задачу своими словами, без технических терминов. Получите критерии приёмки,
          состав работ, оценку и дату. Материалы остаются у вас, даже если работать не будем.""",
  """          Describe the task in your own words, no technical terms needed. You get acceptance criteria,
          scope, an estimate and a date. The material stays with you even if we never work together.""",
 ),
 ('<label for="b-name">Ваше имя</label>', '<label for="b-name">Your name</label>'),
 (
  '<input id="b-name" name="name" type="text" autocomplete="name" placeholder="Как к вам обращаться" required>',
  '<input id="b-name" name="name" type="text" autocomplete="name" placeholder="What should I call you" required>',
 ),
 (
  '<label for="b-contact">Как с вами связаться</label>',
  '<label for="b-contact">How to reach you</label>',
 ),
 (
  'placeholder="Telegram, почта или телефон"',
  'placeholder="Telegram, email or phone"',
 ),
 (
  '<label for="b-task">Что нужно сделать</label>',
  '<label for="b-task">What needs to be done</label>',
 ),
 (
  'placeholder="Например: разобрать входящие заявки и расставить приоритеты"',
  'placeholder="For example: process incoming requests and set priorities"',
 ),
 (
  '<label for="b-pain">Что сейчас не работает</label>',
  '<label for="b-pain">What is not working now</label>',
 ),
 (
  'placeholder="Например: менеджер разбирает почту вручную, часть заявок теряется"',
  'placeholder="For example: a manager sorts email by hand and some requests get lost"',
 ),
 (
  '<label for="b-limits">Сроки и бюджет, если уже понятны</label>',
  '<label for="b-limits">Timeline and budget, if already known</label>',
 ),
 (
  'placeholder="Например: до конца месяца, до 100 000 ₽"',
  'placeholder="For example: by the end of the month, up to €1 000"',
 ),
 (
  '<p class="brief__next-title">Заявка готова</p>',
  '<p class="brief__next-title">Request is ready</p>',
 ),
 (
  '<p class="brief__next-text">Текст скопирован. Откройте Telegram, вставьте его в чат и отправьте.</p>',
  '<p class="brief__next-text">The text is copied. Open Telegram, paste it into the chat and send.</p>',
 ),
 (
  '<p><a class="btn btn--primary" href="https://t.me/bordon_ai">Открыть Telegram</a></p>',
  '<p><a class="btn btn--primary" href="https://t.me/bordon_ai">Open Telegram</a></p>',
 ),
 (
  '<label class="brief__next-label" for="b-text">Текст заявки, если понадобится скопировать вручную</label>',
  '<label class="brief__next-label" for="b-text">The request text, in case you need to copy it by hand</label>',
 ),
 ("<h3>Что вы получите</h3>", "<h3>What you get</h3>"),
 (
  "<li>Критерии приёмки: что именно должно работать</li>",
  "<li>Acceptance criteria: what exactly has to work</li>",
 ),
 (
  "<li>Состав работ и границы того, что не входит</li>",
  "<li>Scope of work and the boundaries of what is excluded</li>",
 ),
 (
  "<li>Оценку по объёму и дату сдачи</li>",
  "<li>An estimate by scope and a delivery date</li>",
 ),
 (
  "<li>Подсказку по стеку, если решение неочевидно</li>",
  "<li>A stack recommendation if the solution is not obvious</li>",
 ),
 (
  "            Если задача не моя, скажу сразу и подскажу, к кому идти. NDA подписываю до начала разбора.",
  "            If the task is not mine, I say so right away and point you to someone who fits. I sign an NDA before the review.",
 ),
 (
  "            Отвечаю в тот же день. Начать можно с маленькой задачи: один сценарий или один экран.",
  "            I reply the same day. We can start small: one pipeline or one screen.",
 ),
 (
  "<span>Удалённо, часовой пояс GMT+12</span>",
  "<span>Remote, GMT+12 time zone</span>",
 ),
 (
  '<a href="en.html" hreflang="en" lang="en">English version</a>',
  '<a href="index.html" hreflang="ru" lang="ru">Русская версия</a>',
 ),
 ('<a href="#top">Наверх</a>', '<a href="#top">Back to top</a>'),
 ('aria-label="Наверх"', 'aria-label="Back to top"'),
 ('aria-label="Открыть меню"', 'aria-label="Open menu"'),
]

PAIRS += [
 ('aria-label="Стек"', 'aria-label="Stack"'),
 (
  '<span class="case__label">Зачем заказчику</span>',
  '<span class="case__label">Why it matters</span>',
 ),
 (
  '<span class="case__title">Лендинги</span>',
  '<span class="case__title">Landing pages</span>',
 ),
 (
  '<span class="case__title">ТендерПульс</span>',
  '<span class="case__title">TenderPulse</span>',
 ),
 (
  'name="description" content="Проектирую мультиагентные сценарии и LLM-интеграции. Собираю веб-приложения, админ-панели, трекеры, Telegram-боты и мини-аппы, лендинги. Бесплатный разбор задачи."',
  'name="description" content="I design multi-agent pipelines and LLM integrations, and build the product around them: web apps, admin panels, trackers, Telegram bots and mini apps, landing pages. Free task review."',
 ),
]

PAIRS += [
 (
  '<p class="cta-row"><a class="btn btn--primary" href="#brief">Заявка на бесплатный разбор</a></p>',
  '<p class="cta-row"><a class="btn btn--primary" href="#brief">Request a free review</a></p>',
 ),
]

ALL = PAIRS + CASE_PAIRS

src = SRC.read_text(encoding="utf-8")
missing = []
for ru, en in ALL:
 if src.count(ru) < 1:
  missing.append(ru[:70])
  continue
 src = src.replace(ru, en)

if missing:
 print("НЕ НАЙДЕНО (проверь якоря):")
 for text in missing:
  print(f"  {text!r}")
 raise SystemExit(1)

OUT.write_text(src, encoding="utf-8")
print(f"записано: {OUT}")

# --- финальный проход: подписи схемы и заголовок блока
FINAL = {
 # подписи схемы в карточке
 ">Источник</text>": ">Source</text>",
 ">форма, почта, API</text>": ">form, email, API</text>",
 ">Координатор</text>": ">Coordinator</text>",
 ">распределяет задачи</text>": ">splits the work</text>",
 ">Агент: разбор</text>": ">Agent: parse</text>",
 ">Агент: скоринг</text>": ">Agent: scoring</text>",
 ">Агент: поиск</text>": ">Agent: search</text>",
 ">агент</text>": ">agent</text>",
 ">Свод</text>": ">Merge</text>",
 ">приоритет и причина</text>": ">priority and reason</text>",
 ">Очередь</text>": ">Queue</text>",
 ">порядок работы</text>": ">order of work</text>",
 ">Оператор</text>": ">Operator</text>",
 ">решает по карточке</text>": ">decides from the card</text>",
 '<p class="flow__title">Пример мультиагентного конвейера</p>': '<p class="flow__title">Example of a multi-agent pipeline</p>',
 'aria-label="Схема конвейера: источник, координатор, три агента, свод, очередь и оператор"': 'aria-label="Pipeline diagram: source, coordinator, three agents, merge, queue and operator"',
 '<p class="cta-row"><a class="btn btn--primary" href="#brief">Заявка на бесплатный разбор</a></p>': '<p class="cta-row"><a class="btn btn--primary" href="#brief">Request a free review</a></p>',
 ">Отправить заявку</button>": ">Send the request</button>",
 '<p class="brief__hint">Уходит мне в Telegram.</p>': '<p class="brief__hint">Goes straight to my Telegram.</p>',
 '<p class="brief__next-title">Заявка отправлена</p>': '<p class="brief__next-title">Request sent</p>',
 '<p class="brief__next-text">Разберу её и отвечу в тот же день. Если удобнее в Telegram, напишите туда же.</p>': '<p class="brief__next-text">I will review it and reply the same day. If Telegram is easier, message me there.</p>',
}
for ru, en in FINAL.items():
 src = src.replace(ru, en)

left2 = re.findall(r"[А-Яа-яЁё]+", src)
if left2:
 print("осталось после финального прохода:", sorted(set(left2))[:20])
else:
 print("после финального прохода кириллицы нет")

OUT.write_text(src, encoding="utf-8")
print("перезаписано:", OUT)

left = re.findall(r"[А-Яа-яЁё]+", src)
if left:
 print(f"\nосталась кириллица: {len(left)} фрагментов")
 for word in sorted(set(left))[:60]:
  print("  ", word)
else:
 print("кириллицы не осталось")
