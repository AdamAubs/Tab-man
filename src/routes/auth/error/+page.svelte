<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Authentication Error - Tab Man</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card error-card">
		<h1>Authentication Error</h1>
		<p>Something went wrong during authentication. Please try again.</p>

		<div class="button-group">
			<button onclick={() => goto('/auth')} class="primary-button"> Try Again </button>
			<button onclick={() => goto('/')} class="secondary-button"> Go Home </button>
		</div>
	</div>
</div>

<style>
	.auth-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 80vh;
		padding: 2rem;
	}

	.auth-card {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 400px;
		text-align: center;
	}

	.error-card {
		border: 2px solid #f87171;
		background: #fef2f2;
	}

	h1 {
		margin-bottom: 1rem;
		color: #dc2626;
	}

	p {
		margin-bottom: 2rem;
		color: #6b7280;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		flex-direction: column;
	}

	.primary-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}

	.primary-button:hover {
		background: #2563eb;
	}

	.secondary-button {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}

	.secondary-button:hover {
		background: #e5e7eb;
	}
</style>
