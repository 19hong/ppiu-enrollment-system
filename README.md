# PPIU Enrollment System

A full-stack enrollment management system for the **Pan Pacific International University (PPIU)**. Built with Node.js, Express, Next.js, PostgreSQL, and Prisma, the system streamlines student admissions, document management, and administrative workflows.

---

## Features

- **Role-based access control** — Admin, Staff, and Student dashboards with granular permissions
- **Online application submission** — Multi-step enrollment forms with file uploads
- **Document management** — Upload, verify, and store student documents via Cloudinary
- **Automated notifications** — Email alerts for application status changes via Nodemailer
- **Secure authentication** — JWT-based login with access & refresh token rotation
- **Dashboard analytics** — Real-time enrollment statistics and visual charts
- **Student profile management** — Personal info, academic history, and document tracking
- **Admin panel** — Manage users, applications, program offerings, and system settings

---

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Frontend    | Next.js 14, React 18, TypeScript, Tailwind CSS      |
| Backend     | Node.js, Express, TypeScript                        |
| Database    | PostgreSQL 16, Prisma ORM                           |
| Auth        | JWT (access + refresh tokens), bcrypt               |
| File Upload | Cloudinary (media), Multer (local)                  |
| Email       | Nodemailer                                          |
| Container   | Docker, Docker Compose                              |
| Deployment  | Vercel (frontend), Render (backend), Neon (DB)      |

---

## System Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Next.js App   │──────▶│   Express API    │──────▶│  PostgreSQL  │
│   (Frontend)    │◀──────│   (Backend)      │◀──────│   (Database) │
└─────────────────┘       └──────────────────┘       └──────────────┘
         │                         │
         │                         ├──▶ Cloudinary (file storage)
         │                         ├──▶ SMTP (email service)
         │                         └──▶ JWT (auth tokens)
         │
         └──▶ Tailwind CSS (styling)
```

---

## Prerequisites

- **Node.js** v20 or later
- **PostgreSQL** 14+ (local or cloud — e.g., Neon)
- **npm** or **yarn**
- **Docker** & **Docker Compose** (optional — for containerized setup)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/ppiu-enrollment-system.git
cd ppiu-enrollment-system
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set up environment variables

Create `.env` files in both `backend/` and `frontend/` directories.

**backend/.env**

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://ppiu_user:ppiu_password@localhost:5432/ppiu_enrollment?schema=public

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@ppiu.edu.kh

FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Set up the database

```bash
# Create the database (adjust credentials as needed)
psql -U postgres -c "CREATE DATABASE ppiu_enrollment;"
psql -U postgres -c "CREATE USER ppiu_user WITH PASSWORD 'ppiu_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ppiu_enrollment TO ppiu_user;"
```

### 5. Run Prisma migrations and seed

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Start the backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:5000`.

### 7. Start the frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Docker Setup

Build and run all services with a single command:

```bash
docker compose up --build
```

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:3000       |
| Backend   | http://localhost:5000       |
| Database  | postgresql://localhost:5432 |

To stop containers:

```bash
docker compose down
```

To remove volumes (resets database):

```bash
docker compose down -v
```

---

## Default Login Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@ppiu.edu.kh     | Admin@123  |

> **⚠️ Change the default password immediately after first login.**

---

## API Documentation

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/auth/login`         | Login                |
| POST   | `/auth/register`      | Register             |
| POST   | `/auth/logout`        | Logout               |
| POST   | `/auth/refresh`       | Refresh access token |
| POST   | `/auth/forgot-password` | Send reset email  |
| POST   | `/auth/reset-password` | Reset password     |

### Users

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | `/users`              | List users (admin)   |
| GET    | `/users/:id`          | Get user by ID       |
| PUT    | `/users/:id`          | Update user          |
| DELETE | `/users/:id`          | Delete user (admin)  |

### Students

| Method | Endpoint                      | Description                |
|--------|-------------------------------|----------------------------|
| GET    | `/students`                   | List students              |
| GET    | `/students/:id`               | Get student profile        |
| POST   | `/students`                   | Create student record      |
| PUT    | `/students/:id`               | Update student             |
| DELETE | `/students/:id`               | Delete student             |
| GET    | `/students/:id/documents`     | Get student documents      |

### Applications

| Method | Endpoint                  | Description                   |
|--------|---------------------------|-------------------------------|
| GET    | `/applications`           | List applications             |
| POST   | `/applications`           | Submit new application        |
| GET    | `/applications/:id`       | Get application details       |
| PUT    | `/applications/:id`       | Update application            |
| PUT    | `/applications/:id/status` | Update application status    |

### Programs

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | `/programs`           | List programs        |
| POST   | `/programs`           | Create program       |
| GET    | `/programs/:id`       | Get program details  |
| PUT    | `/programs/:id`       | Update program       |
| DELETE | `/programs/:id`       | Delete program       |

### File Upload

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/upload`             | Upload a file        |
| DELETE | `/upload/:publicId`   | Delete uploaded file |

### Dashboard

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/dashboard/stats`    | Get enrollment stats     |
| GET    | `/dashboard/recent`   | Get recent activity      |

---

## Project Structure

```
ppiu-enrollment-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── types/
│   │   └── index.ts
│   ├── uploads/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── applications/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── styles/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── .dockerignore
└── README.md
```

---

## Deployment

### Frontend — Vercel

```bash
npm i -g vercel
vercel --prod
```

Set environment variable `NEXT_PUBLIC_API_URL` to your production backend URL in the Vercel dashboard.

### Backend — Render

1. Create a new **Web Service** on Render
2. Set **Build Command** to:
   ```bash
   cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
3. Set **Start Command** to:
   ```bash
   cd backend && npm start
   ```
4. Add all environment variables from `backend/.env` in the Render dashboard.

### Database — Neon (Serverless PostgreSQL)

1. Create a Neon project and copy the connection string
2. Replace `DATABASE_URL` in your backend environment variables
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## Environment Variables Reference

### Backend

| Variable               | Description                        | Default                        |
|------------------------|------------------------------------|--------------------------------|
| `PORT`                 | API server port                    | `5000`                         |
| `NODE_ENV`             | Environment mode                   | `development`                  |
| `DATABASE_URL`         | PostgreSQL connection string       | *(required)*                   |
| `JWT_SECRET`           | Access token signing key           | *(required)*                   |
| `JWT_REFRESH_SECRET`   | Refresh token signing key          | *(required)*                   |
| `JWT_EXPIRES_IN`       | Access token TTL                   | `15m`                          |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL               | `7d`                           |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name              | *(optional)*                   |
| `CLOUDINARY_API_KEY`   | Cloudinary API key                 | *(optional)*                   |
| `CLOUDINARY_API_SECRET`| Cloudinary API secret              | *(optional)*                   |
| `SMTP_HOST`            | SMTP server host                   | `smtp.gmail.com`               |
| `SMTP_PORT`            | SMTP server port                   | `587`                          |
| `SMTP_SECURE`          | Use TLS for SMTP                   | `false`                        |
| `SMTP_USER`            | SMTP authentication user           | *(optional)*                   |
| `SMTP_PASS`            | SMTP authentication password       | *(optional)*                   |
| `EMAIL_FROM`           | Sender email address               | `noreply@ppiu.edu.kh`          |
| `FRONTEND_URL`         | Frontend URL for CORS              | `http://localhost:3000`        |

### Frontend

| Variable               | Description                     | Default                        |
|------------------------|---------------------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL            | `http://localhost:5000/api`    |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please follow the existing code style and ensure all lint checks pass before submitting.

---

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

&copy; 2024 Pan Pacific International University (PPIU). All rights reserved.
