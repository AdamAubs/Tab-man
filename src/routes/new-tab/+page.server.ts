import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	addTab: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		// Check if user is authenticated
		if (!session?.user) {
			return fail(401, { error: 'You must be logged in to create a tab' });
		}

		console.log('User name: ', session);
		console.log('User ID:', session.user.id);
		console.log('User email:', session.user.email);

		const formData = await request.formData();
		const tabName = formData.get('name') as string;
		const description = formData.get('description') as string;

		// Basic validation
		if (!tabName?.trim()) {
			return fail(400, { error: 'Tab name is required', tabName, description });
		}

		if (tabName.length > 100) {
			return fail(400, { error: 'Tab name must be 100 characters or less', tabName, description });
		}

		if (description && description.length > 500) {
			return fail(400, {
				error: 'Description must be 500 characters or less',
				tabName,
				description
			});
		}

		// Insert the new tab
		const tabData = {
			name: tabName.trim(),
			description: description?.trim() || null,
			created_by: session.user.id
		};

		const { data: newTab, error: tabError } = await supabase
			.from('tabs')
			.insert(tabData)
			.select('id')
			.single();

		if (tabError) {
			console.error('Error creating tab:', tabError);
			return fail(500, { error: 'Failed to create tab', tabName, description });
		}

		// Add the creator as the owner in tab_members
		const { error: memberError } = await supabase.from('tab_members').insert({
			tab_id: newTab.id,
			user_id: session.user.id,
			role: 'owner'
		});


		if (memberError) {
			console.error('Error adding tab member:', memberError);
			// Note: The tab was created but adding member failed
			// In a production app, you might want to implement transaction rollback
			return fail(500, {
				error: 'Tab created but failed to set permissions',
				tabName,
				description
			});
		}

		// Success! Redirect to the new tab
		throw redirect(303, `/tab/${newTab.id}`);
	}
};
