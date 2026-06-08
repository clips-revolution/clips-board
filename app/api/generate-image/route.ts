import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-build',
});

export async function POST(req: Request) {
  try {
    // 1. Verify Password Protection if configured
    const appPassword = process.env.APP_PASSWORD;
    if (appPassword) {
      const clientPassword = req.headers.get('x-app-password') || req.headers.get('authorization');
      if (clientPassword !== appPassword) {
        return NextResponse.json(
          { error: 'Unauthorized. Incorrect app password.' },
          { status: 401 }
        );
      }
    }

    // 2. Verify API Key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured in the environment variables.' },
        { status: 500 }
      );
    }

    // 3. Parse request body
    const body = await req.json();
    const { imagePrompt, style, sceneNumber } = body;

    if (!imagePrompt || typeof imagePrompt !== 'string') {
      return NextResponse.json(
        { error: 'Scene imagePrompt is required and must be a string.' },
        { status: 400 }
      );
    }

    if (!style || typeof style !== 'string') {
      return NextResponse.json(
        { error: 'Global style description is required and must be a string.' },
        { status: 400 }
      );
    }

    const sceneNum = sceneNumber ? Number(sceneNumber) : 1;

    // 4. Construct the combined prompt for GPT Image 2
    // We combine the global style description and character details with the scene's action
    // and explicitly instruct the model to maintain consistency in clothing, character appearance and artistic style.
    let combinedPrompt = `${style}. Action: ${imagePrompt}. `;
    
    if (sceneNum > 1) {
      combinedPrompt += `This is scene #${sceneNum} of a visual narrative sequence. Maintain absolute consistency of character appearance, facial traits, hairstyle, clothing, and the artistic style established in previous scenes.`;
    } else {
      combinedPrompt += `This is the opening scene of a visual narrative sequence. Establish the character appearance and style for subsequent scenes.`;
    }

    // 5. Generate image using GPT Image 2
    // Note: gpt-image-2 does not use 'quality' and 'style' parameters, and always returns base64 (b64_json)
    const response = await openai.images.generate({
      model: 'gpt-image-2',
      prompt: combinedPrompt,
      n: 1,
      size: '1792x1024', // Landscape aspect ratio for cinematic video storyboard
    });

    const b64Json = response.data?.[0]?.b64_json;

    if (!b64Json) {
      throw new Error('No image data returned from Image Generator API.');
    }

    // Format as Data URL so client can render it natively
    const imageUrl = `data:image/png;base64,${b64Json}`;

    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('Error in /api/generate-image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image.', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
