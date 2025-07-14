<script lang="ts">
	import { Menu, User, LogOut } from 'lucide-svelte';
	import Sidebar from '../lib/components/Sidebar.svelte';

	let { user } = $props();

	let sidebarOpen = $state(false);
	let userMenuOpen = $state(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
		userMenuOpen = false; // Close user menu when opening sidebar
	}

	function closeSidebar() {
		sidebarOpen = false;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
		sidebarOpen = false; // Close sidebar when opening user menu
	}

	// Close menus when clicking outside
	function handleOutsideClick() {
		userMenuOpen = false;
	}
</script>

<svelte:window onclick={handleOutsideClick} />

<header>
	<div class="header-left">
		{#if user}
			<button class="menu-btn" onclick={toggleSidebar} aria-label="Open sidebar">
				<Menu size={24} />
			</button>
		{/if}
		
		<div class="logo">
			<a href="/">Tab Man</a>
		</div>
	</div>

	<div class="header-right">
		{#if user}
			<div class="user-menu-container">
				<button 
					class="user-menu-btn" 
					onclick={toggleUserMenu}
					aria-label="User menu"
					class:active={userMenuOpen}
				>
					<User size={20} />
				</button>
				
				{#if userMenuOpen}
					<div 
						class="user-menu" 
						onclick={(e) => e.stopPropagation()}
						onkeydown={(e) => {
							if (e.key === 'Escape') userMenuOpen = false;
						}}
						role="menu"
						tabindex="-1"
					>
						<div class="user-info">
							<div class="user-email">{user.email}</div>
							{#if user.user_metadata?.display_name}
								<div class="user-name">{user.user_metadata.display_name}</div>
							{/if}
						</div>
						<hr />
						<form method="POST" action="/auth?/logout">
							<button type="submit" class="logout-btn">
								<LogOut size={16} />
								<span>Sign Out</span>
							</button>
						</form>
					</div>
				{/if}
			</div>
		{:else}
			<a href="/auth" class="sign-in-link">Sign In</a>
		{/if}
	</div>

	<Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
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

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: none;
		border: none;
		color: var(--color-text);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.menu-btn:hover {
		background: var(--color-bg-1);
		color: var(--color-theme-1);
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

	.header-right {
		display: flex;
		align-items: center;
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
		transform: translateY(-1px);
	}

	.user-menu-container {
		position: relative;
	}

	.user-menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: none;
		border: none;
		color: var(--color-text);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.user-menu-btn:hover,
	.user-menu-btn.active {
		background: var(--color-bg-1);
		color: var(--color-theme-1);
	}

	.user-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 200px;
		background: var(--color-bg-0);
		border: 1px solid var(--color-bg-2);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		padding: 0.75rem 0;
		z-index: 1000;
	}

	.user-info {
		padding: 0.5rem 1rem 0.75rem;
	}

	.user-email {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.user-name {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.user-menu hr {
		margin: 0.5rem 0;
		border: none;
		border-top: 1px solid var(--color-bg-2);
	}

	.user-menu form {
		margin: 0;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 1rem;
		background: none;
		border: none;
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
		text-align: left;
	}

	.logout-btn:hover {
		background: var(--color-bg-1);
		color: rgb(185, 28, 28);
	}

	.logout-btn :global(svg) {
		color: inherit;
	}

	/* Mobile responsiveness */
	@media (max-width: 479px) {
		header {
			padding: 0 0.75rem;
		}
		
		.logo {
			font-size: 1.125rem;
		}
		
		.user-menu {
			right: -0.5rem;
			min-width: 180px;
		}
	}
</style>
