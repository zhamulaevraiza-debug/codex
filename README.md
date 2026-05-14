# Carpet Cleaning CRM — MVP backend

Узкая CRM для цеха мойки ковров. Цель MVP — провести заявку по цепочке:

> Оператор → Водитель → Цех → Касса → Отчёт руководителя

Реализовано на NestJS + Prisma 7 (SQLite через driver adapter). REST API,
JWT-аутентификация, ролевая модель.

## Роли

| Роль       | Что видит / делает                                                       |
| ---------- | ------------------------------------------------------------------------ |
| `ADMIN`    | Всё: сотрудники, заявки, касса, отчёты                                   |
| `OPERATOR` | Создаёт заявки и видит весь их жизненный цикл, может отменять            |
| `DRIVER`   | Видит заявки `NEW_PICKUP`/`PICKED_UP`, заполняет данные, передаёт в цех  |
| `WORKSHOP` | Видит заявки `IN_WORKSHOP`/`MEASURED`, добавляет ковры, передаёт в кассу |

## Жизненный цикл заявки

```
NEW_PICKUP → PICKED_UP → IN_WORKSHOP → MEASURED → AWAITING_PAYMENT → PAID
                                              ↘ (любой шаг) → CANCELLED
```

| Статус             | Триггер                                                  |
| ------------------ | -------------------------------------------------------- |
| `NEW_PICKUP`       | Оператор создал заявку на забор                          |
| `PICKED_UP`        | Водитель забрал ковры (`PATCH /orders/:id/driver-pickup`) |
| `IN_WORKSHOP`      | Водитель привёз в цех (`PATCH /orders/:id/transfer-to-workshop`) |
| `MEASURED`         | Цех добавил хотя бы одно изделие                         |
| `AWAITING_PAYMENT` | Цех передал в кассу (`PATCH /orders/:id/transfer-to-cash`) |
| `PAID`             | Касса зафиксировала оплату (`PATCH /orders/:id/pay`)     |
| `CANCELLED`        | Заявка отменена (`PATCH /orders/:id/cancel`)             |

## Расчёт стоимости

Для каждого ковра в цехе:

```
area    = length × width
amount  = area × pricePerSqm
```

Итог заявки — сумма `amount` по всем изделиям.

## API

Swagger UI: `GET /docs`.

### Аутентификация (`/auth`)

- `POST /auth/login` — `{ email, password }` → `{ userId, tokens }`
- `POST /auth/refresh`, `POST /auth/logout`

### Сотрудники (`/staff`, ADMIN)

- `GET /staff?role=DRIVER` — список
- `POST /staff` — создать (`{ email, password, role, name? }`)
- `PATCH /staff/:id` — сменить роль/имя/пароль

### Заявки (`/orders`)

- `GET /orders` — список (фильтруется по роли + `?status=`/`?search=`)
- `GET /orders/:id`
- `POST /orders` — OPERATOR/ADMIN
- `PATCH /orders/:id/driver-pickup` — DRIVER/ADMIN
- `PATCH /orders/:id/transfer-to-workshop` — DRIVER/ADMIN
- `PATCH /orders/:id/workshop` — WORKSHOP/ADMIN (цена, заметка)
- `POST /orders/:id/items` — WORKSHOP/ADMIN (ковёр или текстиль)
- `PATCH /orders/:id/items/:itemId`, `DELETE /orders/:id/items/:itemId`
- `PATCH /orders/:id/transfer-to-cash` — WORKSHOP/ADMIN
- `PATCH /orders/:id/pay` — ADMIN (касса)
- `PATCH /orders/:id/cancel` — OPERATOR/ADMIN

### Касса (`/cash`, ADMIN)

- `GET /cash/transactions` — фильтры по типу/категории/дате
- `POST /cash/income` — приход (можно `orderId`)
- `POST /cash/expense` — расход (`{ amount, category, note? }`),
  категории: `CHEMISTRY`, `PERFUME`, `FUEL`, `SALARY`, `RENT`, `OTHER`
- `GET /cash/balance?from=&to=` — приход/расход/остаток/расход по категориям

### Отчёты руководителю (`/reports`, ADMIN)

- `GET /reports/overview?from=&to=` — заявки по статусам + кассовая сводка
- `GET /reports/daily?from=&to=` — разбивка по дням

## Запуск

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npx ts-node prisma/seed.ts   # создаёт демо-пользователей
npm run start:dev
```

После сидинга доступны логины:

| Роль       | Логин                   | Пароль          |
| ---------- | ----------------------- | --------------- |
| ADMIN      | `admin@example.com`     | `change-me-strong` |
| OPERATOR   | `operator@example.com`  | `operator123`   |
| DRIVER     | `driver@example.com`    | `driver123`     |
| WORKSHOP   | `workshop@example.com`  | `workshop123`   |

Пароли — для локальной разработки. В продакшене перезапишите переменные
`*_EMAIL/*_PASSWORD` или сразу заведите сотрудников через `POST /staff`.

## Сценарий цепочки (smoke)

```bash
# логин оператора
OP=$(curl -s -X POST localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"operator@example.com","password":"operator123"}' \
  | jq -r .tokens.accessToken)

# 1. оператор создаёт заявку
curl -s -X POST localhost:3000/orders -H "Authorization: Bearer $OP" \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"Иван","customerPhone":"+7 700 0",
       "address":"ул. Абая 1","entrance":"2","floor":"5"}'

# 2. водитель → /orders/:id/driver-pickup + /transfer-to-workshop
# 3. цех → /orders/:id/items (несколько раз) + /transfer-to-cash
# 4. касса → /orders/:id/pay
# 5. руководитель → /reports/overview
```

## Что НЕ в MVP

WhatsApp, push/SMS, печать квитанций, маршруты, склад, зарплаты,
мобильное приложение, продвинутая аналитика. См. ТЗ — пункт 6.

## Структура

```
src/
  auth/        JWT + ролевой guard
  staff/       управление сотрудниками (ADMIN)
  orders/      заявки и переходы по цепочке
  cash/        приход / расход / баланс
  reports/     сводки для руководителя
  common/      Prisma (через better-sqlite3 adapter), throttler
```
