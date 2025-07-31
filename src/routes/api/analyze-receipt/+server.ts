import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export async function POST({ request }) {
	try {
		const { imageData } = await request.json();

		if (!imageData) {
			return json({ error: 'No image data provided' }, { status: 400 });
		}

		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: `Extract receipt data as JSON:
{
  "merchant": "name",
  "items": [
    {
      "name": "Item name",
      "description": "Additional details if any",
      "quantity": 1,
      "unitPrice": 12.99,
      "totalPrice": 12.99
    }
  ],
  "totals": {
    "subtotal": 0.00,
    "tax": 0.00,
    "tip": 0.00,
    "total": 0.00
  },
}

Rules:
- Extract ALL items with their individual prices
- Calculate quantities if multiple of same item
- Include subtotal, tax, tip, and total if visible
- If tip is not shown, set to 0.00
- Be precise with decimal places
- If you can't read something clearly, use null or empty string
- Return only valid JSON, no additional text
Only return valid JSON.`
						},
						{
							type: 'image_url',
							image_url: {
								url: imageData
							}
						}
					]
				}
			],
			max_tokens: 2000,
			temperature: 0.1 // Low temperature for more consistent results
		});

		const content = response.choices[0].message.content;

		if (!content) {
			return json({ error: 'No response from OpenAI' }, { status: 500 });
		} //

		// Parse the JSON response
		let analyzedData;
		try {
			// Clean up the response in case there's extra text
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				analyzedData = JSON.parse(jsonMatch[0]);
			} else {
				analyzedData = JSON.parse(content);
			}
		} catch (parseError) {
			console.error('Failed to parse OpenAI response:', content, parseError);
			return json({ error: 'Failed to parse receipt data' }, { status: 500 });
		}

		return json({
			success: true,
			data: analyzedData,
			usage: response.usage // For monitoring costs
		});
	} catch (error) {
		console.error('OpenAI API error:', error);

		// Handle specific OpenAI errors
		if (typeof error === 'object' && error !== null && 'code' in error) {
			const code = (error as { code?: string }).code;
			if (code === 'insufficient_quota') {
				return json(
					{
						error: 'API quota exceeded. Please check your OpenAI billing settings.'
					},
					{ status: 402 }
				);
			}

			if (code === 'rate_limit_exceeded') {
				return json(
					{
						error: 'Rate limit exceeded. Please try again in a moment.'
					},
					{ status: 429 }
				);
			}
		}

		return json(
			{
				error: 'Failed to analyze receipt',
				details:
					typeof error === 'object' && error !== null && 'message' in error
						? (error as { message: string }).message
						: String(error)
			},
			{ status: 500 }
		);
	}
}
