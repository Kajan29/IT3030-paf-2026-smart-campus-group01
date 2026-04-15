# Smart Campus Backend

Spring Boot REST API for Smart Campus university management system with comprehensive authentication and authorization.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 17** or higher ([Download](https://adoptium.net/))
- **Maven 3.8+** ([Download](https://maven.apache.org/download.cgi))
- **MySQL 8.0+** ([Download](https://dev.mysql.com/downloads/mysql/))
- Google Cloud Console account (for OAuth2 setup)

Verify installations:
```bash
java -version      # Should show Java 17+
mvn -version       # Should show Maven 3.8+
mysql --version    # Should show MySQL 8.0+
```

## 🚀 Quick Start

### 1. Database Setup

No manual table creation is required.

- The application reads DB settings from `backend/.env`.
- If the database does not exist, it is created automatically when `DB_AUTO_CREATE=true`.
- Tables are created/updated automatically when `JPA_DDL_AUTO=update`.

Important: The configured MySQL user must have permission to create databases.

### 2. Google OAuth Configuration (Optional)

If you want to enable Google authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Navigate to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
6. Save the **Client ID** and **Client Secret**

### 3. Email Configuration (Gmail SMTP)

For email verification and password reset features:

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Navigate to **2-Step Verification > App passwords**
   - Generate a password for "Mail" application
   - Save the 16-character password

### 4. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zentaritas_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-256-bits
JWT_EXPIRATION=86400000

# Email Configuration (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password

# Google OAuth2 (Optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Server Configuration
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Security Note:** Never commit the `.env` file to version control!

### 5. Install Dependencies

Navigate to the backend directory and install dependencies:
```bash
cd backend
mvn clean install
```

### 6. Run the Application

Start the Spring Boot application:
```bash
mvn spring-boot:run
```

Or compile and run the JAR:
```bash
mvn clean package
java -jar target/smart-campus-backend-1.0.0.jar
```

The backend will start at: **http://localhost:8080**

## 🧪 Testing

Run tests:
```bash
mvn test
```

Run tests with coverage:
```bash
mvn clean test jacoco:report
```

## 📁 Project Structure

```
src/main/java/com/zentaritas/
├── SmartCampusApplication.java        # Main application entry point
├── config/                           # Configuration classes
│   ├── CorsConfig.java              # CORS configuration
│   ├── SecurityConfig.java          # Spring Security setup
│   ├── JwtAuthenticationFilter.java # JWT filter
│   └── PasswordEncoderConfig.java   # Password encoder bean
├── controller/                       # REST API controllers
│   ├── HealthController.java        # Health check endpoint
│   └── auth/                        # Authentication endpoints
├── dto/                             # Data Transfer Objects
│   ├── auth/                        # Auth-related DTOs
│   └── response/                    # Response DTOs
├── exception/                        # Exception handling
│   └── GlobalExceptionHandler.java  # Global exception handler
├── model/                           # JPA Entity classes
├── repository/                      # JPA Repositories
└── service/                         # Business logic layer
    └── impl/                        # Service implementations

src/main/resources/
├── application.properties           # Main configuration
└── application-local.properties     # Local environment config
```

## 🔌 API Endpoints

### Public Endpoints

#### Health Check
```http
GET /api/public/health
```

#### Authentication
```http
POST /api/auth/register          # Register new user
POST /api/auth/login             # Login with email/password
POST /api/auth/google            # Login/Register with Google
POST /api/auth/verify-email      # Verify email with OTP
POST /api/auth/resend-verification  # Resend OTP
POST /api/auth/forgot-password   # Request password reset
POST /api/auth/reset-password    # Reset password with code
```

### Protected Endpoints (Requires JWT Token)

```http
GET /api/users                   # Get all users (Admin only)
GET /api/users/profile           # Get current user profile
PUT /api/users/profile           # Update user profile
```

**Authorization Header:**
```
Authorization: Bearer <your_jwt_token>
```

## 🛠️ Tech Stack

- **Framework:** Spring Boot 3.2.0
- **Java Version:** 17
- **Security:** Spring Security + JWT (JJWT 0.12.3)
- **Database:** MySQL 8+ with Spring Data JPA
- **Authentication:** Email/Password + Google OAuth2
- **Email:** Spring Mail with SMTP
- **Build Tool:** Maven
- **Additional Libraries:**
  - Lombok (boilerplate reduction)
  - Hibernate Validator
  - Dotenv (environment variables)
  - Google API Client

## 🔐 Security Features

- JWT-based authentication
- Password encryption with BCrypt
- Role-based access control (RBAC)
- Email verification with OTP
- Password reset functionality
- Google OAuth2 integration
- CORS configuration
- Request validation

## 🐛 Troubleshooting

### Database Connection Issues
```
Error: Access denied for user 'root'@'localhost'
```
**Solution:** Verify MySQL credentials in `.env` file

### Port Already in Use
```
Error: Port 8080 is already in use
```
**Solution:** Change port in `.env` file or kill the process:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Email Sending Fails
```
Error: AuthenticationFailedException
```
**Solution:** 
- Ensure you're using an App Password, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Check MAIL_USERNAME and MAIL_PASSWORD in `.env`

### Maven Build Fails
```
Error: Failed to execute goal
```
**Solution:**
```bash
mvn clean install -U
```

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DB_HOST` | MySQL host | Yes | localhost |
| `DB_PORT` | MySQL port | No | 3306 |
| `DB_NAME` | Database name | Yes | zentaritas_db |
| `DB_USERNAME` | Database user | Yes | root |
| `DB_PASSWORD` | Database password | Yes | - |
| `JWT_SECRET` | JWT signing key | Yes | - |
| `JWT_EXPIRATION` | Token validity (ms) | No | 86400000 (24h) |
| `MAIL_USERNAME` | SMTP email | Yes | - |
| `MAIL_PASSWORD` | SMTP password | Yes | - |
| `GOOGLE_CLIENT_ID` | OAuth2 client ID | No* | - |
| `GOOGLE_CLIENT_SECRET` | OAuth2 secret | No* | - |

\* Required if Google authentication is enabled

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 📄 License

This project is part of the Smart Campus university management system.
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
