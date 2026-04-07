# Zentaritas

Zentaritas is a full-stack university management platform with role-based access, room booking, facility management, user administration, and Google sign-in. The frontend is built with React and Vite, and the backend is a Spring Boot REST API.

## What It Does

- Email/password authentication with email verification and password reset
- Google OAuth login
- JWT-based session handling with refresh tokens in HttpOnly cookies
- Role-based access for student, academic staff, non-academic staff, and admin users
- Room booking with availability checks, conflict detection, approvals, cancellations, and notifications
- Facility management for buildings, floors, and rooms, including image uploads
- Admin user management, including staff creation and Excel import
- Profile editing, settings, and protected user pages

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- React Hook Form
- TanStack Query
- Axios
- Tailwind CSS
- Radix UI primitives
- React Toastify
- Google Identity / @react-oauth/google

### Backend

- Java 17
- Spring Boot 3.5
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT
- Google OAuth2 client support
- Spring Mail
- Cloudinary for media storage
- Apache POI and Apache Commons CSV for imports and parsing

## Project Layout

```text
Zentaritas/
├── backend/         Spring Boot API
├── frontend/        React/Vite app
└── README.md
```

## Main Screens

- Home, About, Contact
- Book room and resource browsing
- Authentication flows: login, register, OTP verification, forgot password
- Profile and settings pages
- Admin area and dashboard

## Prerequisites

Install the following:

- Node.js 18+ and npm
- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- A Google Cloud project if you want Google sign-in
- A SMTP account if you want email verification and password reset messages

## Backend Setup

The backend loads environment variables from a `.env` file when present. It checks the current working directory, the `backend/` folder, and a few parent directories, so placing the file in `backend/.env` is the safest option.

### 1. Create the database

Create the PostgreSQL database and user you want to use. The application can also create the database automatically on startup if the configured user has permission.

### 2. Configure `backend/.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zentaritas_db
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=86400000

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

FRONTEND_URL=http://localhost:5173
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_FIRSTNAME=System
ADMIN_LASTNAME=Admin
```

### 3. Run the backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The API runs at `http://localhost:8080`.

### 4. Health check

```http
GET /api/public/health
```

## Frontend Setup

### 1. Configure `frontend/.env`

```env
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_APP_NAME=Zentaritas
VITE_SESSION_TIMEOUT_MINUTES=30
```

### 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Backend API Highlights

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Profile

- `GET /api/profile/me`
- `PUT /api/profile`

### Bookings

- `GET /api/bookings/availability/{roomId}`
- `GET /api/bookings/available-slots/{roomId}`
- `GET /api/bookings/occupancy/{roomId}`
- `POST /api/bookings/detect-conflicts`
- `POST /api/bookings`
- `GET /api/bookings/my-bookings`
- `GET /api/bookings/pending`
- `PUT /api/bookings/{bookingId}/approve`
- `PUT /api/bookings/{bookingId}/reject`
- `DELETE /api/bookings/{bookingId}`

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/unread`
- `GET /api/notifications/unread/count`
- `PUT /api/notifications/{notificationId}/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/{notificationId}`

### Facilities

- `GET /api/management/facilities/buildings`
- `GET /api/management/facilities/floors`
- `GET /api/management/facilities/rooms`
- CRUD endpoints for buildings, floors, and rooms

### Admin Users

- `GET /api/admin/users`
- `GET /api/admin/users/students`
- `GET /api/admin/users/staff`
- `POST /api/admin/users/staff`
- `POST /api/admin/users/staff/import`
- `PATCH /api/admin/users/{id}/status`
- `DELETE /api/admin/users/{id}`

## Notes

- Refresh tokens are stored in HttpOnly cookies.
- The backend uses PostgreSQL, not MySQL.
- If you change the frontend origin, update both `CORS_ALLOWED_ORIGINS` and `VITE_API_URL`.

## Verification

If both apps start successfully, you should be able to open the frontend at `http://localhost:5173` and reach the API health endpoint at `http://localhost:8080/api/public/health`.
