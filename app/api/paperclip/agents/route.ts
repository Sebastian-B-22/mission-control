import { NextResponse } from "next/server";

const PAPERCLIP_URL = "http://127.0.0.1:3100";
const COMPANY_ID = "f47d8566-2c04-4c8c-a4f7-75e264a3afce";

export async function GET() {
  try {
    const response = await fetch(
      `${PAPERCLIP_URL}/api/companies/${COMPANY_ID}/agents`,
      { cache: "no-store" }
    );
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Paperclip", status: response.status },
        { status: 502 }
      );
    }
    
    const agents = await response.json();
    return NextResponse.json(agents);
  } catch (error) {
    // Paperclip not running - return empty/offline state
    return NextResponse.json(
      { error: "Paperclip offline", offline: true },
      { status: 503 }
    );
  }
}
