# CampusConnect - Backend

Express.js backend server for CampusConnect with organized MVC structure and AI-powered resume parsing.

## Overview

This is the backend API server that handles resume parsing using OpenAI's GPT-3.5-turbo and PDF text extraction. The server follows a clean architecture with controllers, services, routes, and utilities.

## Project Structure

```
backend/
├── index.js                    # Main server entry point
├── controllers/                # Request handlers
│   └── resumeController.js    # Resume parsing logic
├── services/                   # Business logic
│   └── resumeService.js       # AI parsing service
├── routes/                     # API routes
│   ├── index.js               # Route aggregator
│   └── resumeRoutes.js        # Resume-related routes
└── utils/                      # Helper functions
    └── pdfParser.js           # PDF parsing utility
```

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root:
```
OPENAI_API_KEY=sk-your-openai-api-key
PORT=4000
```

3. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start at `http://localhost:4000`

## API Endpoints

### Health Check
```
GET /
```
Returns server status.

Response:
```json
{
  "success": true,
  "message": "Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Resume Parsing
```
POST /api/parse-resume
```

**Request Body:**
```json
{
  "fileUrl": "https://example.com/resume.pdf",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "full_name": "John Doe",
    "skills": ["JavaScript", "Python", "React"],
    "bio": "Experienced software developer...",
    "projects": ["Project 1", "Project 2"]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to parse resume",
  "error": "Error details"
}
```

## How It Works

1. **Controller** (`resumeController.js`): Handles HTTP request/response, validates input
2. **Service** (`resumeService.js`): Contains business logic for AI integration
3. **Utility** (`pdfParser.js`): Extracts text from PDF files
4. **Routes** (`resumeRoutes.js`): Defines API endpoints

## Tech Stack

- **Express 4** - Web framework
- **OpenAI API** - GPT-3.5-turbo for resume parsing
- **pdfreader** - PDF text extraction
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## License

MIT
