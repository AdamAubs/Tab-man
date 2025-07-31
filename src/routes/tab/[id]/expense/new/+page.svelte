<script lang="ts">
	import { Camera, Info, Loader2, Upload, X } from 'lucide-svelte';
	// Add this import at the top of your script
	import imageCompression from 'browser-image-compression';
	let { data, form } = $props();
	let { tab, user } = $derived(data);

	let receiptFile = $state(null);
	let receiptPreview = $state(null);
	let isDragging = $state(false);
	let isAnalyzing = $state(false);
	let pricesVerified = $state(false);
	let originalTotalForTip = $state(0);

	// New state to manage how tax is calculated
	let taxIncludedInItems = $state(false);

	let tipPercentage = $state(0);

	// Gets the total from the analyzed response, used as the base for tip calculations
	//let originalTotal = 0;
	let detectedTax = $state(0); // The tax amount found by the AI

	type AnalyzedItem = {
		name: string;
		totalPrice?: number;
		unitPrice?: number;
		quantity?: number;
		description?: string;
		totalWithTax?: number; // <-- Add this line
		totalWithTip?: number;
		[id: string]: any;
	};

	type AnalyzedData = {
		merchant?: string;
		items?: AnalyzedItem[];
		totals?: {
			subtotal?: number;
			tax?: number;
			total?: number;
			tip?: number;
			[id: string]: any;
		};
		[id: string]: any;
	};

	let analyzedData = $state<AnalyzedData | null>(null);
	let analysisError = $state('');

	// Fake data for testing
	function useFakeAnalyzedData() {
		analyzedData = {
			merchant: "Mario's Italian Restaurant",
			items: [
				{
					name: 'Margherita Pizza',
					description: 'Classic tomato, mozzarella, basil',
					quantity: 2,
					unitPrice: 18.5,
					totalPrice: 37.0
				},
				{
					name: 'Caesar Salad',
					description: 'Romaine, parmesan, croutons',
					quantity: 1,
					unitPrice: 12.0,
					totalPrice: 12.0
				},
				{
					name: 'Tiramisu',
					description: 'Classic Italian dessert',
					quantity: 1,
					unitPrice: 8.5,
					totalPrice: 8.5
				},
				{
					name: 'Wine - Chianti',
					description: 'House red wine',
					quantity: 1,
					unitPrice: 24.0,
					totalPrice: 24.0
				}
			],
			totals: {
				subtotal: 81.5,
				tax: 7.34,
				tip: 0.0, // Will be calculated
				total: 88.84
			}
		};

		setAnalyzedDataFromModel(analyzedData);

		// Simulate having a receipt file for UI consistency
		// Only run in the browser
		if (typeof window !== 'undefined') {
			receiptFile = new File(['fake'], 'fake-receipt.jpg', { type: 'image/jpeg' });
			receiptPreview = '/receipt-img/01-the-grille.jpg';
		}

		console.log('Using fake data for testing:', analyzedData);
	}

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file && file.type.startsWith('image/')) {
			receiptFile = file;

			// Create preview URL
			const reader = new FileReader();
			reader.onload = (e) => {
				receiptPreview = e.target.result;
			};

			reader.readAsDataURL(file);
		}
	}

	function handleDragOver(event) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event) {
		event.preventDefault();
		isDragging = false;
	}

	function handleDrop(event) {
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer.files;
		if (files.length > 0) {
			const file = files[0];
			if (file.type.startsWith('image/')) {
				receiptFile = file;

				const reader = new FileReader();
				reader.onload = (e) => {
					receiptPreview = e.target.result;
				};
				reader.readAsDataURL(file);
			}
		}
	}

	function removeReceipt() {
		receiptFile = null;
		receiptPreview = null;
		analyzedData = null;
		analysisError = '';

		pricesVerified = false;
		taxIncludedInItems = false;

		// Reset file input
		const fileInput = document.getElementById('receipt-file') as HTMLInputElement | null;
		const cameraInput = document.getElementById('camera-file') as HTMLInputElement | null;
		if (fileInput) fileInput.value = '';
		if (cameraInput) cameraInput.value = '';
	}

	function setAnalyzedDataFromModel(data: AnalyzedData) {
		analyzedData = data;
		if (analyzedData?.items) {
			// Ensure quantity is at least 1 for every item
			analyzedData.items.forEach((item) => {
				if (!item.quantity || item.quantity < 1) {
					item.quantity = 1;
				}
			});
		}
		detectedTax = data.totals?.tax || 0;
		pricesVerified = false;
		taxIncludedInItems = false;
		recalculateTotals();
	}

	// Replace your existing analyzeReceipt function with this one
	async function analyzeReceipt() {
		if (!receiptFile) return;

		isAnalyzing = true;
		analysisError = '';

		const options = {
			maxSizeMB: 0.3, // Set a max file size
			maxWidthOrHeight: 1024, // Resize the image
			useWebWorker: true, // Use a web worker for performance
			initialQuality: 0.7
		};

		try {
			// 1. Compress the file from the user
			console.log('Compressing image...');
			const compressedFile = await imageCompression(receiptFile, options);

			// 2. Convert the SMALLER, compressed file to a base64 string
			const imageData = await imageCompression.getDataUrlFromFile(compressedFile);
			console.log('Image compressed, sending to API...');

			// 3. Send the compressed data to your API
			const response = await fetch('/api/analyze-receipt', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ imageData })
			});

			const result = await response.json();

			if (result.success) {
				setAnalyzedDataFromModel(result.data);
				console.log('Analysis successful:', result.data);
			} else {
				analysisError = result.error || 'Failed to analyze receipt';
			}
		} catch (error) {
			console.error('Error during compression or analysis:', error);
			analysisError = 'Failed to process the receipt image. Please try again.';
		} finally {
			isAnalyzing = false;
		}
	}

	function distributeTaxToItems() {
		if (!analyzedData?.items || !analyzedData.totals) return;
		const subtotal = analyzedData.totals.subtotal || 0;
		if (taxIncludedInItems) {
			analyzedData.items.forEach((item) => (item.totalWithTax = item.totalPrice));
		} else {
			const tax = detectedTax || 0;
			analyzedData.items.forEach((item) => {
				const itemPrice = item.totalPrice || 0;
				const taxShare = (itemPrice / subtotal) * tax;
				item.totalWithTax = itemPrice + taxShare;
			});
		}
	}

	// Recalculate subtotal and total based on current item prices.
	// This is called whenever an item's price is edited
	function recalculateTotals() {

		if (!analyzedData || !analyzedData.items || !analyzedData.totals) return;

		const currentItemSum = analyzedData.items.reduce(
			(sum, item) => sum + (Number(item.totalPrice) || 0),
			0
		);

		if (taxIncludedInItems) {
			// Mode 1: Item prices are the final price with tax.
			analyzedData.totals.subtotal = currentItemSum;
			analyzedData.totals.tax = 0; // Tax is considered part of the items.
			analyzedData.totals.total = currentItemSum;
		} else {
			// Mode 2: Item prices are pre-tax. Add detected tax separately.
			analyzedData.totals.subtotal = currentItemSum;
			analyzedData.totals.tax = detectedTax; // Use the tax amount from the AI.
			analyzedData.totals.total = currentItemSum + detectedTax;
		}

		distributeTaxToItems();
	}

	function confirmPrices() {
		recalculateTotals();
		originalTotalForTip = analyzedData?.totals?.total || 0;
		pricesVerified = true;
		updateItemTotalsBasedOnTip();
	}

	function handleTipButton(percent: number) {
		tipPercentage = percent;
		updateTipByPercentage(percent);
	}

	function updateTip(newTip: number) {
		if (!analyzedData?.totals) return;
		analyzedData.totals.tip = newTip;
		analyzedData.totals.total = originalTotalForTip + newTip;
		updateItemTotalsBasedOnTip();
	}

	function updateTipByPercentage(percentage: number) {
		if (analyzedData && analyzedData.totals) {
			const newTip = originalTotalForTip * (percentage / 100);
			updateTip(newTip);
		}
	}

	function updateItemTotalsBasedOnTip() {
		if (
			analyzedData &&
			analyzedData.totals &&
			analyzedData.items &&
			analyzedData.items.length > 0
		) {
			const subtotal = analyzedData.totals.subtotal || 0;
			const tip = analyzedData.totals.tip || 0;

			// Calculate each item's share of the tip
			analyzedData.items.forEach((item) => {
				const itemPrice = item.totalPrice || 0;
				const priceShareRatio = subtotal > 0 ? itemPrice / subtotal : 0;
				const tipShare = tip * priceShareRatio;

				item.totalWithTip = (item.totalWithTax || 0) + tipShare;
			});
		}
	}
