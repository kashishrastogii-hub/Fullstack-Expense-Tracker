<h1 align="center">🌟 PocketWise - Expense tracking app 🌟</h1>

<p align="center">
  <img alt="Static Badge" src="https://img.shields.io/badge/Spring%20Boot-darkgreen?style=for-the-badge">
  <img alt="Static Badge" src="https://img.shields.io/badge/React.js-blue?style=for-the-badge">
  <img alt="Static Badge" src="https://img.shields.io/badge/mysql-red?style=for-the-badge">
  <img alt="Static Badge" src="https://img.shields.io/badge/css-purple?style=for-the-badge">
  <img alt="Static Badge" src="https://img.shields.io/badge/jwt-orange?style=for-the-badge">
</p>

## Table of contents

1. [Description](#description)
2. [Tech stack](#tech-stack)
3. [Quick start (local development)](#quick-start-local-development)
4. [Email and verification codes](#email-and-verification-codes)
5. [Docker (single container)](#docker-single-container)
6. [Deploy to Render (Aiven MySQL + Brevo)](#deploy-to-render-aiven-mysql--brevo)
7. [Configuration reference](#configuration-reference)
8. [Project structure](#project-structure)
9. [Security notes](#security-notes)
10. [Screenshots](#screenshots)
11. [Credits](#credits)

## Description

- Full-stack expense tracking application built with Spring Boot, React.js and MySQL.
- Users can record income and expenses, plan upcoming transactions, set monthly budgets and view reports.
- Multi-role access: users manage their own data, administrators manage users, categories and transaction types.
- Sign-up requires email verification; sign-in is JWT based; password reset is verified with a one-time code sent by email.
- Production-ready packaging: one Docker image serves both the React SPA and the `/api` endpoints, so it can be deployed as a single web service.

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot 3.2, Spring Security (JWT), Spring Data JPA, Flyway, Bucket4j (rate limiting) |
| Frontend | React 18 (Create React App), React Router, react-hook-form, axios |
| Database | MySQL 8 (works with Aiven MySQL, PlanetScale, etc.) |
| Mail | SMTP (any provider: Brevo, Resend, Gmail, Mailpit, ...) with a console fallback for development |
| Deploy | Multi-stage Dockerfile (Node build + Maven build + JRE runtime) |

## Quick start (local development)

### Prerequisites

- Java 21+
- Node.js 18+ and npm
- MySQL 8+ (or Docker)

### Step 1: Clone the repository

```sh
git clone https://github.com/kashishrastogii-hub/Fullstack-Expense-Tracker
cd Fullstack-Expense-Tracker
```

### Step 2: Start MySQL

Either use your local MySQL server, or start just the database container:

```sh
docker compose up -d db
```

The container uses database `expense_tracker` and root password `root` (override with `DB_PASSWORD` and `DB_NAME`). If you use your own MySQL, create an empty database:

```sql
CREATE DATABASE expense_tracker;
```

### Step 3: Run the backend

```sh
cd backend
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `backend/.env` (database password, mail settings). The file is optional: every value can also be supplied as an environment variable, which takes precedence. Then:

```sh
./mvnw spring-boot:run            # Windows: mvnw.cmd spring-boot:run
```

The API runs on <http://localhost:8080> with base path `/api`. The default profile is `dev`:

- Flyway creates the schema on an empty database (`V1` placeholder + `V2` baseline).
- Hibernate runs with `ddl-auto=update` to keep local schemas flexible.
- Verification emails are **written to the log** when no SMTP credentials are configured (see below).

### Step 4: Run the frontend

```sh
cd frontend
cp .env.example .env      # optional; defaults to http://localhost:8080/api
npm install
npm start
```

Open <http://localhost:3000>. The dev server calls the API on port 8080; CORS for `http://localhost:3000` is enabled by default.

### Step 5: Create an admin and categories

Roles and transaction types are seeded automatically, categories are not.

1. Sign up and verify your account.
2. Promote the account to admin:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_ADMIN'
WHERE u.email = 'you@example.com';
```

3. Sign in again and create categories in the admin UI (or `POST /api/category/new`). Each category needs a transaction type (`TYPE_EXPENSE` or `TYPE_INCOME`).

## Email and verification codes

Mail behaviour is controlled by `MAIL_MODE`:

| Mode | Behaviour | Use |
| --- | --- | --- |
| `auto` (default) | Sends over SMTP when `MAIL_USERNAME` and `MAIL_PASSWORD` are set, otherwise logs the email | Local development |
| `console` | Never sends; prints the email and the verification code in the log | Local development / automated tests |
| `smtp` | Always sends; delivery failures make the request fail | Production |

With the default `auto` mode and no credentials, registering prints a banner like this in the backend log:

```
============================================================
 DEV MAIL (not sent - SMTP is not configured)
 To:      you@example.com
 Subject: Verify your PocketWise account
 Code:    123456  (valid for 15 minutes)
============================================================
```

To send real mail locally, set `MAIL_MODE=smtp` and the `MAIL_*` variables, for example with a
[Mailpit](https://mailpit.axllent.org/) container:

```sh
docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit
```

```
MAIL_MODE=smtp
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SMTP_AUTH=false
MAIL_SMTP_STARTTLS=false
MAIL_FROM=no-reply@pocketwise.local
```

Read the messages at <http://localhost:8025>.

Codes are generated with `SecureRandom` and expire after 15 minutes (`VERIFICATION_CODE_EXPIRATION_MS`).
Registration is transactional: if the verification email cannot be delivered, the account is not created
and the API returns `502 Bad Gateway` instead of silently leaving a broken account behind.

## Docker (single container)

The `Dockerfile` builds the React app, embeds it into the Spring Boot jar under `classpath:/static`,
and runs a single JRE container that serves both the SPA and `/api` on port 8080.

Build and run the whole stack (MySQL + app, console mail for the demo):

```sh
docker compose up --build
```

Open <http://localhost:8080>. Verification codes are printed by `docker compose logs -f app`.

MySQL is published on host port **3307** (not 3306) so an already-running local MySQL keeps working.
The app always reaches the database over the compose network at `db:3306`.

To test the exact image production uses (prod profile, Flyway-managed schema, real SMTP), run the
same stack against [Mailpit](https://mailpit.axllent.org/):

```sh
export JWT_SECRET="$(openssl rand -base64 48)"
docker compose exec db mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS pocketwise_prod;"
docker compose -f docker-compose.yml -f docker-compose.prod-test.yml up -d --build
```

On PowerShell, set the secret first:

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$env:JWT_SECRET = [Convert]::ToBase64String($b)
```

Then sign up at <http://localhost:8080> and read the email at <http://localhost:8025>. The override
file is test-only: it delivers mail to a local Mailpit container and disables SMTP auth/TLS.

To run only the image against your own database:

```sh
docker build -t pocketwise .
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL="jdbc:mysql://host:3306/expense_tracker?sslMode=REQUIRED" \
  -e DB_USERNAME=user -e DB_PASSWORD=secret \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  -e MAIL_MODE=smtp -e MAIL_HOST=smtp-relay.brevo.com -e MAIL_PORT=587 \
  -e MAIL_USERNAME=you@example.com -e MAIL_PASSWORD=smtp-key \
  -e MAIL_FROM=no-reply@yourdomain.com \
  -v pocketwise-uploads:/app/uploads \
  pocketwise
```

Notes:

- The runtime is unprivileged (`pocketwise`); the entrypoint fixes ownership of the upload volume, then drops privileges.
- `JAVA_OPTS` and `MAX_RAM_PERCENTAGE` can be used to tune the JVM inside small instances.
- The container health check calls `/actuator/health`.

## Deploy to Render (Aiven MySQL + Brevo)

This is the intended free/cheap production setup: Render runs the Docker image, Aiven provides managed
MySQL and Brevo delivers the verification emails.

### 1. Create the database (Aiven)

1. Create a free MySQL service in [Aiven](https://aiven.io/) and create a database (for example `pocketwise`).
2. Copy the connection details. Aiven shows a URI like
   `mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED`.
3. Convert it to a JDBC URL for `DB_URL`:

```
jdbc:mysql://HOST:PORT/defaultdb?sslMode=REQUIRED
```

Use the Aiven user/password as `DB_USERNAME` / `DB_PASSWORD`. TLS is mandatory; keep `sslMode=REQUIRED`.

### 2. Create the mail sender (Brevo)

1. Create a [Brevo](https://www.brevo.com/) account.
2. Verify a sender address or domain under *Senders & IPs*. `MAIL_FROM` must be this verified address.
3. Create an SMTP key under *SMTP & API*.
4. Use: `MAIL_HOST=smtp-relay.brevo.com`, `MAIL_PORT=587`, `MAIL_USERNAME=<your Brevo login>`,
   `MAIL_PASSWORD=<SMTP key>`, `MAIL_SMTP_AUTH=true`, `MAIL_SMTP_STARTTLS=true`.

Resend works too (`smtp.resend.com`, port 587, user `resend`, password = API key) as does any other SMTP
provider. Gmail requires an app password.

### 3. Create the Render web service

Fast path: this repository contains a [`render.yaml`](render.yaml) Blueprint. In Render choose
*New +* -> *Blueprint*, connect the repository and fill in the values marked `sync: false`
(database and SMTP credentials). Render generates the JWT secret for you.

Manual path:

1. Push this repository to GitHub.
2. In Render: *New +* -> *Web Service* -> connect the repository.
3. Runtime: **Docker**. Render detects the `Dockerfile` at the repository root.
4. Health check path: `/actuator/health`.
5. Add the environment variables:

| Variable | Example | Required |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://HOST:PORT/defaultdb?sslMode=REQUIRED` | yes |
| `DB_USERNAME` | `avnadmin` | yes |
| `DB_PASSWORD` | `...` | yes |
| `JWT_SECRET` | output of `openssl rand -base64 48`, or a passphrase of 32+ characters | yes |
| `MAIL_MODE` | `smtp` | yes |
| `MAIL_HOST` | `smtp-relay.brevo.com` | yes |
| `MAIL_PORT` | `587` | yes |
| `MAIL_USERNAME` | `you@example.com` | yes |
| `MAIL_PASSWORD` | Brevo SMTP key | yes |
| `MAIL_FROM` | `no-reply@yourdomain.com` (verified sender) | recommended |
| `MAIL_SENDER_NAME` | `PocketWise` | optional |
| `CORS_ALLOWED_ORIGINS` | leave empty (same origin) | optional |
| `USER_PROFILE_UPLOAD_DIR` | `/app/uploads/user/profile` | optional (default) |

`PORT` is provided by Render. Also set `SPRING_PROFILES_ACTIVE=prod` (the blueprint does this, and the image does not set it).

6. Deploy. On the first boot Flyway creates the schema and the seeder inserts the roles and
   transaction types.

### 4. After the first deploy

- Sign up (the verification email is sent through Brevo), verify, then promote your account to admin
  with the SQL from [Step 5](#step-5-create-an-admin-and-categories) using any MySQL client.
- Create your categories in the admin UI.

### Free-tier notes

- **Cold starts:** Render free web services sleep after 15 minutes of inactivity. The first request
  afterwards can take about a minute while the JVM starts.
- **Memory:** 512 MB is enough for this app with the default `MAX_RAM_PERCENTAGE=70`; lower it or set
  `JAVA_OPTS=-Xmx300m` if the instance is tight.
- **Uploads:** the container filesystem is ephemeral, so profile images disappear on redeploy/restart.
  Attach a Render disk mounted at `/app/uploads` if you need them to persist (the entrypoint makes the
  mount writable for the unprivileged user).
- **Database:** Aiven free plans cap connections; the app uses a small pool (`DB_POOL_SIZE`, default 5).

## Configuration reference

All values can be set in `backend/.env` or as environment variables.

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port (Render sets this automatically) |
| `DB_URL` | `jdbc:mysql://localhost:3306/expense_tracker` | JDBC URL |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | empty | Database password |
| `DB_POOL_SIZE` | `5` | Hikari maximum pool size (prod) |
| `JWT_SECRET` | insecure default | At least 32 characters; Base64 or a plain passphrase (prod rejects the demo defaults) |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24 h) |
| `MAIL_MODE` | `auto` | `auto`, `console` or `smtp` |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP host |
| `MAIL_PORT` | `587` | SMTP port |
| `MAIL_USERNAME` | empty | SMTP user |
| `MAIL_PASSWORD` | empty | SMTP password / API key |
| `MAIL_SMTP_AUTH` | `true` | SMTP authentication |
| `MAIL_SMTP_STARTTLS` | `true` | STARTTLS |
| `MAIL_FROM` | `MAIL_USERNAME` | From address |
| `MAIL_SENDER_NAME` | `PocketWise` | From display name |
| `VERIFICATION_CODE_EXPIRATION_MS` | `900000` | Code lifetime (15 min) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` (dev), empty (prod) | Comma-separated origins |
| `USER_PROFILE_UPLOAD_DIR` | `./uploads/user/profile` (`/app/uploads/user/profile` in Docker) | Avatar storage |
| `SPRING_PROFILES_ACTIVE` | `dev` | Use `prod` in production |

Frontend build-time variable: `REACT_APP_API_BASE_URL` (`http://localhost:8080/api` for `npm start`,
`/api` for the Docker build).

## Project structure

```
.
├── Dockerfile                     # single-container build (SPA + API)
├── docker-compose.yml             # local demo: MySQL + app (console mail)
├── docker/entrypoint.sh           # fixes upload-dir ownership, drops to non-root, starts the JVM
├── backend/
│   ├── src/main/java/...          # controllers, services, security, config
│   └── src/main/resources/
│       ├── application.properties # shared config
│       ├── application-dev.properties
│       ├── application-prod.properties
│       └── db/migration/          # Flyway: V1 placeholder, V2 baseline schema
└── frontend/
    └── src/                       # React SPA (pages, components, services)
```

The baseline DDL in `V2__init_schema.sql` follows Hibernate's naming and types for the current entities;
`SchemaDumpTest` regenerates a snapshot (`backend/target/schema-mysql.sql`) to compare when entities change.
Column lengths for validated fields (for example `users.username`) come from Bean Validation.

## Security notes

- The `prod` profile refuses to start when mail would fall back to console logging, when SMTP credentials
  are missing, when `MAIL_MODE` is unknown, or when `JWT_SECRET` is missing/default/too short. A
  misconfigured deployment fails loudly instead of silently losing verification emails.
- Production uses `ddl-auto=validate`: Flyway owns the schema, Hibernate only verifies it.
- Verification codes are 6 digits from `SecureRandom`, expire after 15 minutes and are single-use.
- The forgot-password flow requires the emailed code at reset time. Knowing an email address alone is not
  enough to reset a password.
- Login, sign-up and password reset are rate limited per IP (10 requests/minute).
- `MAIL_MODE=console` must never be used in production: codes would only exist in the server log.

## Screenshots

![Screenshot 2024-04-18 091658](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/7637b70d-8b9f-485e-84f6-bce3c940f3f2)
![Screenshot 2024-04-18 091720](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/f58e2e13-7db4-439a-b371-ce9b6e5838c7)
![Screenshot 2024-04-18 091743](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/dbcfdbd2-d515-4197-b5ff-11ba0aed2dcf)
![Screenshot 2024-04-18 091803](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/9d271a52-1444-4739-afe4-f51aa616d55e)

Users's stuff

![Screenshot 2024-04-22 153501](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/a8e6d65b-626f-493e-922d-dd7c26d8294c)
![Screenshot 2024-04-22 153536](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/ed01d05e-cead-43c5-8959-6b64615fee43)
![Screenshot 2024-04-22 153556](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/40ab0b82-b38d-4a19-9044-d226e3f345ed)
![Screenshot 2024-04-22 153622](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/8f8bef4e-6735-464f-a180-f2bc17633b1b)
![Screenshot 2024-04-22 154204](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/994d23f0-e7c1-42a6-9571-44fd4353396e)
![Screenshot 2024-04-22 154244](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/7e43cb13-6187-4af0-8900-66afef908f66)
![Screenshot 2024-04-22 154301](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/1b308447-f5ef-4f26-826b-0e9f42e5914f)

Admin's stuff

![Screenshot 2024-04-18 092245](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/06454812-f542-4404-b9bf-e7d9b96b043d)
![Screenshot 2024-04-18 092306](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/a024fadc-5f6a-4e3f-96f6-f38dd1f6b477)
![Screenshot 2024-04-18 092325](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/5e93095e-f4be-4245-b3a4-8653cd9fea27)
![Screenshot 2024-04-18 092342](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/5d40498e-ec3b-4559-ba15-efdf9c248d22)
![Screenshot 2024-04-18 092805](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/aa94d2da-0080-421b-a191-d2ff9fb4472f)
![Screenshot 2024-04-18 092822](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker/assets/139672976/6cb49c2c-8317-4cec-ad16-b9496d97b16f)

## Credits

Originally created by [Dharshi Balasubramaniyam](https://github.com/DharshiBalasubramaniyam/Fullstack-Expense-Tracker).
