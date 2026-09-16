# LifeLine Dispatch Backend

A backend-focused emergency ambulance dispatch REST API built with **Node.js, TypeScript, Express.js, PostgreSQL and Prisma**. The system connects patients with ambulance drivers, supports emergency request management, trip tracking, driver approval, bKash payment processing and administrative audit logging.

## Project Information

| Field | Details |
|---|---|
| Project name | LifeLine Dispatch Backend |
| Project type | Emergency Ambulance Dispatch System |
| Student ID | L2B7-1205 |
| API version | v1 |
| Primary roles | Patient, Driver, Admin |
| Database | PostgreSQL with Prisma ORM |
| Payment gateway | bKash |
| Runtime | Node.js with TypeScript |

## Problem Statement

During a medical emergency, a patient or caller needs a reliable way to request an ambulance, provide pickup and destination information, find an appropriate driver, monitor the trip and complete the payment. LifeLine Dispatch provides the backend services for this workflow while giving administrators control over driver approval, ambulance records, users and audit history.

## Core Features

- Patient registration, email verification and login.
- JWT-based authentication with access and refresh tokens.
- Google authentication using Google OAuth credentials.
- Role-based authorization for `PATIENT`, `DRIVER` and `ADMIN`.
- Patient profile management with optional profile-image upload.
- Driver application and email verification workflow.
- Admin driver approval and rejection workflow.
- Ambulance creation, listing, details and status management.
- Emergency request creation, personal request history, details and cancellation.
- Driver trip start, status update and trip history.
- bKash payment creation, callback execution and payment tracking.
- Audit log creation and filtered or paginated audit-log retrieval.
- Centralized not-found and error handling.
- Zod-based request validation.
- Redis-backed temporary token storage for bKash integration.
- Cloudinary support for profile-image storage.

## User Roles and Permissions

### Patient

A patient can register, verify an account, log in, manage a profile, create emergency requests, view personal requests, cancel eligible requests, create bKash payments and view personal payment records.

### Driver

A driver can apply for an account, verify the driver account, access approved driver routes, start a trip, update trip status, view personal trips and view a specific assigned trip.

### Admin

An admin can manage drivers, approve or reject driver applications, manage ambulances, update ambulance status, inspect emergency requests, view dashboard information and review audit logs.

## Technology Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** JWT and Google OAuth
- **Password hashing:** bcryptjs
- **Payment:** bKash Tokenized Checkout API
- **Caching/token storage:** Redis
- **File upload:** Multer and Cloudinary
- **Email:** Nodemailer
- **Deployment configuration:** Vercel

## Project Structure

```text
src/
├── app.ts                         # Express app and route mounting
├── index.ts                       # Application entry point
├── server.ts                      # Server startup
├── config/                        # Environment configuration and seed logic
├── generated/prisma/              # Generated Prisma client output
├── lib/                           # Prisma, Redis, bKash, Google and Cloudinary clients
├── middleware/                    # Authentication, validation and error middleware
├── modules/
│   ├── admin/                     # Admin operations
│   ├── ambulance/                 # Ambulance management
│   ├── auditLog/                  # Audit-log operations
│   ├── auth/                      # Registration, verification and login
│   ├── driver/                    # Driver application and verification
│   ├── emergencyRequest/          # Emergency request workflow
│   ├── payment/                   # bKash payment workflow
│   ├── trip/                      # Trip management
│   └── user/                      # Patient/user profile management
├── templates/                     # EJS templates for email and Google login
└── utils/                         # Tokens, password helpers and API utilities

prisma/
├── schema/                       # Prisma schema split by domain
└── migrations/                   # Database migrations
```

## API Base URL

For local development:

```text
http://localhost:5000/api/v1
```

For production, replace the base URL with the deployed API URL configured by the project owner.

## API Response Format

Successful responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error responses follow this structure:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

Protected endpoints require a JWT access token. Send it in either of these forms:

```http
Authorization: Bearer <access-token>
```

or, when cookie-based authentication is enabled:

```http
Cookie: accessToken=<access-token>
```

## API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a patient account |
| `POST` | `/auth/verify-email` | Public | Verify a patient email using OTP |
| `POST` | `/auth/login` | Public | Log in with email and password |
| `POST` | `/auth/refresh-token` | Public | Create a new access token |
| `POST` | `/auth/google` | Public | Log in with a Google ID token |
| `POST` | `/auth/logout` | Public/Auth | Log out the current session |

