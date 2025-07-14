<script lang="ts">
	import { Plus, Users, X } from 'lucide-svelte';
	
	let { isOpen = false, onClose } = $props();

	// Mock tabs data - should match the data in +page.svelte
	// TODO: Pass this data as a prop or load from a shared store
	const tabs = [
		{
			id: 1,
			name: "Weekend Getaway",
			description: "Trip to the mountains",
			member_count: 4,
			total_amount: 245.67,
			place: "Aspen, CO"
		},
		{
			id: 2,
			name: "Dinner Party",
			description: "Birthday celebration",
			member_count: 6,
			total_amount: 89.23,
			place: "Mario's Restaurant"
		},
		{
			id: 3,
			name: "Office Lunch",
			description: "Team lunch",
			member_count: 8,
			total_amount: 156.80,
			place: "Downtown Cafe"
		}
	];

	function handleBackdropClick() {
		onClose();
	}

	function handleTabClick(tabId: number) {
		// TODO: Navigate to tab details page
		console.log('Navigate to tab:', tabId);
		onClose();
	}

	function handleCreateTab() {
		// TODO: Navigate to create tab page
		console.log('Navigate to create tab');
		onClose();
	}
</script>

<!-- Backdrop - only shows when sidebar is open  -->
{#if isOpen}
	<button
		type="button"
		class="backdrop"
		aria-label="Close sidebar"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') handleBackdropClick();
		}}
		tabindex="0"
	></button>
{/if}

<!-- Sidebar - always in DOM but slides in/out  -->
<aside class="sidebar" class:open={isOpen}>
	<header class="sidebar-header">
		<h2>Your Tabs</h2>
		<button class="close-btn" onclick={onClose} aria-label="Close sidebar">
			<X size={20} />
		</button>
	</header>

	<div class="tabs-list">
		{#each tabs as tab (tab.id)}
			<button class="tab-item" onclick={() => handleTabClick(tab.id)}>
				<div class="tab-info">
					<div class="tab-header">
						<h3>{tab.name}</h3>
						<span class="tab-amount">${tab.total_amount.toFixed(2)}</span>
					</div>
					<p class="tab-description">{tab.description}</p>
					<div class="tab-meta">
						<Users size={12} />
						<span>{tab.member_count} members</span>
					</div>
				</div>
			</button>
		{/each}
	</div>

	<footer class="sidebar-footer">
		<button class="create-tab-btn" onclick={handleCreateTab}>
			<Plus size={16} />
			<span>Create New Tab</span>
		</button>
	</footer>
</aside>

<style>
	.backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 998;
		border: none;
		cursor: pointer;
	}

	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		width: 320px;
		height: 100%;
		background: var(--color-bg-0);
		border-right: 1px solid var(--color-bg-2);
		transform: translateX(-100%);
		transition: transform 0.3s ease;
		z-index: 999;
		display: flex;
		flex-direction: column;
		box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
	}

	.sidebar.open {
		transform: translateX(0);
	}

	.sidebar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1rem;
		border-bottom: 1px solid var(--color-bg-2);
		background: var(--color-bg-1);
	}

	.sidebar-header h2 {
		margin: 0;
		color: var(--color-text);
		font-size: 1.125rem;
		font-weight: 600;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: var(--color-text-muted);
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: var(--color-bg-2);
		color: var(--color-text);
	}

	.tabs-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.tab-item {
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		padding: 1rem;
		cursor: pointer;
		border-bottom: 1px solid var(--color-bg-1);
		transition: background-color 0.2s ease;
	}

	.tab-item:hover {
		background: var(--color-bg-1);
	}

	.tab-item:last-child {
		border-bottom: none;
	}

	.tab-info {
		width: 100%;
	}

	.tab-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 0.375rem;
	}

	.tab-header h3 {
		margin: 0;
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.4;
		flex: 1;
		padding-right: 0.5rem;
	}

	.tab-amount {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-theme-1);
		white-space: nowrap;
	}

	.tab-description {
		margin: 0 0 0.5rem 0;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		line-height: 1.3;
	}

	.tab-meta {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	.tab-meta :global(svg) {
		color: var(--color-text-muted);
	}

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--color-bg-2);
		background: var(--color-bg-1);
	}

	.create-tab-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.create-tab-btn:hover {
		background: var(--color-theme-2);
		transform: translateY(-1px);
	}

	/* Mobile responsive */
	@media (max-width: 480px) {
		.sidebar {
			width: 90vw;
			max-width: 300px;
		}
	}
</style>
