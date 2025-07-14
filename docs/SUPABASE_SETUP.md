# Supabase Setup Guide for Tab Man

This document outlines the complete setup process for integrating Supabase authentication and database services into the Tab Man application.

## Overview

Supabase provides our application with:

- **Authentication**: User signup, login, and session management
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Live updates for collaborative features
- **Security**: Built-in security policies and user permissions

## 1. Prerequisites

Before starting, ensure you have:

- A Supabase account ([supabase.com](https://supabase.com))
- Node.js and npm installed
- The Tab Man SvelteKit project set up

## 2. Package Installation

Install the required Supabase packages:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Dependencies Added:

- `@supabase/supabase-js`: Main Supabase client library
- `@supabase/ssr`: Server-side rendering support for SvelteKit

## 3. Environment Configuration

### 3.1 Create Environment File

Create `.env.local` in your project root:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_project_url_here
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3.2 Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project named "tab-man"
3. Choose a region close to your users
4. Set a strong database password
5. Once created, go to **Settings → API**
6. Copy the following values to your `.env.local`:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon/public key** → `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 4. Client Configuration

### 4.1 Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// TypeScript definitions for database schema
export type Database = {
	public: {
		Tables: {
			profiles: {
				/* ... */
			};
			tabs: {
				/* ... */
			};
			tab_members: {
				/* ... */
			};
			tab_invitations: {
				/* ... */
			};
			places: {
				/* ... */
			};
		};
	};
};
```

### 4.2 Server Hooks (`src/hooks.server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
	// Creates Supabase client for each request
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key) => event.cookies.get(key),
			set: (key, value, options) => event.cookies.set(key, value, { ...options, path: '/' }),
			remove: (key, options) => event.cookies.delete(key, { ...options, path: '/' })
		}
	});

	// Validates JWT and returns session
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
```

### 4.3 Type Definitions (`src/app.d.ts`)

```typescript
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
		}
		interface PageData {
			session: Session | null;
		}
	}
}
```

## 5. Authentication Pages

### 5.1 Login Page (`src/routes/login/+page.svelte`)

Features:

- Email/password authentication
- Error handling and validation
- Redirect to home on successful login
- Link to signup page

### 5.2 Signup Page (`src/routes/signup/+page.svelte`)

Features:

- User registration with display name
- Email confirmation flow
- Error handling
- Automatic profile creation via database trigger

### 5.3 Auth Callback (`src/routes/auth/callback/+server.ts`)

Handles email confirmation and OAuth redirects:

```typescript
export const GET = async ({ url, locals }: RequestEvent) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, `/${next.slice(1)}`);
		}
	}

	throw redirect(303, '/auth/auth-code-error');
};
```

## 6. Database Schema

### 6.1 Core Tables

Our database consists of five main tables:

1. **profiles** - Extended user information
2. **tabs** - Main tab entities for bill splitting
3. **tab_members** - Many-to-many relationship between users and tabs
4. **tab_invitations** - Pending invitations system
5. **places** - Venues/locations within tabs

### 6.2 Schema Implementation

Run the complete schema from `supabase-schema.sql` in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create all tables with proper relationships
CREATE TABLE profiles ( /* ... */ );
CREATE TABLE tabs ( /* ... */ );
CREATE TABLE tab_members ( /* ... */ );
CREATE TABLE tab_invitations ( /* ... */ );
CREATE TABLE places ( /* ... */ );

-- Set up security policies
CREATE POLICY "Users can view their own profile" ON profiles /* ... */;
-- ... additional policies

-- Auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() /* ... */;
CREATE TRIGGER on_auth_user_created /* ... */;
```

### 6.3 Row Level Security (RLS)

Security policies ensure:

- Users can only see their own profiles
- Users can only access tabs they're members of
- Invitation system maintains proper permissions
- Data isolation between different user groups

## 7. Authentication Flow

### 7.1 Layout Integration (`src/routes/+layout.server.ts`)

```typescript
export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	return { session, user };
};
```

### 7.2 Client-Side Auth State (`src/routes/+layout.svelte`)

```typescript
onMount(() => {
	const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
		if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
			invalidate('supabase:auth');
		}
	});

	return () => authListener.subscription.unsubscribe();
});
```

## 8. Supabase Dashboard Configuration

### 8.1 Authentication Settings

In your Supabase dashboard:

1. Go to **Authentication → Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:5173` (development)
   - **Redirect URLs**: `http://localhost:5173/auth/callback`
   - **Email confirmation**: Enable for security
   - **Email templates**: Customize as needed

### 8.2 Database Configuration

1. **Run the schema**: Copy `supabase-schema.sql` into SQL Editor and execute
2. **Verify tables**: Check Table Editor to ensure all tables were created
3. **Test policies**: Ensure Row Level Security is working correctly

## 9. Testing the Setup

### 9.1 Authentication Test

1. Start your development server: `npm run dev`
2. Navigate to `/signup` and create a test account
3. Check your email for confirmation
4. Try logging in at `/login`
5. Verify session persistence across page refreshes

### 9.2 Database Test

1. Check that a profile was automatically created in the `profiles` table
2. Verify that user can only see their own data
3. Test the security policies by trying to access other users' data

## 10. Next Steps

With Supabase configured, you can now:

1. **Implement tab creation** with proper user association
2. **Build the invitation system** using the `tab_invitations` table
3. **Add real-time features** for collaborative bill splitting
4. **Create the tab management interface**
5. **Implement receipt upload and processing**

## 11. Security Considerations

### 11.1 Environment Variables

- Never commit `.env.local` to version control
- Use different Supabase projects for development/staging/production
- Rotate service role keys periodically

### 11.2 Row Level Security

- Always test RLS policies thoroughly
- Use the principle of least privilege
- Regularly audit database access patterns

### 11.3 Authentication

- Enable email confirmation in production
- Consider implementing password strength requirements
- Set up proper session management

## 12. Troubleshooting

### Common Issues:

1. **Environment variables not loading**: Check `.env.local` format and restart dev server
2. **Authentication redirects failing**: Verify callback URL configuration
3. **Database permission errors**: Review RLS policies and user roles
4. **Schema creation errors**: Ensure proper PostgreSQL syntax and dependencies

### Debugging Tips:

- Use Supabase dashboard logs for database queries
- Check browser developer tools for authentication errors
- Verify environment variables are loaded correctly
- Test individual components in isolation

---

_Last updated: July 13, 2025_
_Version: 1.0_