### User Profile

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/user/me` | Authenticated | Get the current user profile |
| `PATCH` | `/user/me` | Authenticated | Update profile data or upload a profile image |

For profile-image upload, use `multipart/form-data` with the field name `profileImage`.

### Driver

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/driver/apply` | Public | Submit a driver application |
| `POST` | `/driver/driver-verify` | Public | Verify a driver account using OTP |

### Emergency Requests

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/emergencyRequest/create` | Patient | Create an emergency ambulance request |
| `GET` | `/emergencyRequest/my` | Patient | Get the current patient's requests |
| `GET` | `/emergencyRequest/:id` | Patient | Get a specific emergency request |
| `PATCH` | `/emergencyRequest/cancel/:id` | Patient | Cancel an eligible request |

Example request body:

```json
{
  "pickupLocation": "Dhanmondi, Dhaka",
  "destination": "Dhaka Medical College Hospital",
  "emergencyType": "Accident",
  "priority": "HIGH"
}
```

Supported priority values are `LOW`, `MEDIUM`, `HIGH` and `CRITICAL`.

### Ambulance and Dispatch Administration

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/ambulance` | Admin | Create an ambulance record |
| `GET` | `/ambulance` | Admin | Get all ambulances |
| `GET` | `/ambulance/:id` | Admin | Get an ambulance by ID |
| `PATCH` | `/ambulance/:id` | Admin | Update ambulance information |
| `PATCH` | `/ambulance/status/:id` | Admin | Update ambulance status |

### Trips

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/trip/start/:requestId` | Driver | Start a trip for an emergency request |
| `PATCH` | `/trip/status/:tripId` | Driver | Update trip status |
| `GET` | `/trip/my` | Driver | Get the current driver's trips |
| `GET` | `/trip/:tripId` | Driver | Get a specific trip |

Supported trip status values are `ONGOING`, `COMPLETED` and `CANCELLED`.

### Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/payment/create` | Patient | Create a bKash payment request |
| `GET` | `/payment/my` | Patient | Get the current patient's payments |
| `GET` | `/payment/:paymentId` | Patient | Get a specific payment |
| `GET` | `/payment/bkash/callback` | bKash callback | Execute and verify the bKash payment |

### Admin and Audit Logs

The admin module provides driver-management, ambulance-management, dashboard and emergency-request administration routes. The audit-log module provides administrative audit history routes with filtering, sorting and pagination support.

| Module | Access | Description |
|---|---|---|
| `/admin/*` | Admin | Manage drivers, ambulances, requests and dashboard information |
| `/audit-log/*` | Admin | Review audit logs and filter activity records |

## Database Models

The Prisma schema contains the following main entities:

- `User`
- `Patient`
- `Driver`
- `Ambulance`
- `EmergencyRequest`
- `Trip`
- `Payment`
- `AuditLog`

Important relationships include:

- A user can have a patient profile or driver profile.
- A patient can create multiple emergency requests.
- An emergency request can be linked to an ambulance, trip and payment.
- A driver can operate an ambulance and complete multiple trips.
- Users generate audit-log records for critical administrative actions.

## Local Setup

### Prerequisites

Install the following before running the project:

- Node.js 18 or later
- PostgreSQL
- Redis, required for the bKash token cache
- A Cloudinary account, if profile-image upload is used
- SMTP credentials, if email verification is enabled
- Google OAuth credentials, if Google login is enabled
- bKash sandbox or production credentials, if payment is enabled

### Installation

```bash
git clone https://github.com/Asadul1120/Lifeline-Dispatch-Backend.git
cd Lifeline-Dispatch-Backend
npm install
```

### Environment configuration

Create a `.env` file from the included template:

```bash
cp .env.example .env
```

Then configure the database, JWT, Redis, email, Google, Cloudinary, tester-admin and bKash values. Never commit `.env` or any secret credential to GitHub.

The local `.env` file should contain the following variables. Replace every placeholder with the value from your local environment:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL="<your-postgresql-connection-string>"

JWT_ACCESS_SECRET=<your-access-token-secret>
JWT_REFRESH_SECRET=<your-refresh-token-secret>
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

REDIS_USER=<your-redis-user>
REDIS_PASSWORD=<your-redis-password>
REDIS_HOST=<your-redis-host>
REDIS_PORT=<your-redis-port>

SMTP_USER=<your-smtp-user>
SMTP_PASSWORD=<your-smtp-password>
EMAIL_SENDER=<your-sender-email>

GOOGLE_CLIENT_ID=<your-google-client-id>

CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>

