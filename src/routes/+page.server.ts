export const load = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	// If user is not logged in, return empty data
	if (!session?.user) {
		return {
			tabs: []
		};
	}

	try {
		// Get tabs where the current user is a member
		const { data: tabs, error: tabsError } = await supabase
			.from('tabs')
			.select(
				`
                id,
                name,
                description,
                created_at,
                total_amount,
                status,
                tab_members!inner(
                    role,
                    joined_at,
                    user_id
                )
            `
			)
			.eq('tab_members.user_id', session.user.id)
			.order('created_at', { ascending: false });

		if (tabsError) {
			console.log('Error fetching tabs: ', tabsError);
			return {
				tabs: []
			};
		}

		console.log(tabs);

		// Transform the data to make it easier to work with
		const transformedTabs =
			tabs?.map((tab) => ({
				id: tab.id,
				name: tab.name,
				description: tab.description,
				created_at: tab.created_at,
				total_amount: tab.total_amount || 0,
				status: tab.status,
				member_count: tab.tab_members.length,
				user_role:
					tab.tab_members.find((member) => member.user_id === session.user.id)?.role || 'member'
			})) || [];

		return {
			tabs: transformedTabs
		};
	} catch (error) {
		console.error('Unexpected error fetching tabs', error);
		return {
			tabs: []
		};
	}
};
