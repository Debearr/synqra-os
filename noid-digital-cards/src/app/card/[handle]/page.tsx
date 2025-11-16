import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import DigitalCard from "@/components/card/DigitalCard";
import { getCardProfile, getAllCardProfiles } from "@/lib/cardRegistry";
import { getCardTokens, qrOptions } from "@/lib/cardTokens";
import { resolveSeason } from "@/lib/seasonalLogic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noidlux.com";

type PageContext = {
  params: Promise<{
    handle: string;
  }>;
};

export const dynamicParams = false;
export const revalidate = 1800;

export async function generateStaticParams() {
  return getAllCardProfiles().map((profile) => ({ handle: profile.handle }));
}

export async function generateMetadata({ params }: PageContext): Promise<Metadata> {
  const { handle } = await params;
  const profile = getCardProfile(handle);

  if (!profile) {
    return {
      title: "NØID Digital Cards",
    };
  }

  const title = `${profile.name} — ${profile.title}`;
  const description = profile.bio;
    const canonical = `${BASE_URL}/card/${profile.handle}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      firstName: profile.name.split(" ")[0],
      lastName: profile.name.split(" ").slice(1).join(" "),
      siteName: "NØID Digital Cards",
      images: [
        {
          url: `${BASE_URL}/api/card/${profile.handle}/qr`,
          width: 1024,
          height: 1024,
          alt: `${profile.name} QR`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  } satisfies Metadata;
}

async function buildQr(handle: string) {
  const tokens = getCardTokens();
  const season = resolveSeason();
  const colorDark = season.qrForeground ?? tokens.qr.foreground;
  const qr = await QRCode.toDataURL(`${BASE_URL}/card/${handle}`, {
    ...qrOptions(),
    errorCorrectionLevel: "H",
    color: {
      dark: colorDark,
      light: tokens.qr.background,
    },
  });

  return { dataUrl: qr, season } as const;
}

export default async function CardHandlePage({ params }: PageContext) {
  const { handle } = await params;
  const profile = getCardProfile(handle);

  if (!profile) {
    notFound();
  }

  const { dataUrl, season } = await buildQr(profile.handle);

  return (
    <main className="card-page">
      <DigitalCard profile={profile} qrDataUrl={dataUrl} season={season} />
    </main>
  );
}
