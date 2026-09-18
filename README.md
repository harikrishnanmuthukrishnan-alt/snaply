# Snaply

Snaply is a photo and short-video social app built with React, TypeScript, Vite, Tailwind CSS, and Supabase. It includes accounts, a home feed, create/upload, profiles, follows, search, stories, Clips, messaging, and notifications.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Open [https://supabase.com](https://supabase.com) and create a project.
2. Wait until the database is ready.
3. In **Project Settings → API**, copy:
   - **Project URL**
   - **anon / public** key

Do **not** put the `service_role` key in this frontend app.

## 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

`.env.local` should look like:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

## 4. Run the database SQL

In the Supabase dashboard, open **SQL Editor** and run:

1. `supabase/schema.sql` — tables, indexes, triggers, RLS, realtime
2. `supabase/storage.sql` — storage buckets and policies

You can paste each file in full and run it.

### Auth settings

In **Authentication → URL configuration**, add your app URLs, for example:

- `http://localhost:5173`
- `http://localhost:5173/reset-password`

Enable email signup. Confirm-email is optional; if it is on, users must confirm before they can use Snaply.

### Enable Google signup

1. In the [Google Cloud Console](https://console.cloud.google.com/), create OAuth credentials of type **Web application**.
2. In Supabase, open **Authentication → Providers → Google**, enable it, and paste the Google client ID and client secret.
3. Add Supabase's callback URL shown on that provider screen to the Google OAuth client's **Authorized redirect URIs**.
4. In Supabase **Authentication → URL configuration**, add `http://localhost:5173` to the redirect allow list. Add your production domain there before deploying.
5. Restart `npm run dev`. The **Continue with Google** option is available on both Login and Sign up.

Google is responsible for the first identity sign-in. Snaply creates a profile automatically; the user can choose a custom username later in Settings.

## 5. Configure storage

`storage.sql` creates public buckets:

- `avatars`
- `posts`
- `stories`
- `videos`

Authenticated users can only upload into a folder named with their user id: `{user_id}/filename`.

Confirm the buckets exist under **Storage**. If a bucket already exists, the insert is skipped.

## 6. Start the development server

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Sign up with a username, display name, email, and password. Then create a post, follow another account, and try Clips, stories, and messages.

## 7. Build the production version

```bash
npm run build
npm run preview
```

`npm run build` type-checks with TypeScript and then builds with Vite.

## Project layout

```
src/
  components/   reusable UI
  pages/        route screens
  layouts/      app and auth shells
  hooks/        auth, theme, toasts
  lib/          supabase client and helpers
  services/     data access
  types/
supabase/
  schema.sql
  storage.sql
```

## Features

- Sign up, login, logout, forgot/reset password
- Protected routes
- Home feed from people you follow
- Like, comment, save, share
- Create image/video posts, Clips, and 24-hour stories
- Profiles, follow lists, explore grid, search
- Direct messages with realtime updates
- Notifications for follows, likes, comments, and messages
- Dark mode and notification preferences in Settings
