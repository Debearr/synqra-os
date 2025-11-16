import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { getCardProfile } from "@/lib/cardRegistry";
import { getCardTokens, qrOptions } from "@/lib/cardTokens";
import { resolveSeason } from "@/lib/seasonalLogic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noidlux.com";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  const { handle } = await context.params;
  const profile = getCardProfile(handle);

  if (!profile) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const tokens = getCardTokens();
  const season = resolveSeason();
  const colorDark = season.qrForeground ?? tokens.qr.foreground;

  const png = await QRCode.toBuffer(`${BASE_URL}/card/${profile.handle}`, {
    ...qrOptions(),
    errorCorrectionLevel: "H",
    color: {
      dark: colorDark,
      light: tokens.qr.background,
    },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
