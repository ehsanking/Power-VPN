import { NextResponse } from 'next/server';

export async function POST() {
  try {
    throw new Error("Automated restore is disabled for security reasons. Database restoration must be performed manually via SQL backups to prevent accidental TRUNCATE destruction.");

    // return NextResponse.json({ success: true, message: "Data restored successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
