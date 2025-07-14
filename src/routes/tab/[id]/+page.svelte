<script lang="ts">
	import { Calendar, Share2, Users } from 'lucide-svelte';

	let { data } = $props();
	let { tab } = $derived(data);

	function copyShareLink() {
		const shareUrl = `${window.location.origin}/join/${tab.id}`;
		navigator.clipboard.writeText(shareUrl);
		// TODO: Add toast notification
		alert('Share link copied to clipboard!');
	}
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
			<button class="share-btn" onclick={copyShareLink}>
				<Share2 size={16} />
				<span>Share</span>
			</button>
		</div>
	</div>

	<!-- Members Section -->
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

	<!-- Items/Expenses Section (placeholder for now) -->
	<div class="items-section">
		<h2>Expenses</h2>
		<div class="items-placeholder">
			<p>No expenses added yet. This is where tab items will be displayed.</p>
			<button class="add-item-btn">Add First Expense</button>
		</div>
	</div>
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
	}
</style>
