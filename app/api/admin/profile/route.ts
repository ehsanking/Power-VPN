import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const adminProfileData = JSON.stringify({ name: "Admin", role: "superadmin" }, null, 2);
    const filename = "admin_profile.json";

    return new Response(adminProfileData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: {
        code: 'DOWNLOAD_FAILED',
        message: 'Failed to generate profile download',
        details: error.message
      }
    }, { status: 500 });
  }
}
