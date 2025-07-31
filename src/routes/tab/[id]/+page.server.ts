import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	const tabId = params.id;

	try {
		// Get tab details with member info
		const { data: tab, error: tabError } = await supabase
			.from('tabs')
			.select(
				`
                *,
                tab_members(
                    role,
                    joined_at,
                    user_id
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

		// If user is not logged in, show basic tab info with join prompt
		if (!session?.user) {
			return {
				tab: {
					id: tab.id,
					name: tab.name,
					description: tab.description,
					created_at: tab.created_at,
					tab_members: [] // Don't show members to non-authenticated users
				},
				needsAuth: true // Flag to show login prompt
			};
		}

		// Check if user is a member of this tab
		const userIsMember = tab.tab_members.some(
			(member: { user_id: string }) => member.user_id === session.user.id
		);

		if (!userIsMember) {
			return {
				tab: {
					id: tab.id,
					name: tab.name,
					description: tab.description,
					created_at: tab.created_at,
					tab_members: []
				}
			};
		}

		// If user is a member, get full data with profiles
		const memberUserIds = tab.tab_members.map((member: { user_id: string }) => member.user_id);
		const { data: memberProfiles, error: profilesError } = await supabase
			.from('profiles')
			.select('id, email, display_name')
			.in('id', memberUserIds);

		if (profilesError) {
			console.error('Error loading member profiles:', profilesError);
			// Continue without profile data rather than failing completely
		}

		// Merge profile data with tab members
		tab.tab_members = tab.tab_members.map(
			(member: { user_id: string; role: string; joined_at: string }) => ({
				...member,
				profiles: memberProfiles?.find((profile) => profile.id === member.user_id) || {
					id: member.user_id,
					email: 'unknown',
					display_name: null
				}
			})
		);

		// Fetch expense items for this tab (with items and assignments)
		const { data: expenses, error: expenseError } = await supabase
			.from('expenses')
			.select(
				`
				id,
				tab_id,
				place_name,
				created_by,
				created_at,
				subtotal,
				tax_amount,
				tip_amount,
				total_amount,
				expense_items (
					id,
					expense_id,
					name,
					quantity,
					unit_price,
					total_price,
					expense_participants (
						id,
						user_id,
						share_amount,
						created_at,
						profiles ( id, display_name, email )
					)
				)
			`
			)
			.eq('tab_id', tabId)
			.order('created_at', { ascending: false });
		
		console.log(tab.total_price)

		if (expenseError) {
			console.error('Error loading expenses:', expenseError);
			// Return empty array on error to avoid UI crashes
			tab.expenses = [];
		} else {
			// Always return an array, even if empty
			tab.expenses = expenses || [];
		}

		return {
			tab
		};
	} catch (err) {
		if (err instanceof Response) {
			throw err;
		}
		console.error('Unexpected error loading tab:', err);
		throw error(500, 'Failed to load tab');
	}
};

export const actions = {
	join: async ({ params, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session?.user) {
			return fail(401, { error: 'You must be logged in to join this tab' });
		}

		const tabId = params.id;

		try {
			// Check if tab exists
			const { data: tab, error: tabError } = await supabase
				.from('tabs')
				.select('id, name')
				.eq('id', tabId)
				.single();

			if (tabError || !tab) {
				return fail(404, { error: 'Tab not found' });
			}

			// Check if user is already a member
			const { data: existingMember } = await supabase
				.from('tab_members')
				.select('id')
				.eq('tab_id', tabId)
				.eq('user_id', session.user.id)
				.single();

			if (existingMember) {
				return fail(400, { error: 'You are already a member of this tab' });
			}

			// Add user as a member
			const { error: memberError } = await supabase.from('tab_members').insert({
				tab_id: tabId,
				user_id: session.user.id,
				role: 'member'
			});

			if (memberError) {
				console.log('Error adding member:', memberError);
				return fail(500, { error: 'Failed to join tab' });
			}

			return {
				success: true,
				message: `Successfully joined "${tab.name}`
			};
		} catch (err) {
			console.error('Error joining tab: ', err);
			return fail(500, { error: 'Failed to join tab' });
		}
	},

	assignItem: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session?.user) {
			return fail(401, { error: 'You must be logged in to join this tab' });
		}
		const formData = await request.formData();

		const expense_item_id = formData.get('expense_item_id');
		const total_price = formData.get('total_price');

		

		if (!expense_item_id) {
			return fail(400, { error: 'Missing expense item ID' });
		}

		try {
			// Assign the expense item to the user and the expense_participants table
			const { error } = await supabase.from('expense_participants').insert({
				user_id: session.user.id,
				expense_item_id: expense_item_id,
				share_amount: total_price
			});

			if (error) {
				console.log('Error assigning new item:', error);
				return fail(500, { error: 'Failed to assign user' });
			}

			return {
				success: true,
				message: `Successfully assigned user to item ${expense_item_id}`
			};
		} catch (err) {
			console.error('Error assigning expense to user: ', err);
			return fail(500, { error: 'Failed to assign expense to user' });
		}
	},

	unAssignItem: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session?.user) {
			return fail(401, { error: 'You must be logged in to modify assignments' });
		}
		const formData = await request.formData();
		const expense_item_id = formData.get('expense_item_id');

		if (!expense_item_id) {
			return fail(400, { error: 'Missing expense item ID' });
		}

		try {
			// Delete the record from the participants table where the item ID and user ID match
			const { error } = await supabase
				.from('expense_participants')
				.delete()
				.eq('expense_item_id', expense_item_id)
				.eq('user_id', session.user.id); // Ensures users can only un-assign themselves

			if (error) {
				console.error('Error un-assigning item:', error);
				return fail(500, { error: 'Failed to un-assign item' });
			}

			return {
				success: true,
				message: 'Successfully un-assigned item.'
			};
		} catch (err) {
			console.error('Server error un-assigning item: ', err);
			return fail(500, { error: 'A server error occurred.' });
		}
	},

	deleteExpense: async ({ params, request, locals: { supabase } }) => {
		const form = await request.formData();
		const expense_id = form.get('expense_id');
		const tab_id = params.id;

		if (!expense_id) {
			return fail(400, { error: 'Missing expense ID' });
		}

		// Delete expense items first (if you have a foreign key constraint)
		await supabase.from('expense_items').delete().eq('expense_id', expense_id);

		// Delete the expense itself
		const { error } = await supabase.from('expenses').delete().eq('id', expense_id);

		if (error) {
			return fail(500, { error: error.message });
		}

		// Redirect back to the tab page
		throw redirect(303, `/tab/${tab_id}`);
	}
};
