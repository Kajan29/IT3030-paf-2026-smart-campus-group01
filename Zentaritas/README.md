# Zentaritas

A full-stack web application built with React (Frontend) and Spring Boot (Backend).

## Project Structure

```
Zentaritas/
├── frontend/          # React application
├── backend/           # Spring Boot application
└── README.md
```

## Tech Stack

### Frontend
- React 18
- Vite
- Axios
- React Router DOM

### Backend
- Java 17
- Spring Boot 3.x
- Spring Data JPA
- MySQL

## Getting Started

### Prerequisites
- Node.js 18+
- Java 17+
- MySQL 8+
- Maven 3.8+

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your MySQL credentials

4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

Backend will start at `http://localhost:8080`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

Frontend will start at `http://localhost:5173`

## License

MIT License
