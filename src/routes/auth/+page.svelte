<script lang="ts">
	import { enhance } from '$app/forms';

	let isLogin = true;
	let loading = false;
</script>

<svelte:head>
	<title>{isLogin ? 'Login' : 'Sign Up'} - Tab Man</title>
	<meta name="description" content="{isLogin ? 'Login to' : 'Create your'} Tab Man account" />
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-tabs">
			<button class="tab-button" class:active={isLogin} onclick={() => (isLogin = true)}>
				Login
			</button>
			<button class="tab-button" class:active={!isLogin} onclick={() => (isLogin = false)}>
				Sign Up
			</button>
		</div>

		{#if isLogin}
			<!-- Login Form -->
			<div class="auth-form">
				<h1>Welcome Back</h1>
				<p>Sign in to your Tab Man account</p>

				<form
					method="POST"
					action="?/login"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<div class="form-group">
						<label for="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							placeholder="Enter your email"
							required
							disabled={loading}
						/>
					</div>

					<div class="form-group">
						<label for="password">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							placeholder="Enter your password"
							required
							disabled={loading}
						/>
					</div>

					<button type="submit" disabled={loading} class="auth-button">
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</form>

				<div class="auth-footer">
					<p>
						Don't have an account?
						<button type="button" onclick={() => (isLogin = false)} class="link-button">Sign up here</button>
					</p>
				</div>
			</div>
		{:else}
			<!-- Signup Form -->
			<div class="auth-form">
				<h1>Join Tab Man</h1>
				<p>Create your account to start splitting bills</p>

				<form
					method="POST"
					action="?/signup"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<div class="form-group">
						<label for="displayName">Display Name</label>
						<input
							id="displayName"
							name="displayName"
							type="text"
							placeholder="Enter your name"
							required
							disabled={loading}
						/>
					</div>

					<div class="form-group">
						<label for="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							placeholder="Enter your email"
							required
							disabled={loading}
						/>
					</div>

					<div class="form-group">
						<label for="password">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							placeholder="Create a password (min 6 characters)"
							minlength="6"
							required
							disabled={loading}
						/>
					</div>

					<button type="submit" disabled={loading} class="auth-button">
						{loading ? 'Creating account...' : 'Sign Up'}
					</button>
				</form>

				<div class="auth-footer">
					<p>
						Already have an account?
						<button type="button" onclick={() => (isLogin = true)} class="link-button">Sign in here</button>
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
		padding: 2rem;
	}

	.auth-card {
		background: white;
		padding: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 400px;
	}

	.auth-tabs {
		display: flex;
		margin-bottom: 2rem;
		border-bottom: 1px solid #eee;
	}

	.tab-button {
		flex: 1;
		padding: 0.75rem;
		border: none;
		background: none;
		color: #666;
		font-size: 1rem;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.tab-button.active {
		color: #007bff;
		border-bottom-color: #007bff;
	}

	.tab-button:hover {
		color: #007bff;
	}

	.auth-form h1 {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
		text-align: center;
		color: #333;
	}

	.auth-form p {
		text-align: center;
		color: #666;
		margin-bottom: 2rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.375rem;
		font-size: 1rem;
		box-sizing: border-box;
	}

	input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	.auth-button {
		width: 100%;
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
		margin-top: 1rem;
	}

	.auth-button:hover:not(:disabled) {
		background: #0056b3;
	}

	.auth-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.link-button {
		background: none;
		border: none;
		color: #007bff;
		text-decoration: none;
		cursor: pointer;
		font-size: inherit;
		font-weight: 500;
		padding: 0;
	}

	.link-button:hover {
		text-decoration: underline;
	}

	.auth-footer {
		text-align: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.auth-footer p {
		margin: 0;
		color: #666;
		font-size: 0.875rem;
	}
</style>
