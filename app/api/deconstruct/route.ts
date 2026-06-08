import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-build',
});

const storyboardSchema = {
  type: "object",
  properties: {
    style: {
      type: "string",
      description: "Detailed description of the consistent visual art style, character physical traits, hair, face, expression, clothing, and environment features in English. This description will be used to maintain consistency across all scenes."
    },
    scenes: {
      type: "array",
      description: "List of storyboard scenes in chronological order.",
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Sequential scene number starting from 1."
          },
          title: {
            type: "string",
            description: "A brief, descriptive title for this scene in Hebrew (e.g., 'פתיחה: הגיבור בבית קפה')."
          },
          description: {
            type: "string",
            description: "Detailed description of the plot action in Hebrew."
          },
          narration: {
            type: "string",
            description: "The voiceover (קריינות) or dialogue text for this scene in Hebrew."
          },
          visualDescription: {
            type: "string",
            description: "Detailed description of the visual composition, camera movement, and characters present in Hebrew (תיאור ויזואלי)."
          },
          imagePrompt: {
            type: "string",
            description: "A highly descriptive, detail-rich English prompt for GPT Image 2 image generation. Focus on actions, layout, lighting, camera angle, and scene-specific items. Do not specify stylistic buzzwords (like 'photorealistic'), but focus on descriptive elements (e.g. 'cinematic lighting, volumetric atmosphere, sharp focus')."
          }
        },
        required: ["id", "title", "description", "narration", "visualDescription", "imagePrompt"],
        additionalProperties: false
      }
    }
  },
  required: ["style", "scenes"],
  additionalProperties: false
};

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
    const { concept } = body;

    if (!concept || typeof concept !== 'string' || concept.trim() === '') {
      return NextResponse.json(
        { error: 'Concept text is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    // 4. Request gpt-5.4-mini for structured breakdown
    const systemPrompt = `You are a professional video director, creative director, and master storyboard artist.
Your job is to take a raw, unstructured video concept written in Hebrew, and deconstruct it into a logical, sequential visual storyboard (comprising between 3 to 6 scenes).

Follow these rules:
1. Deconstruct the story chronologically.
2. The fields "title", "description", "narration", and "visualDescription" MUST be written in natural, fluent, and compelling Hebrew (RTL).
3. The field "style" MUST be written in English. It should outline a highly detailed character design sheet and global art style (e.g., "A modern cinematic commercial style, soft natural morning light, featuring a 30-year-old male entrepreneur with dark short curly hair, light green eyes, wearing a black linen shirt and silver watch, setting is a bright open-space office with green plants"). This style description will serve as the baseline for all scene images.
4. The field "imagePrompt" for each scene MUST be in English. It should describe only the specific actions, camera framing (e.g. 'medium shot', 'extreme close-up'), lighting, and scene-specific background details for that scene. It should NOT repeat the character/style details already declared in the global "style" field, as they will be automatically combined during image generation.
5. Ensure there is logical progression and visual continuity between the scenes.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Deconstruct the following video concept into a detailed storyboard:\n\n${concept}` }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'storyboard',
          strict: true,
          schema: storyboardSchema,
        }
      },
      temperature: 0.7,
    });

    const content = response.choices[0].message?.content;

    if (!content) {
      throw new Error('No content returned from Storyboard Deconstructor API.');
    }

    // 5. Return parsed JSON
    const storyboardData = JSON.parse(content);
    return NextResponse.json(storyboardData);

  } catch (error: any) {
    console.error('Error in /api/deconstruct:', error);
    return NextResponse.json(
      { error: 'Failed to deconstruct concept.', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
