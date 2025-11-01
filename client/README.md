# React + Tailwind App

A simple React + TypeScript application with Tailwind CSS.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `client` directory:
```
REACT_APP_SUPABASE_URL=your_supabase_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. Set up Supabase database tables:
   - Go to your Supabase Dashboard → SQL Editor
   - Copy and run the SQL from `setup_chat.sql` file in this directory
   - **Important**: If you already created the messages table, run `fix_realtime.sql` to fix Realtime issues

**Troubleshooting**: If you see `Subscription status: CHANNEL_ERROR` in the browser console, the table needs REPLICA IDENTITY. Run the SQL in `fix_realtime.sql` in your Supabase SQL Editor.

4. Run the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Build

To build for production:
```bash
npm run build
```

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS
- Create React App
- Supabase (Auth, Database, Realtime)
