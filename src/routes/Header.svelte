<script lang="ts">
	import { LogOut } from 'lucide-svelte';

	let { user } = $props();
</script>

<header>
	<div class="header-left">
		<div class="logo">
			<a href="/">Tab Man</a>
		</div>
	</div>

	<div class="header-right">
		{#if user}
			<form method="POST" action="/auth?/logout">
				<button type="submit" class="sign-out-btn">
					<LogOut size={18} />
					<span>Sign Out</span>
				</button>
			</form>
		{:else}
			<a href="/auth" class="sign-in-link">Sign In</a>
		{/if}
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 1rem;
		height: 4rem;
		background: var(--color-bg-0);
		border-bottom: 1px solid var(--color-bg-2);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-left,
	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-theme-1);
	}

	.logo a {
		text-decoration: none;
		color: inherit;
	}

	.sign-in-link {
		padding: 0.5rem 1rem;
		background: var(--color-theme-1);
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.sign-in-link:hover {
		background: var(--color-theme-2);
	}

	/* Style for the new, simple sign-out button */
	.sign-out-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: 1px solid transparent;
		color: var(--color-text-muted);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.sign-out-btn:hover {
		background: var(--color-bg-1);
		border-color: var(--color-bg-2);
		color: var(--color-text);
	}

	/* Mobile responsiveness */
	@media (max-width: 479px) {
		header {
			padding: 0 0.75rem;
		}

		.logo {
			font-size: 1.125rem;
		}
	}
</style>
