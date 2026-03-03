# Zentaritas Backend

Spring Boot backend API for Zentaritas.

## Setup

1. Configure MySQL database:
   ```sql
   CREATE DATABASE zentaritas_db;
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your database credentials

4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

## Project Structure

```
src/main/java/com/zentaritas/
├── config/           # Configuration classes
├── controller/       # REST controllers
├── dto/              # Data Transfer Objects
│   ├── request/      # Request DTOs
│   └── response/     # Response DTOs
├── exception/        # Exception handling
├── model/            # Entity classes
├── repository/       # JPA repositories
└── service/          # Business logic
    └── impl/         # Service implementations
```

## API Endpoints

### Health Check
- `GET /api/public/health` - Check API status

### Authentication (To be implemented)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users (Protected)
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
