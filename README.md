# Smart Campus (Zentaritas)

Smart Campus is a full-stack university management platform for modern campus operations. It combines secure identity flows, room and resource booking, facility management, notifications, and admin controls in one application.

<p align="center">
	<img src="screen%20shot/main.png" alt="Smart Campus Project Preview" width="920" />
</p>
<p align="center"><em>Landing page experience of Smart Campus</em></p>

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Run the Project](#run-the-project)
- [API Highlights](#api-highlights)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)

## Overview

This project is split into two applications:

- `backend/`: Spring Boot REST API
- `frontend/`: React + Vite single-page application

It supports role-based access for students, academic staff, non-academic staff, and administrators.

## Core Features

- Email/password authentication with OTP verification and password reset
- Google sign-in support
- JWT authentication with refresh tokens in HttpOnly cookies
- Room booking with availability checks, conflict detection, approvals, and cancellations
- Facility management for buildings, floors, and rooms
- User profile and account settings pages
- Notification center (unread/read-all/delete flows)
- Admin user management, including bulk staff import

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form + Zod
- Axios
- Tailwind CSS + Radix UI

### Backend

- Java 17
- Spring Boot 3.5.x
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT (JJWT)
- Spring Mail
- Google OAuth2 Client
- Cloudinary

## Project Architecture

```text
Zentaritas/
|-- backend/
|   |-- src/main/java/com/zentaritas/
|   |-- src/main/resources/
|   `-- pom.xml
|-- frontend/
|   |-- src/
|   |-- public/
|   `-- package.json
|-- screen shot/
`-- README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js 18+ and npm
- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- Optional: Google Cloud OAuth credentials
- Optional: SMTP credentials for email features

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd Zentaritas
```

### 2. Create Database

Create a PostgreSQL database (example: `zentaritas_db`).

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zentaritas_db
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=86400000

# SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# App URLs
FRONTEND_URL=http://localhost:5173
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Initial Admin (optional)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
ADMIN_FIRSTNAME=System
ADMIN_LASTNAME=Admin
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_APP_NAME=Smart Campus
VITE_SESSION_TIMEOUT_MINUTES=30
```

## Run the Project

### Start Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend base URL: `http://localhost:8080`

Health endpoint: `GET http://localhost:8080/api/public/health`

### Start Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## API Highlights

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Bookings

- `GET /api/bookings/availability/{roomId}`
- `GET /api/bookings/available-slots/{roomId}`
- `POST /api/bookings/detect-conflicts`
- `POST /api/bookings`
- `GET /api/bookings/my-bookings`
- `PUT /api/bookings/{bookingId}/approve`
- `PUT /api/bookings/{bookingId}/reject`

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/unread`
- `PUT /api/notifications/{notificationId}/read`
- `PUT /api/notifications/read-all`

### Facilities and Admin

- `GET /api/management/facilities/buildings`
- `GET /api/management/facilities/floors`
- `GET /api/management/facilities/rooms`
- `GET /api/admin/users`
- `POST /api/admin/users/staff`
- `POST /api/admin/users/staff/import`

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend

- `mvn spring-boot:run` - Run backend in development mode
- `mvn test` - Run tests
- `mvn clean package` - Build deployable JAR

## Troubleshooting

- `Vite http proxy error ECONNREFUSED`: backend is not running on port `8080`.
- Login/OAuth errors: verify frontend and backend environment variables match.
- CORS errors: update both `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL`.
- Email issues: verify SMTP credentials and app-password configuration.

## Screenshots

<p align="center"><strong>Project UI Gallery</strong></p>

<table>
	<tr>
		<td align="center"><strong>Home</strong></td>
		<td align="center"><strong>About</strong></td>
		<td align="center"><strong>Gallery</strong></td>
	</tr>
	<tr>
		<td><img src="screen%20shot/main.png" alt="Home" width="100%" /></td>
		<td><img src="screen%20shot/about.png" alt="About" width="100%" /></td>
		<td><img src="screen%20shot/gallery.png" alt="Gallery" width="100%" /></td>
	</tr>
	<tr>
		<td align="center"><strong>Admin Dashboard</strong></td>
		<td align="center"><strong>User Dashboard</strong></td>
		<td align="center"><strong>Facilities</strong></td>
	</tr>
	<tr>
		<td><img src="screen%20shot/admin.png" alt="Admin Dashboard" width="100%" /></td>
		<td><img src="screen%20shot/userdashboard.png" alt="User Dashboard" width="100%" /></td>
		<td><img src="screen%20shot/faclities.png" alt="Facilities" width="100%" /></td>
	</tr>
	<tr>
		<td colspan="3" align="center"><strong>Contact</strong></td>
	</tr>
	<tr>
		<td colspan="3" align="center"><img src="screen%20shot/contactus.png" alt="Contact" width="75%" /></td>
	</tr>
</table>

## Roadmap

- Add CI workflow for frontend and backend checks
- Add Docker Compose for one-command local startup
- Add API documentation with OpenAPI/Swagger

---

Built for efficient, secure, and scalable campus operations.
