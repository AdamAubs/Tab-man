import { AuthApiError } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const redirectTo = url.searchParams.get('redirect') || '/';

	return {
		redirectTo
	};
};

export const actions: Actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const displayName = formData.get('displayName') as string;
		// const redirectTo = (url.searchParams.get('redirect') as string) || '/';

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					display_name: displayName
				},
				// This URL is where the user is sent after clicking the confirmation link
				emailRedirectTo: `${new URL(request.url).origin}/`
			}
		});

		// 1. First, handle any actual errors from Supabase
		if (error) {
			// Using `instanceof` is a good practice for type safety
			if (error instanceof AuthApiError && error.status >= 400 && error.status < 500) {
				return fail(400, {
					message: 'Invalid data. Please check your entries and try again.',
					error: error.message
				});
			}
			return fail(500, {
				message: 'A server error occurred. Please try again later.',
				error: error.message
			});
		}

		// 2. ✅ This is the key: Handle the success case where email confirmation is required
		// If a user was created but a session was not, they need to confirm their email.
		if (data.user && !data.session) {
			throw redirect(303, '/awaiting-confirmation');
		}

		// 3. If a session WAS created (e.g., auto-confirm is on), redirect to home
		redirect(303, '/');
	},

	login: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		//const redirectTo = (url.searchParams.get('redirect') as string) || '/';
		const tabId = formData.get('tabId') as string;
		console.log(tabId);

		// console.log('=== LOGIN DEBUG ===');
		// console.log('Full URL:', url.toString());
		// console.log('URL pathname:', url.pathname);
		// console.log('URL search:', url.search);
		// console.log('URL searchParams:', url.searchParams.toString());
		// console.log('All searchParams:');
		// for (const [key, value] of url.searchParams) {
		// 	console.log(`  ${key}: ${value}`);
		// }

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			console.error('Login error:', error.message);
			// It's better to return a failure than to redirect, so the user can see the error
			return fail(401, {
				message: 'Invalid email or password.'
			});
		}
		//redirect(303, '/'); // Always redirect to homepage
		// Redirect to the tab if a tabId was passed, otherwise to the homepage
		const redirectTo = tabId ? `/tab/${tabId}` : '/';
		redirect(303, redirectTo);
	},

	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/');
	}
};
