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
PORT=3000
```

3. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /
```
Returns server status.

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
