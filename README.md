# Zentaritas

A full-stack university management web application with Google OAuth authentication, built with React (Frontend) and Spring Boot (Backend).

## Features

- 🔐 Email/Password Authentication
- 🔑 Google OAuth 2.0 Authentication
- ✉️ Email Verification with OTP
- 🔄 Password Reset Functionality
- 👥 Role-based Access Control (Student, Academic Staff, Non-Academic Staff, Admin)
- 📧 SMTP Email Integration
- 🛡️ JWT Token-based Security

## Project Structure

```
Zentaritas/
├── frontend/          # React application with Vite
├── backend/           # Spring Boot application
└── README.md
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Axios
- React Router DOM
- @react-oauth/google
- TailwindCSS
- React Toastify

### Backend
- Java 17
- Spring Boot 3.2
- Spring Security
- Spring Data JPA
- MySQL
- JWT (JJWT 0.12.x)
- Google OAuth2 Client
- Spring Mail

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **Java 17+** ([Download](https://adoptium.net/))
- **Maven 3.8+** ([Download](https://maven.apache.org/download.cgi))
- **MySQL 8+** ([Download](https://dev.mysql.com/downloads/mysql/))
- Google Cloud Console account (for OAuth setup)

Verify installations:
```bash
node --version    # Should show v18+
npm --version
java -version     # Should show Java 17+
mvn -version      # Should show Maven 3.8+
mysql --version   # Should show MySQL 8.0+
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** and **Google Identity Services**
4. Navigate to **APIs & Services > Credentials**
5. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
6. Copy the **Client ID** and **Client Secret**

### Gmail SMTP Setup (for Email Features)

1. Enable 2-Step Verification on your Google account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Navigate to **2-Step Verification > App passwords**
4. Generate an app password for "Mail"
5. Save the 16-character password for backend configuration

### Backend Setup

#### 1. Create MySQL Database

```sql
CREATE DATABASE zentaritas_db;

-- Optional: Create dedicated user
CREATE USER 'zentaritas_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zentaritas_db.* TO 'zentaritas_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Configure Environment Variables

Navigate to the backend directory:
```bash
cd backend
```

Create a `.env` file in the `backend/` directory with the following configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zentaritas_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT Configuration (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits
JWT_EXPIRATION=86400000

# Email Configuration (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server Configuration
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Important:** Never commit the `.env` file to version control!

#### 3. Install Dependencies and Run

```bash
# Install Maven dependencies
mvn clean install

# Run the application
mvn spring-boot:run
```

Alternatively, build and run the JAR:
```bash
mvn clean package
java -jar target/zentaritas-backend-1.0.0.jar
```

**Backend will start at:** `http://localhost:8080`

#### 4. Verify Backend is Running

Open your browser or use curl:
```bash
curl http://localhost:8080/api/public/health
```

Expected response:
```json
{
  "status": "UP",
  "message": "API is running smoothly!"
}
```

### Frontend Setup

#### 1. Navigate to Frontend Directory

```bash
cd frontend
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

#### 4. Start Development Server

```bash
npm run dev
```

**Frontend will start at:** `http://localhost:5173`
🔌 API Documentation

### Public Endpoints

#### Health Check
```http
GET /api/public/health
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

#### Google Authentication
```http
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google_id_token"
}
```

#### Email Verification
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "student@example.com",
  "code": "123456"
}
```

#### Resend Verification Code
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "student@example.com"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "student@example.com",
  "code": "123456",
  "newPassword": "NewSecurePass123!"
}
```

### Protected Endpoints (Requires JWT Token)

Include the JWT token in the Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

## 🛠️ Development

### Project Structure
```
Zentaritas/
├── backend/                      # Spring Boot API
│   ├── src/main/java/           # Java source code
│   │   └── com/zentaritas/
│   │       ├── config/          # Security, CORS, JWT config
│   │       ├── controller/      # REST endpoints
│   │       ├── dto/             # Data transfer objects
│   │       ├── exception/       # Exception handling
│   │       ├── model/           # JPA entities
│   │       ├── repository/      # Data access layer
│   │       └── service/         # Business logic
│   ├── src/main/resources/      # Configuration files
│   └── pom.xml                  # Maven dependencies
│
└── frontend/                     # React + Vite app
    ├── src/
    │   ├── components/          # Reusable components
    │   ├── context/             # React context (Auth)
    │   ├── hooks/               # Custom hooks
    │   ├── layouts/             # Page layouts
    │   ├── pages/               # Page components
    │   ├── services/            # API services
    │   └── utils/               # Utility functions
    └── package.json             # NPM dependencies
```

### Running Tests

#### Backend Tests
```bash
cd backend
mvn test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

## 🐛 Troubleshooting

### Common Backend Issues

#### Port 8080 Already in Use
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

#### Database Connection Failed
- Verify MySQL is running
- Check credentials in `.env` file
- Ensure database `zentaritas_db` exists

#### Email Sending Failed
- Use App Password, not regular Gmail password
- Enable 2-Step Verification
- Check MAIL_USERNAME and MAIL_PASSWORD

### Common Frontend Issues

#### Cannot Connect to Backend
- Ensure backend is running on port 8080
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS settings in backend

#### Google OAuth Not Working
- Verify `VITE_GOOGLE_CLIENT_ID` matches Google Console
- Check authorized origins in Google Console
- Clear browser cache

## 📦 Deployment

### Backend Deployment

Build production JAR:
```bash
cd backend
mvn clean package -DskipTests
```

Run in production:
```bash
java -jar target/zentaritas-backend-1.0.0.jar
```

### Frontend Deployment

Build for production:
```bash
cd frontend
npm run build
```

The `dist/` folder can be deployed to any static hosting service (Netlify, Vercel, AWS S3, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is developed for Zentaritas university management system.

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review backend logs: `backend/logs/`
- Check browser console for frontend errors

## 🙏 Acknowledgments

- Spring Boot Team
- React Team
- Google OAuth2 Team
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- **Backend:** http://localhost:8080
- **Frontend:** http://localhost:5173

## 🔌 API Documentation

### Authentication
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login/Register with Google
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-verification` - Resend verification code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with code

## Environment Variables

See `.env.example` files in both `frontend/` and `backend/` directories for required environment variables.

## License

MIT License
