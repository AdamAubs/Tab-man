// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Database } from '$lib/supabase';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
		}
		interface PageData {
			session: Session | null;
			supabase: SupabaseClient<Database>;
			user: User | null;
			cookies: Array<{ name: string; value: string }>;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
