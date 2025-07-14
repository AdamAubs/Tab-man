import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Export types for TypeScript
export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					email: string;
					display_name: string | null;
					avatar_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					display_name?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					display_name?: string | null;
					avatar_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			tabs: {
				Row: {
					id: string;
					name: string;
					description: string | null;
					created_by: string;
					created_at: string;
					updated_at: string;
					status: 'active' | 'completed' | 'archived';
					total_amount: number;
				};
				Insert: {
					id?: string;
					name: string;
					description?: string | null;
					created_by: string;
					created_at?: string;
					updated_at?: string;
					status?: 'active' | 'completed' | 'archived';
					total_amount?: number;
				};
				Update: {
					id?: string;
					name?: string;
					description?: string | null;
					created_by?: string;
					created_at?: string;
					updated_at?: string;
					status?: 'active' | 'completed' | 'archived';
					total_amount?: number;
				};
			};
			tab_members: {
				Row: {
					id: string;
					tab_id: string;
					user_id: string;
					joined_at: string;
					role: 'owner' | 'member';
				};
				Insert: {
					id?: string;
					tab_id: string;
					user_id: string;
					joined_at?: string;
					role?: 'owner' | 'member';
				};
				Update: {
					id?: string;
					tab_id?: string;
					user_id?: string;
					joined_at?: string;
					role?: 'owner' | 'member';
				};
			};
			tab_invitations: {
				Row: {
					id: string;
					tab_id: string;
					email: string;
					invited_by: string;
					invited_at: string;
					status: 'pending' | 'accepted' | 'declined' | 'expired';
					token: string;
				};
				Insert: {
					id?: string;
					tab_id: string;
					email: string;
					invited_by: string;
					invited_at?: string;
					status?: 'pending' | 'accepted' | 'declined' | 'expired';
					token?: string;
				};
				Update: {
					id?: string;
					tab_id?: string;
					email?: string;
					invited_by?: string;
					invited_at?: string;
					status?: 'pending' | 'accepted' | 'declined' | 'expired';
					token?: string;
				};
			};
		};
	};
};
