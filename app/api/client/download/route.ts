import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const configContent = "vless://example-config-content";
    const filename = "config.conf";

    return new Response(configContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: {
        code: 'DOWNLOAD_FAILED',
        message: 'Failed to generate download',
        details: error.message
      }
    }, { status: 500 });
  }
}
