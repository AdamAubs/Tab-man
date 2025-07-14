<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import '../app.css';
	import Header from './Header.svelte';

	let { children, data } = $props();
	let { session, supabase } = $derived(data);
	let user = $derived(session?.user);

	let isAuthPage = $derived(page.url.pathname.startsWith('/auth'));

	onMount(() => {
		const { data: authListener } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => authListener.subscription.unsubscribe();
	});
</script>

<div class="app">
	{#if !isAuthPage}
		<Header {user} />
	{/if}

	<main class:full-height={isAuthPage}>
		{@render children()}
	</main>

	{#if !isAuthPage}
		<footer>
			<p>Who got the tab?</p>
		</footer>
	{/if}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
