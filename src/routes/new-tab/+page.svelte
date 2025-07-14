<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let { user } = $derived(data);

	let loading = $state(false);

	// Form state
	let tabName = $state((form && 'tabName' in form ? (form.tabName as string) : '') || '');
	let description = $state(
		(form && 'description' in form ? (form.description as string) : '') || ''
	);
</script>

<svelte:head>
	<title>Tab Man - New Tab</title>
	<meta name="description" content="Create a new shared expense tab" />
</svelte:head>

{#if user}
	<div class="new-tab-container">
		<div class="header">
			<h1>Create New Tab</h1>
			<p>Start tracking shared expenses with friends</p>
		</div>

		<!-- Error Message -->
		{#if form?.error}
			<div class="error-message">
				{form.error}
			</div>
		{/if}

		<!-- New Tab Form -->
		<form
			action="?/addTab"
			method="post"
			use:enhance={({ formData }) => {
				// Ensure form data has the current values
				formData.set('name', tabName);
				formData.set('description', description);
				
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<div class="form-group">
				<label for="name">Tab Name *</label>
				<input
					id="name"
					name="name"
					type="text"
					placeholder="e.g., Weekend Trip, Dinner Party"
					bind:value={tabName}
					required
					disabled={loading}
					maxlength="100"
				/>
			</div>

			<div class="form-group">
				<label for="description">Description</label>
				<textarea
					id="description"
					name="description"
					placeholder="Optional: Add details about this tab"
					bind:value={description}
					disabled={loading}
					maxlength="500"
					rows="3"
				></textarea>
			</div>

			<button type="submit" disabled={loading} class="add-tab-button">
				{loading ? 'Creating Tab...' : 'Create Tab'}
			</button>
		</form>
	</div>
{:else}
	<div class="auth-required">
		<h1>Sign In Required</h1>
		<p>You need to be signed in to create a new tab.</p>
		<a href="/auth" class="sign-in-btn">Sign In</a>
	</div>
{/if}

<style>
	.new-tab-container {
		max-width: 500px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.header p {
		color: var(--color-text-muted);
		margin: 0;
		font-size: 0.875rem;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: rgb(185, 28, 28);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	form {
		background: var(--color-bg-0);
		border: 1px solid var(--color-bg-2);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-of-type {
		margin-bottom: 2rem;
	}

	label {
		display: block;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 8px;
		font-size: 1rem;
		background: var(--color-bg-0);
		color: var(--color-text);
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
		resize: vertical;
		min-height: auto;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-theme-1);
		box-shadow: 0 0 0 3px rgba(var(--color-theme-1-rgb), 0.1);
	}

	input:disabled,
	textarea:disabled {
		background: var(--color-bg-1);
		cursor: not-allowed;
		opacity: 0.7;
	}

	.add-tab-button {
		width: 100%;
		padding: 0.875rem 1.5rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-tab-button:hover:not(:disabled) {
		background: var(--color-theme-2);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.add-tab-button:disabled {
		background: var(--color-bg-2);
		color: var(--color-text-muted);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	/* Auth Required Styles */
	.auth-required {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 60vh;
		padding: 2rem 1rem;
	}

	.auth-required h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.auth-required p {
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
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.sign-in-btn:hover {
		background: var(--color-theme-2);
		transform: translateY(-1px);
	}

	/* Mobile responsiveness */
	@media (max-width: 479px) {
		.new-tab-container {
			padding: 1rem 0.75rem;
		}

		form {
			padding: 1rem;
		}

		.header h1 {
			font-size: 1.5rem;
		}
	}
</style>
