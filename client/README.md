# CampusConnect - Client

React frontend application for CampusConnect job matching platform.

## Overview

This is the client-side application built with React, TypeScript, and Tailwind CSS. It provides a modern, responsive interface for job seekers and employers to connect.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `client` directory:
```
REACT_APP_SUPABASE_URL=your_supabase_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
REACT_APP_BACKEND_URL=https://s25-c-connect-3st9.vercel.app
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

## Project Structure

```
client/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── JobCard.tsx
│   │   ├── JobList.tsx
│   │   ├── PostJobForm.tsx
│   │   ├── Chat.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Landing.tsx     # Landing page
│   │   ├── SignIn.tsx      # Sign in page
│   │   ├── SignUp.tsx      # Sign up page
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Profile.tsx     # User profile
│   │   ├── Chat.tsx        # Chat interface
│   │   └── ...
│   ├── context/            # React context
│   │   └── AuthContext.tsx # Authentication context
│   ├── utils/              # Utility functions
│   │   ├── matchScore.ts   # Job matching algorithm
│   │   └── notifications.ts # Push notification utils
│   └── lib/                # Library configs
│       └── supabase.ts     # Supabase client
└── supabase/               # Supabase Edge Functions
```

## Features

### Pages

- **Landing Page** - Beautiful landing page with features and stats
- **Sign In/Sign Up** - Authentication with email/password and Google OAuth
- **Dashboard** - Role-based dashboard (Seeker/Finder) with quick actions
- **Profile** - User profile management with resume upload and AI parsing
- **Job Listings** - Browse jobs with smart matching scores
- **Applications** - Track job applications (Seeker) and manage applicants (Finder)
- **Chat** - Real-time messaging between users
- **Saved Jobs** - Bookmark favorite job listings

### Components

- **JobCard** - Displays job information with match score
- **PostJobForm** - Create new job postings
- **NotificationCenter** - Message notifications dropdown
- **ApplyModal** - Application submission interface

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Create React App** - Build tooling
- **Supabase** - Authentication, Database, Realtime, Storage
- **React Router** - Client-side routing
