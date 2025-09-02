# BusinessAgent Server

Express.js server with PostgreSQL and Sequelize for the BusinessAgent application.

## Setup

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database with pgvector extension
- Environment variables configured

### Environment Variables
Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Required variables:
- `PG_DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key for LLM services

### Installation

```bash
npm install
```

### Running the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

### Health Check
Once running, visit: `http://localhost:3000/health`

## Project Structure

```
src/
  ├── app.js              # Express app configuration
  ├── server.js           # Server startup and lifecycle
  ├── index.js            # Main entry point
  ├── config/             # Configuration files
  │   ├── env.js          # Environment variables
  │   ├── logger.js       # Logging configuration
  │   └── rate_limit.js   # Rate limiting rules
  ├── db/                 # Database configuration
  │   ├── sequelize.js    # Sequelize setup
  │   ├── migrations/     # Database migrations
  │   └── seeders/        # Database seeders
  ├── models/             # Sequelize models
  ├── controllers/        # Route controllers
  ├── routes/             # Express routes
  ├── middleware/         # Custom middleware
  ├── services/           # Business logic services
  └── utils/              # Utility functions
```

## Database Operations

Use the SQL execution tool for database operations:

```bash
node ../src/tools/execute-sql.js "CREATE EXTENSION IF NOT EXISTS vector;"
node ../src/tools/execute-sql.js "SELECT * FROM users LIMIT 5;"
```

## Development Notes

- Uses ES modules (import/export)
- Snake_case for file names, camelCase for functions [[memory:6619022]]
- Early returns, avoid nested ifs
- Minimize database queries, marshal results
- All imports at file beginning [[memory:7904055]]
