// app/api/auth/logout/route.ts - User Logout API Route
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Get current session
    const session = await getServerSession(authOptions) as any;
    
    if (session) {
      // Log logout activity (optional)
      console.log(`User ${session.user?.email} logged out at ${new Date().toISOString()}`);
      
      // Here you can add additional logout logic:
      // - Clear user sessions from database
      // - Log audit trail
      // - Send logout notifications
      // - Clear any cached data
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        message: 'Si guul leh ayaad uga baxday!',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka user-ka la saarayay:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