</script>

<svelte:head>
	<title>New Expense - {tab.name}</title>
	<meta name="description" content="Create a new shared expense" />
</svelte:head>

<div class="new-expense-container">
	<div class="header">
		<h1>Add New Expense</h1>
		<p class="subtitle">Upload a receipt or enter details manually</p>
	</div>

	{#if form?.error}
		<div class="error-message">
			{form.error}
		</div>
	{/if}

	<div class="expense-form">
		<!-- Testing Controls -->
		<div class="testing-controls">
			<h3>🧪 Testing Controls</h3>
			<div class="test-buttons">
				<button type="button" onclick={useFakeAnalyzedData} class="test-btn">
					📄 Use Fake Receipt Data
				</button>
				<button type="button" onclick={removeReceipt} class="test-btn secondary">
					🧹 Clear All Data
				</button>
			</div>
			<p class="test-info">
				Use fake data to test the expense flow without uploading images or calling the OpenAI API
			</p>
		</div>

		{#if !receiptFile}
			<!-- Upload Options   -->
			<div class="upload-section">
				<h2>How would you like to add this expense?</h2>

				<!-- Receipt Upload -->
				<div class="upload-option">
					<div
						class="upload-zone {isDragging ? 'dragging' : ''}"
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						ondrop={handleDrop}
						role="region"
						aria-label="Receipt upload drop zone"
					>
						<div class="upload-content">
							<Upload size={48} />
							<h3>Upload Receipt</h3>
							<p>Drag and drop a receipt image or click to browse</p>

							<input
								type="file"
								id="receipt-file"
								accept="image/*"
								onchange={handleFileSelect}
								style="display: none"
							/>

							<button
								type="button"
								class="upload-btn"
								aria-label="Browse for receipt image"
								onclick={() => {
									const input = document.getElementById('receipt-file');
									if (input) (input as HTMLInputElement).click();
								}}
							>
								Choose File
							</button>
						</div>
					</div>
				</div>

				<!-- Camera Option (Mobile) -->
				<div class="upload-option">
					<div class="camera-zone">
						<div class="upload-content">
							<Camera size={48} />
							<h3>Take Photo</h3>
							<p>Use your camera to capture a receipt</p>

							<input
								type="file"
								id="camera-file"
								accept="image/*"
								capture="environment"
								onchange={handleFileSelect}
								style="display: none;"
							/>

							<button
								type="button"
								class="camera-btn"
								onclick={() => {
									const input = document.getElementById('camera-file');
									if (input) (input as HTMLInputElement).click();
								}}
							>
								Open Camera
							</button>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Receipt Preview and Analysis -->
			<div class="receipt-preview">
				<div class="preview-header">
					<h2>Receipt Preview</h2>
					<button type="button" class="remove-btn" onclick={removeReceipt}>
						<X size={20} />
					</button>
				</div>

				<div class="preview-image">
					<img src={receiptPreview} alt="Receipt preview" />
				</div>

				{#if analysisError}
					<div class="error-message">
						{analysisError}
					</div>
				{/if}

				{#if isAnalyzing}
					<div class="analyzing">
						<Loader2 size={24} class="spinner" />
						<img src="/luke.JPG" alt="AI bot analyzing receipt" class="analyzing-image" />
						<p>Analyzing receipt with AI...</p>
					</div>
				{:else if analyzedData}
					<div class="analysis-results">
						<h3>✅ Analysis Complete</h3>
						<div class="analysis-summary">
							<p><strong>Merchant:</strong> {analyzedData.merchant || 'N/A'}</p>
							<div class="summary-item">
								<span><strong>Subtotal:</strong></span>
								<span>${analyzedData.totals?.subtotal?.toFixed(2) || '0.00'}</span>
							</div>

							<div class="summary-item editable-summary-item">
								<label for="tax-amount"><strong>Tax:</strong></label>
								<div class="item-price-input">
									<span>$</span>
									<input
										id="tax-amount"
										type="number"
										step="0.01"
										min="0"
										bind:value={detectedTax}
										oninput={recalculateTotals}
										disabled={taxIncludedInItems || pricesVerified}
										aria-label="Tax amount"
									/>
								</div>
							</div>
							<p class="summary-total">
								<strong>Total (before tip):</strong>
								${analyzedData.totals?.total?.toFixed(2) || '0.00'}
							</p>
						</div>

						{#if analyzedData.items && analyzedData.items.length > 0}
							<div class="items-preview">
								{#if !pricesVerified}
									<div class="tax-toggle-section">
										<label for="tax-toggle" class="tax-toggle-label">
											Item prices include tax?
											<div
												class="info-icon"
												title="Enable this if the item prices listed below already include tax. The main 'Tax' field above will be set to $0."
											>
												<Info size={16} />
											</div>
										</label>
										<label class="switch">
											<input
												id="tax-toggle"
												type="checkbox"
												bind:checked={taxIncludedInItems}
												onchange={recalculateTotals}
												disabled={pricesVerified}
											/>
											<span class="slider round"></span>
										</label>
									</div>

									<p class="edit-instructions">
										Adjust item prices below to match your receipt. The totals will update
										automatically.
									</p>
								{/if}

								<ul class="editable-item-list">
									{#each analyzedData.items as item, i (i)}
										<li class="editable-item">
											<span class="item-name">{item.name}</span>
											<div class="item-inputs">
												<div class="input-group quantity-input">
													<label for={`qty-${i}`}>Qty</label>
													<input
														id={`qty-${i}`}
														type="number"
														min="1"
														step="1"
														bind:value={item.quantity}
														disabled={pricesVerified}
														aria-label="Quantity for {item.name}"
													/>
												</div>
												<div class="input-group price-input">
													<label for={`price-${i}`}>Price</label>
													<div class="price-input-wrapper">
														<span>$</span>
														<input
															id={`price-${i}`}
															type="number"
															step="0.01"
															min="0"
															bind:value={item.totalPrice}
															oninput={recalculateTotals}
															disabled={pricesVerified}
															aria-label="Price for {item.name}"
														/>
													</div>
												</div>
											</div>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if !pricesVerified}
							<div class="verify-actions">
								<button type="button" class="verify-btn" onclick={confirmPrices}>
									Confirm Prices & Add Tip
								</button>
							</div>
						{:else}
							<!-- Tip Calculator -->
							<div class="tip-section">
								<h4>Add Tip</h4>
								<div class="tip-calculator">
									<div class="tip-buttons">
										<button
											type="button"
											onclick={() => handleTipButton(15)}
											disabled={!analyzedData}>15%</button
										>
										<button
											type="button"
											onclick={() => handleTipButton(18)}
											disabled={!analyzedData}>18%</button
										>
										<button
											type="button"
											onclick={() => handleTipButton(20)}
											disabled={!analyzedData}>20%</button
										>
										<button
											type="button"
											onclick={() => handleTipButton(25)}
											disabled={!analyzedData}>25%</button
										>
									</div>
									<!-- Turn into component -->
									<p>Select a preset tip or enter a custom tip:</p>
									<div class="custom-tip-inputs">
										<div class="tip-input-group">
											<label for="tip-percentage">Custom percentage:</label>
											<div class="input-with-symbol">
												<input
													id="tip-percentage"
													type="number"
													placeholder="0"
													step="0.1"
													min="0"
													max="100"
													bind:value={tipPercentage}
													oninput={(e) => updateTipByPercentage(parseFloat(e.target.value) || 1.0)}
												/>
												<span class="input-symbol">%</span>
											</div>
										</div>

										<div class="tip-input-group">
											<label for="tip-amount">Custom amount:</label>
											<div class="input-with-symbol">
												<span class="input-symbol">$</span>
												<input
													id="tip-amount"
													type="number"
													placeholder="0.00"
													step="0.01"
													min="0"
													value={analyzedData.totals?.tip ?? ''}
													oninput={(e) => updateTip(parseFloat(e.target.value) || 1.0)}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div class="final-split-preview">
								<h4>Final Item Totals</h4>
								<p class="edit-instructions">
									Each item's total below includes its proportional share of tax and tip.
								</p>
								<ul class="final-item-list">
									{#each analyzedData.items as item (item.name)}
										<li class="final-item">
											<span class="item-name">
												{#if item.quantity > 1}{item.quantity}x
												{/if}{item.name}
											</span>
											<span class="item-final-price">
												${item.totalWithTip?.toFixed(2) || item.totalWithTax?.toFixed(2) || '0.00'}
											</span>
										</li>
									{/each}
								</ul>
								<div class="tip-summary">
									<p><strong>Tip:</strong> ${analyzedData.totals?.tip?.toFixed(2) || '0.00'}</p>
									<p class="summary-total">
										<strong>New Grand Total:</strong>
										${analyzedData.totals?.total?.toFixed(2) || '0.00'}
									</p>
								</div>
							</div>

							<div class="preview-actions">
								<form action="?/createExpense" method="post">
									<input type="hidden" name="analyzedData" value={JSON.stringify(analyzedData)} />
									<button type="submit" name="createExpense" class="use-data-btn">
										✅ Use This Data
									</button>
								</form>
							</div>
						{/if}
					</div>
				{:else}
					<div class="preview-actions">
						<button type="button" class="analyze-btn" onclick={analyzeReceipt}>
							🔍 Analyze Receipt
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Back Button -->
	<div class="form-actions">
		<a href="/tab/{tab.id}" class="back-btn">← Back to {tab.name}</a>
	</div>
</div>

<style>
	.new-expense-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 1rem;
		margin: 0;
	}

	.expense-form {
		background-color: var(--color-bg-0);
		border: 1px solid var(--color-bg-2);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.upload-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 2rem;
		text-align: center;
	}

	.upload-option {
		margin-bottom: 1.5rem;
	}

	.upload-zone,
	.camera-zone {
		border: 2px dashed var(--color-bg-2);
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.upload-zone:hover,
	.camera-zone:hover {
		border-color: var(--color-theme-1);
		background: rgba(var(--color-theme-1-rgb), 0.05);
	}

	.upload-zone.dragging {
		border-color: var(--color-theme-1);
		background: rgba(var(--color-theme-1-rgb), 0.1);
	}

	.upload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.upload-content :global(svg) {
		color: var(--color-text-muted);
	}

	.upload-content h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.upload-content p {
		color: var(--color-text-muted);
		margin: 0;
		text-align: center;
	}

	.upload-btn,
	.camera-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.upload-btn:hover,
	.camera-btn:hover {
		background: var(--color-theme-2);
	}

	.receipt-preview {
		text-align: center;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.preview-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.remove-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.remove-btn:hover {
		background: #dc2626;
	}

	.preview-image {
		margin-bottom: 1.5rem;
	}

	.preview-image img {
		max-width: 100%;
		max-height: 400px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.preview-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.analyze-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.analyze-btn:hover {
		background: var(--color-theme-2);
	}

	.form-actions {
		margin-top: 2rem;
		text-align: center;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: var(--color-bg-1);
		color: var(--color-text);
		text-decoration: none;
		border-radius: 8px;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.back-btn:hover {
		background: var(--color-bg-2);
		transform: translateY(-1px);
	}

	.error-message {
		background: #fee2e2;
		color: #991b1b;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.analyzing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: var(--color-text-muted);
	}

	:global(.spinner) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.analysis-results {
		background: var(--color-bg-1);
		border: 1px solid var(--color-theme-1);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.analysis-results h3 {
		color: var(--color-theme-1);
		margin: 0 0 1rem 0;
	}

	.analysis-summary {
		margin-bottom: 1rem;
	}

	.analysis-summary p {
		margin: 0.5rem 0;
		color: var(--color-text);
	}

	.items-preview {
		margin-bottom: 1.5rem;
	}

	.items-preview h4 {
		margin: 0 0 0.5rem 0;
		color: var(--color-text);
	}

	.items-preview ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.items-preview li {
		padding: 0.25rem 0;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-bg-2);
	}

	.use-data-btn {
		padding: 0.75rem 1.5rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.use-data-btn:hover {
		background: #059669;
	}

	/* Tip Calculator */
	.tip-section {
		margin-bottom: 1.5rem;
	}

	.tip-section h4 {
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.tip-calculator {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tip-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tip-buttons button {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-theme-1);
		background: transparent;
		color: var(--color-theme-1);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tip-buttons button:hover {
		background: var(--color-theme-1);
		color: white;
	}

	.tip-calculator input {
		padding: 0.5rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 4px;
		font-size: 1rem;
	}

	/* Edit input */
	.edit-instructions {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
		background-color: rgba(var(--color-theme-1-rgb), 0.05);
		padding: 0.5rem;
		border-radius: 4px;
	}

	.editable-item-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.editable-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		border-radius: 6px;
		background-color: var(--color-bg-0);
	}

	.item-inputs {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.input-group label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-weight: 500;
		text-align: center;
	}

	.input-group input {
		border: 1px solid var(--color-bg-2);
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		background: white;
	}

	.input-group input:disabled {
		background-color: var(--color-bg-2);
		cursor: not-allowed;
	}

	.quantity-input input {
		width: 50px;
		text-align: center;
	}

	.price-input-wrapper {
		display: flex;
		align-items: center;
	}

	.price-input-wrapper span {
		margin-right: 0.25rem;
	}

	.price-input input {
		width: 80px;
		text-align: right;
	}

	.summary-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 0.75rem 0;
	}

	.final-item-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.final-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
		border-radius: 4px;
		background-color: var(--color-bg-0);
	}
	.item-final-price {
		font-weight: 600;
	}

	.item-name {
		flex-grow: 1;
		text-align: left;
	}

	.item-price-input {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.item-price-input input {
		width: 80px;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 4px;
		text-align: right;
	}

	.item-price-input input:disabled {
		background-color: var(--color-bg-2);
		cursor: not-allowed;
	}

	.verify-actions {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-bg-2);
		display: flex;
		justify-content: center;
	}

	.verify-btn {
		padding: 0.75rem 1.5rem;
		background: var(--color-theme-1);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s ease;
	}
	.verify-btn:hover {
		background: var(--color-theme-2);
	}

	/* Testing Controls */
	.testing-controls {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.testing-controls h3 {
		margin: 0 0 0.5rem 0;
		color: #495057;
		font-size: 1rem;
	}

	.test-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.5rem;
	}

	.test-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #007bff;
		background: #007bff;
		color: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.test-btn:hover {
		background: #0056b3;
		border-color: #0056b3;
	}

	.test-btn.secondary {
		background: #6c757d;
		border-color: #6c757d;
	}

	.test-btn.secondary:hover {
		background: #545b62;
		border-color: #545b62;
	}

	.test-info {
		font-size: 0.875rem;
		color: #6c757d;
		margin: 0;
	}

	.custom-tip-inputs {
		display: flex;
		gap: 1rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}

	.tip-input-group {
		flex: 1;
		min-width: 150px;
	}

	.tip-input-group label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
		color: var(--color-text);
		font-weight: 500;
	}

	.input-with-symbol {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-symbol input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--color-bg-2);
		border-radius: 4px;
		font-size: 1rem;
	}

	.input-with-symbol .input-symbol {
		position: absolute;
		color: var(--color-text-muted);
		font-weight: 500;
		pointer-events: none;
	}

	.input-with-symbol .input-symbol:last-child {
		left: 3.5rem;
	}

	.input-with-symbol input:first-child {
		padding-left: 1.5rem;
	}

	.input-with-symbol input:last-child {
		padding-right: 1.5rem;
	}

	.tip-summary {
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--color-bg-1);
		border-radius: 4px;
		border: 1px solid var(--color-bg-2);
	}

	.tip-summary p {
		margin: 0.25rem 0;
		color: var(--color-text);
	}

	.tax-toggle-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--color-bg-1);
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}
	.tax-toggle-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
	}
	.info-icon {
		color: var(--color-text-muted);
		cursor: help;
		display: flex;
		align-items: center;
	}
	.switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 28px;
	}
	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-bg-2);
		transition: 0.4s;
	}
	.slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.4s;
	}
	input:checked + .slider {
		background-color: var(--color-theme-1);
	}
	input:disabled + .slider {
		background-color: #ccc;
		cursor: not-allowed;
	}
	input:checked + .slider:before {
		transform: translateX(22px);
	}
	.slider.round {
		border-radius: 34px;
	}
	.slider.round:before {
		border-radius: 50%;
	}
	.summary-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 0.75rem 0;
	}

	.editable-summary-item .item-price-input input {
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.custom-tip-inputs {
			flex-direction: column;
			gap: 0.75rem;
		}

		.tip-input-group {
			min-width: unset;
		}
	}

	@media (max-width: 767px) {
		.new-expense-container {
			padding: 1rem;
		}

		.expense-form {
			padding: 1.5rem;
		}

		.upload-zone,
		.camera-zone,
		.manual-zone {
			padding: 1.5rem;
		}

		.preview-actions {
			flex-direction: column;
			align-items: center;
		}

		.analyze-btn,
		.manual-btn {
			width: 100%;
			max-width: 300px;
		}
	}

	.analyzing-image {
		width: 80px;
		height: 80px;
		margin: 1rem 0;
		animation: pulse 1.5s infinite ease-in-out;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.7;
		}
		50% {
			transform: scale(1.05);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0.7;
		}
	}
</style>
