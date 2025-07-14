import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session?.user) {
		throw error(401, 'You must be logged in to view this tab');
	}

	const tabId = params.id;

	try {
		// Get tab details with member info
		const { data: tab, error: tabError } = await supabase
			.from('tabs')
			.select(
				`
                *,
                tab_members!inner (
                    role,
                    joined_at,
                    profiles (
                        id,
                        email,
                        display_name
                    )
                )
            `
			)
			.eq('id', tabId)
			.single();

		if (tabError) {
			console.error('Error loading tab:', tabError);
			throw error(404, 'Tab not found');
		}

		if (!tab) {
			throw error(404, 'Tab not found');
		}

		// Check if user is a member of this tab
		const userIsMember = tab.tab_members.some(
			(member: { profiles: { id: string } }) => member.profiles.id === session.user.id
		);

		if (!userIsMember) {
			throw error(403, 'You do not have access to this tab');
		}

		return {
			tab,
			user: session.user,
			supabase
		};
	} catch (err) {
		if (err instanceof Response) {
			throw err;
		}
		console.error('Unexpected error loading tab:', err);
		throw error(500, 'Failed to load tab');
	}
};
