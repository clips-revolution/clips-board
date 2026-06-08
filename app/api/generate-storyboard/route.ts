import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-build',
});

// ── JSON Schema for Structured Outputs ──
const storyboardTimelineSchema = {
  type: "object",
  properties: {
    total_duration_requested: {
      type: "number",
      description: "The total requested video duration in seconds."
    },
    pacing_analysis: {
      type: "string",
      description: "A brief professional analysis of the pacing strategy chosen for this duration, explaining why this scene count and rhythm was selected."
    },
    recommended_scene_count: {
      type: "number",
      description: "The recommended number of scenes for this duration."
    },
    scenes: {
      type: "array",
      description: "The list of timed scenes, each with precise time boundaries.",
      items: {
        type: "object",
        properties: {
          scene_number: {
            type: "number",
            description: "Sequential scene number starting from 1."
          },
          time_start: {
            type: "string",
            description: "Scene start time in M:SS format (e.g. '0:00')."
          },
          time_end: {
            type: "string",
            description: "Scene end time in M:SS format (e.g. '0:15')."
          },
          duration_seconds: {
            type: "number",
            description: "Duration of this scene in seconds."
          },
          scene_title_hebrew: {
            type: "string",
            description: "A short, descriptive title for this scene in Hebrew."
          },
          narrative_description_hebrew: {
            type: "string",
            description: "Detailed description of the narrative and emotional beat of this time block, in Hebrew."
          },
          visual_prompt_english: {
            type: "string",
            description: "A highly detailed cinematic prompt in English for the image generator, specifying character, lighting, camera angle, and environment."
          }
        },
        required: [
          "scene_number",
          "time_start",
          "time_end",
          "duration_seconds",
          "scene_title_hebrew",
          "narrative_description_hebrew",
          "visual_prompt_english"
        ],
        additionalProperties: false
      }
    }
  },
  required: [
    "total_duration_requested",
    "pacing_analysis",
    "recommended_scene_count",
    "scenes"
  ],
  additionalProperties: false
};

// ── The Hollywood Director System Prompt ──
const DIRECTOR_SYSTEM_PROMPT = `You are an expert Hollywood Video Director and Master Video Editor. Your job is to take a raw, unstructured video concept and a requested video duration, and transform them into a perfectly paced, structurally sound visual storyboard.

Analyze the requested duration and apply professional video editing pacing rules:
- Ultra Short (15-30s): High impact, fast cuts. 3-4 scenes max.
- Medium (60s): Standard commercial pacing. 4-6 scenes. Structure: Hook, Setup, Climax, Outro.
- Long (120s+): Narrative/Cinematic pacing. 6-8 scenes. Full story arc: Setup, Inciting Incident, Rising Action, Climax, Resolution.

For every scene you generate:
1. Assign precise time boundaries (time_start, time_end, duration_seconds) that sum up exactly to the requested total duration.
2. Write "scene_title_hebrew" and "narrative_description_hebrew" in natural, fluent, compelling Hebrew.
3. Write "visual_prompt_english" as a highly detailed cinematic image generation prompt in English — specifying character appearance, lighting style (e.g. "golden hour rim lighting"), camera angle (e.g. "low angle close-up"), environment details, and emotional mood. Do NOT use generic buzzwords like "photorealistic" — instead describe specific visual elements.
4. Include a "pacing_analysis" field explaining your directorial reasoning for the scene count, rhythm, and dramatic structure chosen.
5. Ensure logical narrative progression and visual continuity between scenes.`;

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
    const { user_concept, duration_seconds } = body;

    if (!user_concept || typeof user_concept !== 'string' || user_concept.trim() === '') {
      return NextResponse.json(
        { error: 'user_concept is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (!duration_seconds || typeof duration_seconds !== 'number' || duration_seconds <= 0) {
      return NextResponse.json(
        { error: 'duration_seconds is required and must be a positive number.' },
        { status: 400 }
      );
    }

    // 4. Call OpenAI Chat Completions with Structured Outputs
    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: DIRECTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a professional, time-paced storyboard for the following video concept.

Video Concept:
${user_concept.trim()}

Requested Total Duration: ${duration_seconds} seconds

Break this concept into precisely timed scenes that add up to exactly ${duration_seconds} seconds. Apply professional pacing rules based on the duration category.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'storyboard_timeline',
          strict: true,
          schema: storyboardTimelineSchema,
        }
      },
      temperature: 0.7,
    });

    const content = response.choices[0].message?.content;

    if (!content) {
      throw new Error('No content returned from Storyboard Generator API.');
    }

    // 5. Parse and return structured JSON
    const storyboardData = JSON.parse(content);
    return NextResponse.json(storyboardData);

  } catch (error: any) {
    console.error('Error in /api/generate-storyboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate storyboard.', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
