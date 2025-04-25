# Next.js Frontend with Firebase Authentication

This is the frontend application built with Next.js and Firebase Authentication.

## Setup Firebase

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication in your Firebase project:
   - Go to Authentication > Get Started
   - Enable Google Authentication provider
   - Add any other authentication providers you want to use

3. Get your Firebase configuration:
   - Go to Project Settings (⚙️)
   - Scroll down to "Your apps" section
   - Click the web icon (</>)
   - Register your app with a nickname
   - Copy the configuration object

4. Set up environment variables:
   Create or update your `.env` file with your Firebase configuration:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication Features

- Sign in with Google
- Protected routes (/)
- Authentication status in header
- Automatic redirection for unauthenticated users

## Project Structure

- `src/lib/firebase.ts` - Firebase configuration and initialization
- `src/contexts/AuthContext.tsx` - Authentication context provider
- `src/components/providers/AuthProvider.tsx` - Client-side Auth provider wrapper
- `src/components/auth/AuthStatus.tsx` - Authentication status component
- `src/app/(protected)/page.tsx` - Example protected route

## Contributing

1. Make sure to set up your Firebase configuration in `.env`
2. Install dependencies with `bun install`
3. Run the development server with `bun run dev`
4. Make your changes
5. Test your changes
6. Submit a pull request
