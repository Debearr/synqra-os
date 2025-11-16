import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCardProfile } from "@/lib/cardRegistry";
import { buildVCard } from "@/lib/vcard";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;
  const profile = getCardProfile(handle);

  if (!profile) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const vcard = buildVCard(profile);

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${profile.handle}.vcf"`,
      "Cache-Control": "public, max-age=600",
    },
  });
}
