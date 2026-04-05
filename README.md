# filmino

A full-stack movie & series database web app built with React + Vite + Supabase.

## Tech Stack

- **Frontend:** React + Vite, React Router, Tailwind CSS, Zustand
- **Backend:** Supabase (Postgres, Auth, Storage)

## Features

- 🎬 Movies & Series database (IMDb + TMDb + Letterboxd style)
- 🔐 Auth with admin approval system
- 🛠️ Admin panel with TMDb import (search by title or ID)
- ⭐ Ratings, reviews, watchlist
- 🎭 Cast & crew pages
- 🔍 Centralized search
- 🌙 Dark / Light theme

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your Supabase + TMDb keys
3. Run the SQL in `supabase_schema.sql` in your Supabase SQL Editor
4. `npm install && npm run dev`
