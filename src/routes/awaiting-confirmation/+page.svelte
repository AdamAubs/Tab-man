<svelte:head>
	<title>Confirm Your Email</title>
</svelte:head>

<div class="container">
	<h1>Check Your Inbox!</h1>
	<p>
		We've sent a confirmation link to your email address. Please click the link to complete your
		registration.
	</p>
	<p>Once confirmed, you'll be able to log in.</p>
	<a href="/auth" class="button">Back to Login</a>
</div>

<style>
	.container {
		text-align: center;
		max-width: 500px;
		margin: 4rem auto;
		padding: 2rem;
		border: 1px solid #eee;
		border-radius: 8px;
	}
	.button {
		display: inline-block;
		margin-top: 1.5rem;
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		text-decoration: none;
		border-radius: 4px;
	}
</style>
