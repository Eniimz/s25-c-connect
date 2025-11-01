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
REACT_APP_BACKEND_URL=http://localhost:4000
```

3. Set up Supabase database tables:
   - Go to your Supabase Dashboard → SQL Editor
   - Run `setup_chat.sql` to create the messages table for Realtime chat
   - Run `setup_notifications.sql` to add push notification support to profiles
   - Run `setup_profile.sql` to add profile fields (full_name, bio, projects)
   - If you already have the messages table, run `fix_realtime.sql` to fix Realtime issues

4. Set up Supabase Storage:
   - Go to your Supabase Dashboard → Storage
   - Create a new bucket named `resumes`
   - Make it public (or configure RLS policies as needed)

5. Set up the backend server (for AI resume parsing):
   - Go to the `backend` directory
   - Create a `.env` file with: `OPENAI_API_KEY=your_openai_api_key_here`
   - Run `npm install` to install dependencies
   - Run `npm start` to start the backend server
   - The backend should be running on `http://localhost:4000`

6. Run the development server:
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
