<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { Calendar, Share2, Trash, UserPlus, Users } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	let { data, form } = $props();
	let { tab, user, needsAuth } = $derived(data);

	const [send, receive] = crossfade({
		duration: (d) => Math.sqrt(d * 200),
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;
			return {
				duration: 600,
				easing: quintOut,
				css: (t) => `
                    transform: ${transform} scale(${t});
                    opacity: ${t}
                `
			};
		}
	});

	// Check if current user is a member
	let isCurrentUserMember = $derived(tab.tab_members.some((member) => member.user_id === user?.id));

	let joinLoading = $state(false);

	function copyShareLink() {
		const shareUrl = `${window.location.origin}/tab/${tab.id}`;
		navigator.clipboard.writeText(shareUrl);
		alert('Share link copied to clipboard!');
	}

	function handleDeleteExpense(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		form.submit();
	}

	// 1. Use two arrays for better optimistic updates
	let optimisticallyAssignedIds = $state<string[]>([]);
	let optimisticallyUnassignedIds = $state<string[]>([]);

	// 2 Create handlers for both actions
	function handleAssign(item: { id: string }) {
		optimisticallyAssignedIds = [...optimisticallyAssignedIds, item.id];
		optimisticallyUnassignedIds = optimisticallyUnassignedIds.filter((id) => id !== item.id);
	}

	function handleUnassign(item: { id: string }) {
		optimisticallyUnassignedIds = [...optimisticallyUnassignedIds, item.id];
		optimisticallyAssignedIds = optimisticallyAssignedIds.filter((id) => id !== item.id);
	}

	// Add this to your <script> section
	let myTotal = $derived(
		(tab.expenses || [])
			.flatMap((e) => e.expense_items)
			.filter((item) => {
				const isAssignedOnServer = item.expense_participants?.some((p) => p.user_id === user?.id);
				const isOptimisticallyAssigned = optimisticallyAssignedIds.includes(item.id);
				const isOptimisticallyUnassigned = optimisticallyUnassignedIds.includes(item.id);

				// Include the item if it's assigned and not pending un-assignment, OR if it's pending assignment.
				return (isAssignedOnServer && !isOptimisticallyUnassigned) || isOptimisticallyAssigned;
			})
			.reduce((sum, item) => sum + (item.total_price || 0), 0)
	);

	// 3. Reset both optimistic arrays after the server responds
	$effect(() => {
		if (form?.success) {
			optimisticallyAssignedIds = [];
			optimisticallyUnassignedIds = [];
		}
	});

	// --- REALTIME LOGIC ---
	onMount(() => {
		// Create a unique channel for this specific tab
		const channel = supabase.channel(`tab-room-${tab.id}`);

		channel
			.on(
				'postgres_changes',
				{
					event: '*', // Listen for INSERT, UPDATE, DELETE
					schema: 'public',
					table: 'expense_participants'
				},
				(payload) => {
					//console.log('Change received!', payload);
					// When a change happens, invalidate all data.
					// SvelteKit will re-run the `load` function automatically.
					invalidateAll();
				}
			)
			.subscribe();

		// Return a cleanup function to unsubscribe when the component is destroyed
		return () => {
			supabase.removeChannel(channel);
		};
	});
</script>

<svelte:head>
	<title>{tab.name} - Tab Man</title>
	<meta name="description" content="Shared expense tab: {tab.name}" />
</svelte:head>

