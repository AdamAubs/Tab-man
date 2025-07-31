import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session?.user) {
		throw error(401, 'You must be logged in to create expenses');
	}

	const tabId = params.id;

	// Get tab details
	const { data: tab, error: tabError } = await supabase
		.from('tabs')
		.select('id, name, description')
		.eq('id', tabId)
		.single();

	if (tabError) {
		throw error(404, 'Tab not found');
	}

	// Check if the user exists
	const { data: membership } = await supabase
		.from('tab_members')
		.select('id')
		.eq('tab_id', tabId)
		.eq('user_id', session.user.id)
		.single();

	if (!membership) {
		throw error(403, 'You must be a member of this tab to add expenses');
	}

	return {
		tab,
		user: session.user
	};
};

export const actions = {
	createExpense: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session?.user) return fail(401, { error: 'Not authenticated' });

		const tabId = params.id;
		const formData = await request.formData();
		const analyzedDataRaw = formData.get('analyzedData');
		if (!analyzedDataRaw) return fail(400, { error: 'No analyzed data provided' });

		let analyzed;
		try {
			analyzed = JSON.parse(analyzedDataRaw as string);
			//console.log(analyzed);
		} catch (e) {
			return fail(400, { error: 'Invalid analyzed data' });
		}

		// Insert expense
		const { data: expense, error: expenseError } = await supabase
			.from('expenses')
			.insert({
				tab_id: tabId,
				place_name: analyzed.merchant || 'Unknown',
				created_by: session.user.id,
				subtotal: analyzed.totals?.subtotal || 0,
				tax_amount: analyzed.totals?.tax || 0,
				tip_amount: analyzed.totals?.tip || 0,
				total_amount: analyzed.totals?.total || 0
			})
			.select()
			.single();

		if (expenseError) return fail(500, { error: 'Failed to create expense' });

		// Insert items
		// Unroll items based on quantity and insert them
		if (analyzed.items?.length) {
			const itemsToInsert = analyzed.items.flatMap((item) => {
				const quantity = Math.max(1, item.quantity || 1);

				// Calculate the price for a single, individual item
				const finalItemPrice = item.totalWithTip ?? item.totalWithTax ?? 0;
				const individualTotalPrice = finalItemPrice / quantity;

				const individualUnitPrice = (item.totalPrice || 0) / quantity;

				// Create an array of items, one for each quantity
				return Array.from({ length: quantity }, () => ({
					expense_id: expense.id,
					name: item.name || 'Item',
					description: item.description || '',
					quantity: 1, // Each database row represents a single item
					unit_price: individualUnitPrice,
					total_price: individualTotalPrice
				}));
			});

			if (itemsToInsert.length > 0) {
				const { error: itemsError } = await supabase.from('expense_items').insert(itemsToInsert);
				if (itemsError) {
					// In a production app, you might want to delete the parent 'expense' record here to avoid orphans
					return fail(500, { error: 'Failed to add items to the expense.' });
				}
			}
		}

		// Redirect to tab page
		throw redirect(303, `/tab/${tabId}`);
	}
};