TESTER_ADMIN_NAME=Admin
TESTER_ADMIN_EMAIL=<your-demo-admin-email>
TESTER_ADMIN_PASSWORD=<your-demo-admin-password>

BKASH_TOKENIZE_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_TOKENIZE_USER_NAME=<your-bkash-sandbox-username>
BKASH_TOKENIZE_PASSWORD=<your-bkash-sandbox-password>
BKASH_TOKENIZE_APP_KEY=<your-bkash-app-key>
BKASH_TOKENIZE_APP_SECRET=<your-bkash-app-secret>
BKASH_CALLBACK_URL=http://localhost:5000
```

**Security warning:** Do not paste real database URLs, JWT secrets, Redis passwords, SMTP passwords, Cloudinary secrets or bKash credentials into this README. Store them only in `.env` or the deployment platform's secret manager. If a credential has already been exposed, revoke it and generate a replacement before deployment.

### Prisma setup

```bash
npx prisma generate
npx prisma migrate deploy
```

For local development, migrations can be created with:

```bash
npx prisma migrate dev --name update
```

### Run the project

Development mode:

```bash
npm run dev
```

Production build and start:

```bash
npm run build
npm start
```

The default local port is `5000` unless another value is supplied through `PORT`.

## Environment Variables

The project reads configuration from `.env`. The main variables are:

| Variable group | Variables |
|---|---|
| Application | `NODE_ENV`, `PORT`, `FRONTEND_URL`, `BACKEND_URL` |
| Database | `DATABASE_URL` |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| Password | `BCRYPT_SALT_ROUNDS` |
| Redis | `REDIS_USER`, `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT` |
| Email | `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_SENDER` |
| Google | `GOOGLE_CLIENT_ID` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| bKash | Configure the bKash values used by `src/config/index.ts` and `src/lib/bkash.ts` |

## Payment Flow

1. The patient sends `POST /api/v1/payment/create` with a valid emergency request ID and amount.
2. The backend requests a bKash checkout session.
3. The patient completes the checkout using the returned payment URL.
4. bKash redirects to `/api/v1/payment/bkash/callback`.
5. The backend executes the payment, verifies the transaction status and stores the transaction ID and payment status.
6. The patient can check the result through `/api/v1/payment/my` or `/api/v1/payment/:paymentId`.

Payment credentials must be configured before testing this flow. Do not use fake payment data for production or final evaluation.

## Validation and Error Handling

Request bodies are validated with Zod before reaching the controllers. Invalid input is rejected with an error response. Unknown routes are handled by the not-found middleware, and unexpected errors are processed by the global error handler.

## Security Notes

- Passwords are hashed before storage.
- JWT secrets and third-party credentials must be stored in environment variables.
- Protected routes use Bearer-token authentication and role checks.
- Suspended and banned accounts are denied access by the authentication middleware.
- Do not expose database URLs, SMTP passwords, Google secrets, Cloudinary secrets or bKash credentials in the repository.

## Testing Checklist

Before submission, verify the following through Postman or Thunder Client:

- Patient registration, email verification and login.
- Google login with a valid Google ID token.
- Driver application and verification.
- Admin approval or rejection of a driver.
- Patient emergency request creation and cancellation.
- Admin ambulance creation and status update.
- Driver trip start and status updates.
- bKash payment creation and callback verification.
- Unauthorized request returns an authentication error.
- A role attempting another role's endpoint returns `403 Forbidden`.
- Invalid request data returns a structured validation error.
- Unknown resource IDs return a not-found error.
- Audit-log filters and pagination work as expected.

## API Documentation

The exported Postman API documentation is available here:

```text
API Docs: https://documenter.getpostman.com/view/37760772/2sBYB1M85o
```

## Demo Credentials

Use the following dedicated evaluation credentials. Do not use these credentials for any personal or production account.

```text
Admin Email   : admin@gmail.com
Admin Password: 123456
```

## Deployment

The repository includes `vercel.json` for deployment configuration. The deployed API URL is provided below.

```text
Live API: https://lifeline-dispatch-backend.vercel.app
```

## Project Submission

```text
Project Name    : LifeLine Dispatch
Student ID      : L2B7-1205
Backend Repo    : https://github.com/Asadul1120/Lifeline-Dispatch-Backend.git
Live API        : https://lifeline-dispatch-backend.vercel.app
API Docs        : https://documenter.getpostman.com/view/37760772/2sBYB1M85o
Demo Video      : https://drive.google.com/file/d/xyz/view
Admin Email     : admin@gmail.com
Admin Password  : 123456
```

## License

This project is intended for educational and assignment purposes.
