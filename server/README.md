# Roots and Routes – Backend

## Quick Start (no manual SQL needed)

All database tables are created automatically when the server starts for the first time.

### Steps

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a MySQL database** (one-time, no tables needed — the server creates them):
   ```sql
   CREATE DATABASE IF NOT EXISTS RandR;
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=RandR
   PORT=5001
   GEMINI_API_KEY=your_gemini_api_key_here   # optional – enables AI chatbot
   ```

5. **Start the server:**
   ```bash
   npm run dev    # Development (nodemon)
   npm start      # Production
   ```

On first boot the server will:
- Create all tables (`admin`, `users`, `farmer`, `driver`, and all feature tables)
- Seed a default admin account → **email:** `admin@rootsroutes.com` **password:** `admin123`


## Available API endpoints:

- **Test Connection:** `GET /api/test-connection`
  - Tests if database connection is working

- **Get All Tables:** `GET /api/tables`
  - Lists all tables in RandR database

- **Get Table Structure:** `GET /api/table-structure/:tableName`
  - Returns column info for a specific table
  - Example: `/api/table-structure/farmer`

- **Login:** `POST /api/login`
  - Request body:
    ```json
    {
      "email": "user@example.com",
      "password": "password",
      "userType": "farmer" // or "driver", "admin", "users"
    }
    ```

## Database Schema

All user tables (farmer, driver, admin, users) have:
- id (Primary Key)
- email (Unique)
- password
- name
- phone
- created_at & updated_at timestamps
- Additional specific fields for each user type

**Important:** For production, implement password hashing with bcrypt!
