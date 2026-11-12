import { NextResponse } from "next/server";
import { getSessionSafe } from "@/lib/auth0";
import { loadSalonSnapshot } from "@/lib/salon";

export async function GET() {
  const session = await getSessionSafe();
  if (!session?.user?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snapshot = await loadSalonSnapshot(session.user.sub, {
    includeChat: true,
    tickCiba: true,
  });
  return NextResponse.json(snapshot);
}
