<script lang="ts">
	import { CreditCard, Plus, Users } from 'lucide-svelte';

	let { data } = $props();
	let { user, tabs } = $derived(data);
</script>

<svelte:head>
	<title>Tab Man - Your Tabs</title>
	<meta name="description" content="Manage your shared expense tabs" />
</svelte:head>

{#if user}
	<div class="dashboard">
		<!-- Welcome Header -->
		<div class="welcome-header">
			<h1>Your Tabs</h1>
			<p>Manage your shared expenses</p>
		</div>

		<!-- Create New Tab Button -->
		<a href="/new-tab" class="create-tab-btn">
			<Plus size={20} />
			<span>Create New Tab</span>
		</a>

		<!-- Tabs Grid -->
		<div class="tabs-grid">
			{#each tabs as tab (tab.id)}
				<a href="/tab/{tab.id}" class="tab-card">
					<div class="tab-header">
						<h3>{tab.name}</h3>
						<span class="tab-amount">${tab.total_amount.toFixed(2)}</span>
					</div>
					<p class="tab-description">{tab.description || 'No description'}</p>
					<div class="tab-meta">
						<div class="meta-item">
							<Users size={14} />
							<span>{tab.member_count} members</span>
						</div>
						<div class="meta-item">
							<span class="role-badge role-{tab.user_role}">{tab.user_role}</span>
						</div>
					</div>
				</a>
			{:else}
				<!-- Empty state -->
				<div class="empty-state">
					<p>No tabs yet. Create your first tab to get started!</p>
					<a href="/new-tab" class="create-first-tab-btn">
						<Plus size={16} />
						Create First Tab
					</a>
				</div>
			{/each}
		</div>

		<!-- Debug Info (temporary) -->
		<div class="debug-section">
			<details>
				<summary>Debug Info</summary>
				<div class="auth-status success">
					Logged in as: <strong>{user.email}</strong>
					{#if user.user_metadata?.display_name}
						<br />Display Name: <strong>{user.user_metadata.display_name}</strong>
					{/if}
					<br />
					<form method="POST" action="/auth?/logout" style="display: inline; margin-top: 0.5rem;">
						<button type="submit" class="logout-btn">Logout</button>
					</form>
					<a href="/debug" class="debug-link">Full Debug Info</a>
				</div>
			</details>
		</div>
	</div>
{:else}
	<!-- Not authenticated view -->
	<div class="auth-prompt">
		<div class="auth-card">
			<div class="auth-icon">
				<CreditCard size={48} />
			</div>
			<h1>Welcome to Tab Man</h1>
			<p>Split expenses easily with friends and family</p>
			<a href="/auth" class="sign-in-btn">Sign In to Get Started</a>
		</div>
	</div>
{/if}

<style>
	.dashboard {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.welcome-header {
		margin-bottom: 1.5rem;
	}

	.welcome-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.25rem 0;
	}

	.welcome-header p {
		color: var(--color-text-muted);
		margin: 0;
		font-size: 0.875rem;
	}

	.create-tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.25rem;
		background: var(--color-theme-1);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.create-tab-btn:hover {
		background: var(--color-theme-2);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.tabs-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 640px) {
		.tabs-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.tabs-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.tab-card {
		background: var(--color-bg-0);
		border: 1px solid var(--color-bg-2);
		border-radius: 12px;
		padding: 1rem;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.tab-card:hover {
		border-color: var(--color-theme-1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.tab-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 0.5rem;
	}

	.tab-header h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
		line-height: 1.4;
	}

	.tab-amount {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-theme-1);
		white-space: nowrap;
	}

	.tab-description {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	.tab-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	.meta-item :global(svg) {
		color: var(--color-text-muted);
	}

	/* Auth Prompt Styles */
	.auth-prompt {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem 1rem;
	}

	.auth-card {
		text-align: center;
		max-width: 400px;
		padding: 2rem;
		background: var(--color-bg-0);
		border: 1px solid var(--color-bg-2);
		border-radius: 16px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
	}

	.auth-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
		color: var(--color-theme-1);
	}

	.auth-card h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.auth-card p {
		color: var(--color-text-muted);
		margin: 0 0 2rem 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.sign-in-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.875rem 1.5rem;
		background: var(--color-theme-1);
		color: white;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.sign-in-btn:hover {
		background: var(--color-theme-2);
		transform: translateY(-1px);
	}

	/* Debug Section */
	.debug-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-bg-2);
	}

	.debug-section details {
		margin-bottom: 1rem;
	}

	.debug-section summary {
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.auth-status {
		background: var(--color-bg-1);
		border: 1px solid var(--color-bg-2);
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.auth-status.success {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.2);
		color: rgb(21, 128, 61);
	}

	.logout-btn {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: rgb(185, 28, 28);
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		cursor: pointer;
		margin-right: 0.5rem;
	}

	.logout-btn:hover {
		background: rgba(239, 68, 68, 0.2);
	}

	.debug-link {
		color: var(--color-theme-1);
		text-decoration: none;
		font-size: 0.75rem;
	}

	.debug-link:hover {
		text-decoration: underline;
	}
</style>
