import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { image } = await req.json(); // Expected to be base64 data url like 'data:image/jpeg;base64,...'
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extract base64 and mime type
    const match = image.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const ai = new GoogleGenAI({}); // will pick up GEMINI_API_KEY from environment

    const prompt = `
      Calculate the total points of all the playing cards shown in this image.
      Rules for this Indian Rummy calculation:
      - Face cards (Jack, Queen, King) are 10 points each.
      - Aces are 10 points each.
      - Number cards are worth their face value.
      - Ignore sets or pairs, just sum up the raw points of every card shown.
      
      Respond ONLY with the final calculated score as a single integer number. Do not include any other text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              }
            },
            { text: prompt }
          ],
        }
      ],
    });

    const scoreText = response.text.trim();
    const score = parseInt(scoreText, 10);

    if (isNaN(score)) {
      return NextResponse.json({ error: 'Failed to parse score from AI', rawText: scoreText }, { status: 500 });
    }

    return NextResponse.json({ score });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
