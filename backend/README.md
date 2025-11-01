# Backend Starter Kit

A simple Express + OpenAI starter backend.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root:
```
OPENAI_API_KEY=sk-...
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

### Resume Parsing
```
POST /api/parse-resume
```
Body:
```json
{
  "fileUrl": "https://example.com/resume.pdf",
  "userId": "user-uuid"
}
```
Returns extracted resume data including full name, skills, bio, and projects.

### OpenAI Chat
```
POST /api/openai/chat
```
Body:
```json
{
  "message": "Your message here"
}
```

## Tech Stack

- Express 4
- OpenAI API
- CORS
- dotenv

## License

MIT
