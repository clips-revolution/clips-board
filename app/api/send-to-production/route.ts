import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { concept, style, scenes } = body;

    // Validate request
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Storyboard scenes are required and must be an array.' },
        { status: 400 }
      );
    }

    // Log the storyboard to console for debugging/inspection (optimized for Vercel logging)
    console.log('--- SENT TO PRODUCTION ---');
    console.log(`Concept: ${concept}`);
    console.log(`Visual Style: ${style}`);
    console.log(`Scenes Count: ${scenes.length}`);
    scenes.forEach((scene, index) => {
      console.log(`Scene ${index + 1}: ${scene.title}`);
      console.log(`  Description: ${scene.description}`);
      console.log(`  Narration: ${scene.narration}`);
      console.log(`  Image: ${scene.imageUrl || 'No image generated'}`);
    });
    console.log('--------------------------');

    // Simulate database write or webhook call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return success response in Hebrew
    return NextResponse.json({
      success: true,
      message: 'הקונספט והסטוריבורד נשלחו להפקה בהצלחה! צוות clips.Revolution יתחיל בעיבוד התסריט.',
      productionId: `prod_${Math.random().toString(36).substring(2, 9)}`,
    });

  } catch (error: any) {
    console.error('Error in /api/send-to-production:', error);
    return NextResponse.json(
      { error: 'Failed to send storyboard to production.', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