<div class="tab-container">
	<!-- Tab Header -->
	<div class="tab-header">
		<div class="tab-info">
			<h1>{tab.name}</h1>
			{#if tab.description}
				<p class="description">{tab.description}</p>
			{/if}
			<div class="tab-meta">
				<div class="meta-item">
					<Users size={16} />
					<span>{tab.tab_members.length} members</span>
				</div>
				<div class="meta-item">
					<Calendar size={16} />
					<span>Created {new Date(tab.created_at).toLocaleDateString()}</span>
				</div>
			</div>
		</div>

		<div class="tab-actions">
			{#if needsAuth}
				<!-- Login prompt for non-authenticated users -->
				<a href="/auth?redirect=/tab/{tab.id}" class="login-btn">
					<UserPlus size={16} />
					<span>Login to Join</span>
				</a>
			{:else if !isCurrentUserMember}
				<!-- Join Button for authenticated non-members -->
				<form action="?/join" method="post">
					<button type="submit" class="join-btn" disabled={joinLoading}>
						<UserPlus size={16} />
						<span>{joinLoading ? 'Joining...' : 'Join Tab'}</span>
					</button>
				</form>
			{/if}

			<button class="share-btn" onclick={copyShareLink}>
				<Share2 size={16} />
				<span>Share</span>
			</button>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="success-message">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="error-message">
			{form.error}
		</div>
	{/if}

	<!-- Members Section - only show to members -->
	{#if !needsAuth && isCurrentUserMember}
		<div class="members-section">
			<h2>Members</h2>
			<div class="members-list">
				{#each tab.tab_members as member (member.profiles.id)}
					<div class="member-card">
						<div class="member-info">
							<div class="member-name">
								{member.profiles.display_name || member.profiles.email}
							</div>
							<div class="member-email">{member.profiles.email}</div>
						</div>
						<div class="member-role">
							{member.role}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Assignment Section -->
		<!-- {#if !needsAuth && isCurrentUserMember} -->
		<div class="items-section">
			<h2>My Assigned Items</h2>
			<ul>
				{#each tab.expenses
					.flatMap((e) => e.expense_items)
					.filter( (item) => item.expense_participants?.some((p) => p.user_id === user?.id) ) as item (item.id)}
					<li in:receive={{ key: item.id }} out:send={{ key: item.id }} class="expense-item">
						<div class="item-info">
							<span class="item-name">{item.name}</span>
							<span class="item-total">{item.total_price?.toFixed(2) ?? '0.00'}</span>
						</div>
						<!-- Un-assignment button  -->
						<form
							method="post"
							action="?/unAssignItem"
							class="assign-form"
							use:enhance={() => {
								handleUnassign(item);
								return async ({ update }) => {
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="expense_item_id" value={item.id} />
							<input type="hidden" name="expense_id" value={item.expense_id} />
							<input type="hidden" name="total_price" value={item.total_price} />
							<button type="submit" class="assign-btn">Un-assign</button>
						</form>
					</li>
				{/each}
				<div class="expense-card my-total-card">
					<div class="expense-header">
						<h3>My Total</h3>
					</div>
					<div class="expense-summary">
						<div class="expense-total">
							<strong>Total Due:</strong>
							<span>${myTotal.toFixed(2)}</span>
						</div>
					</div>
				</div>
			</ul>
		</div>

		<!-- Items/Expenses Section -->
		<div class="items-section">
			<h2>Expenses</h2>
			{#if tab.expenses.length === 0}
				<div class="items-placeholder">
					<p>No expenses added yet. This is where tab items will be displayed.</p>
					<a href="/tab/{tab.id}/expense/new" class="add-item-btn">Add First Expense</a>
				</div>
			{:else}
				{#each tab.expenses as expense (expense.id)}
					<div class="expense-card">
						<div class="expense-header">
							<h3>Expense {expense.place_name}</h3>

							<span class="expense-date">{new Date(expense.created_at).toLocaleString()}</span>
						</div>
						<form
							action="?/deleteExpense"
							method="post"
							style="display:inline;"
							onsubmit={handleDeleteExpense}
						>
							<input type="hidden" name="expense_id" value={expense.id} />
							<button type="submit" class="delete-expense-btn" aria-label="Delete Expense">
								<Trash size={18} />
							</button>
						</form>
						<div class="expense-summary">
							<div>
								<span>Subtotal:</span> ${expense.subtotal?.toFixed(2) ?? '0.00'}
							</div>
							<div>
								<span>Tax:</span> ${expense.tax_amount?.toFixed(2) ?? '0.00'}
							</div>
							<div>
								<span>Tip:</span> ${expense.tip_amount?.toFixed(2) ?? '0.00'}
							</div>
							<div class="expense-total">
								<strong>Total:</strong> ${expense.total_amount?.toFixed(2) ?? '0.00'}
							</div>
						</div>
						{#if expense.expense_items && expense.expense_items.length > 0}
							<ul class="expense-items-list">
								{#each expense.expense_items as item (item.id)}
									<li
										in:receive={{ key: item.id }}
										out:send={{ key: item.id }}
										class="expense-item"
									>
										<div class="item-info">
											<span class="item-name">{item.name}</span>
											<span class="item-total">= ${item.total_price?.toFixed(2) ?? '0.00'}</span>
										</div>

										<div class="assignment-status">
											{#if item.expense_participants?.length === 0}
												<form
													method="post"
													action="?/assignItem"
													class="assign-form"
													use:enhance={() => handleAssign(item)}
												>
													<input type="hidden" name="expense_item_id" value={item.id} />
													<input type="hidden" name="total_price" value={item.total_price} />
													<button type="submit" class="assign-btn">Assign to Me</button>
												</form>
											{:else if item.expense_participants.some((p) => p.user_id === user?.id)}
												<form
													method="post"
													action="?/unAssignItem"
													class="assign-form"
													use:enhance={() => handleUnassign(item)}
												>
													<input type="hidden" name="expense_item_id" value={item.id} />
													<button type="submit" class="assign-btn unassign">Un-assign</button>
												</form>
											{:else}
												<div class="assigned-to-other">
													Assigned to: {item.expense_participants[0]?.profiles?.display_name ||
														'...'}
												</div>
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="no-items">No items for this expense.</p>
						{/if}
					</div>
				{/each}
				<div class="items-placeholder">
					<a href="/tab/{tab.id}/expense/new" class="add-item-btn">Add Expense</a>
				</div>
			{/if}
		</div>
	{:else}
		<div class="join-prompt">
			<h3>Join this tab to view expenses and members</h3>
			<p>Share expenses and split costs with your group.</p>
			{#if needsAuth}
				<a href="/auth" class="login-link">Login to continue</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tab-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 1rem;
	}

	.tab-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--color-bg-0);
		border: 1px solid var(--color-bg-2);
		border-radius: 12px;
	}

	.tab-info h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.description {
		color: var(--color-text-muted);
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.tab-meta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.meta-item :global(svg) {
		color: var(--color-text-muted);
	}

	.share-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.share-btn:hover {
		background: var(--color-theme-2);
		transform: translateY(-1px);
	}

	.members-section,
	.items-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--color-bg-0);
		border: 1px solid var(--color-bg-2);
		border-radius: 12px;
	}

	.members-section h2,
	.items-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 1rem 0;
	}

	.members-list {
		display: grid;
		gap: 0.75rem;
	}

	.member-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--color-bg-1);
		border-radius: 8px;
	}

	.member-name {
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.member-email {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.member-role {
		padding: 0.25rem 0.75rem;
		background: var(--color-theme-1);
		color: white;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.items-placeholder {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-muted);
	}

	.items-placeholder p {
		margin: 0 0 1rem 0;
	}

	.add-item-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-item-btn:hover {
		background: var(--color-theme-2);
		transform: translateY(-1px);
	}

	.join-btn {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 8px 16px;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.join-btn:hover:not(:disabled) {
		background: #059669;
	}

	.join-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.success-message {
		background: #d1fae5;
		color: #065f46;
		padding: 10px 15px;
		border-radius: 6px;
		margin-bottom: 20px;
	}

	.error-message {
		background: #fee2e2;
		color: #991b1b;
		padding: 10px 15px;
		border-radius: 6px;
		margin-bottom: 20px;
	}

	.join-prompt {
		text-align: center;
		padding: 40px;
		background: #f9fafb;
		border: 1px dashed #d1d5db;
		border-radius: 8px;
		color: #6b7280;
	}
	.expense-card {
		background: var(--color-bg-1);
		border-radius: 10px;
		box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.03);
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--color-bg-2);
	}

	.expense-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.expense-header h3 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.expense-date {
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.delete-expense-btn {
		background: none;
		border: none;
		color: var(--color-bg-0);
		font-size: 1.2rem;
		cursor: pointer;
		margin-left: 1rem;
		transition: color 0.2s;
		background-color: var(--color-theme-1);
		padding: 5px;
		border-radius: 5px;
	}
	.delete-expense-btn:hover {
		color: #b91c1c;
	}

	.expense-summary {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
		font-size: 0.98rem;
		color: var(--color-text-muted);
	}

	.expense-summary span {
		font-weight: 500;
		color: var(--color-text);
		margin-right: 0.25rem;
	}

	.expense-total {
		color: var(--color-theme-1);
		font-weight: 700;
	}

	.expense-items-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}

	.expense-item {
		/* display: flex;
		justify-content: space-between;
		align-items: center; */
		background: var(--color-bg-0);
		border-radius: 7px;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-bg-2);
		transition: box-shadow 0.15s;
		/* Make space for the new status block */
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
	}

	.expense-item:hover {
		box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
	}

	.item-info {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		font-size: 1rem;
	}

	.item-name {
		font-weight: 600;
		color: var(--color-text);
	}

	.item-mult,
	.item-unit,
	.item-total {
		color: var(--color-text-muted);
		font-size: 0.98rem;
	}

	.assign-form {
		margin: 0;
	}

	.assign-btn {
		padding: 0.4rem 1rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.18s,
			transform 0.18s;
	}

	.assign-btn:hover {
		background: var(--color-theme-2);
		transform: translateY(-1px) scale(1.03);
	}

	.assign-btn.unassign {
		background-color: var(--color-bg-2);
		color: var(--color-text);
	}
	.assigned-to-other {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		padding: 0.4rem 1rem;
		font-style: italic;
	}

	.no-items {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0.5rem 0 0 0;
	}

	.my-total-card {
		background: var(--color-bg-2);
		border-color: var(--color-theme-1);
	}

	.my-total-card .expense-total span {
		font-size: 1.2rem;
		margin-left: 0.5rem;
	}

	/* Mobile responsiveness */
	@media (max-width: 767px) {
		.tab-header {
			flex-direction: column;
			gap: 1rem;
		}

		.tab-actions {
			align-self: stretch;
		}

		.share-btn {
			width: 100%;
			justify-content: center;
		}

		.tab-meta {
			flex-direction: column;
			gap: 0.5rem;
		}

		.member-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.expense-card {
			padding: 1rem 0.5rem;
		}

		.expense-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.expense-header h3 {
			font-size: 1rem;
		}

		.expense-summary {
			flex-direction: column;
			gap: 0.5rem;
			font-size: 0.95rem;
		}

		.expense-items-list {
			gap: 0.25rem;
		}

		.expense-item {
			flex-direction: column;
			align-items: stretch;
			padding: 0.6rem 0.5rem;
			gap: 0.5rem;
		}

		.item-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
			font-size: 0.98rem;
		}

		.assign-btn {
			width: 100%;
			padding: 0.5rem 0;
			font-size: 1rem;
		}
	}
</style>
