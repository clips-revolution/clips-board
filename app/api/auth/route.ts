import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const appPassword = process.env.APP_PASSWORD;
    if (!appPassword) {
      // If no password is set in .env.local, it is not protected
      return NextResponse.json({ success: true, protected: false });
    }

    // Check headers for password
    const clientPassword = req.headers.get('x-app-password') || req.headers.get('authorization');
    
    if (clientPassword === appPassword) {
      return NextResponse.json({ success: true, protected: true });
    }

    return NextResponse.json(
      { error: 'Unauthorized. Incorrect app password.', protected: true },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error in /api/auth:', error);
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
