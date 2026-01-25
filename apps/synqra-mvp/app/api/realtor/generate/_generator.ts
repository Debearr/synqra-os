import sharp from "sharp";
import { PHOTO_TOO_SMALL_ERROR, type SignatureStyle } from "./_compliance";

const COLORS = {
  black: "#0F0F0F",
  ivory: "#F8F1E9",
  gold: "#D4AF37",
} as const;

const FONT_STACK = "'Cormorant Garamond', 'Times New Roman', serif";

const INSTAGRAM = { width: 1080, height: 1080 } as const;
const LINKEDIN = { width: 1200, height: 627 } as const;

const INSTAGRAM_PHOTO_HEIGHT = Math.round(INSTAGRAM.height * 0.7);
const LINKEDIN_PHOTO_WIDTH = 760;

const MIN_INPUT_DIMENSION = 1200;

export type RealtorAsset = {
  platform: "instagram" | "linkedin";
  width: number;
  height: number;
  buffer: Buffer;
};

export type RealtorGenerateInput = {
  photoBuffer: Buffer;
  price: number;
  beds: number;
  baths: number;
  address: string;
  brokerageName: string;
  agentName?: string | null;
  includeEho?: boolean;
  signatureStyle?: SignatureStyle;
  logoBuffer?: Buffer | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;
    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(0, maxCharsPerLine - 3))}...`;
  }

  return lines;
}

async function validatePhotoDimensions(photoBuffer: Buffer): Promise<void> {
  const metadata = await sharp(photoBuffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width < MIN_INPUT_DIMENSION || height < MIN_INPUT_DIMENSION) {
    throw new Error(PHOTO_TOO_SMALL_ERROR);
  }
}

function signatureMarkupInstagram(style: SignatureStyle, monogram: string): string {
  if (style === "thin_gold_border") {
    return `<rect x="8" y="8" width="${INSTAGRAM.width - 16}" height="${INSTAGRAM.height - 16}" fill="none" stroke="${COLORS.gold}" stroke-width="2" />`;
  }
  if (style === "monogram_circle") {
    return `<circle cx="1002" cy="826" r="34" fill="none" stroke="${COLORS.gold}" stroke-width="2" />
      <text x="1002" y="836" text-anchor="middle" fill="${COLORS.gold}" font-family="${FONT_STACK}" font-size="26" font-weight="500">${escapeXml(monogram)}</text>`;
  }
  return `<line x1="64" y1="850" x2="464" y2="850" stroke="${COLORS.gold}" stroke-width="3" />`;
}

function signatureMarkupLinkedIn(style: SignatureStyle, monogram: string): string {
  if (style === "thin_gold_border") {
    return `<rect x="8" y="8" width="${LINKEDIN.width - 16}" height="${LINKEDIN.height - 16}" fill="none" stroke="${COLORS.gold}" stroke-width="2" />`;
  }
  if (style === "monogram_circle") {
    const cx = LINKEDIN.width - 52;
    return `<circle cx="${cx}" cy="70" r="24" fill="none" stroke="${COLORS.gold}" stroke-width="2" />
      <text x="${cx}" y="78" text-anchor="middle" fill="${COLORS.gold}" font-family="${FONT_STACK}" font-size="18" font-weight="500">${escapeXml(monogram)}</text>`;
  }
  return `<line x1="${LINKEDIN_PHOTO_WIDTH + 40}" y1="138" x2="${LINKEDIN_PHOTO_WIDTH + 290}" y2="138" stroke="${COLORS.gold}" stroke-width="3" />`;
}

function deriveMonogram(input: RealtorGenerateInput): string {
  const source = (input.agentName || input.brokerageName || "S").trim();
  return source[0]?.toUpperCase() || "S";
}

function instagramOverlaySvg(input: RealtorGenerateInput): Buffer {
  const addressLines = wrapText(input.address, 38, 2);
  const agentLines = wrapText(input.agentName ?? "", 34, 1);
  const brokerageLines = wrapText(input.brokerageName, 42, 1);
  const signatureStyle = input.signatureStyle ?? "gold_underline";
  const monogram = deriveMonogram(input);
  const ehoMarkup = input.includeEho
    ? `<rect x="978" y="1022" width="64" height="28" rx="4" fill="none" stroke="${COLORS.ivory}" stroke-width="1" />
       <text x="1010" y="1041" text-anchor="middle" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="12" font-weight="400">EHO</text>`
    : "";

  return Buffer.from(
    `<svg width="${INSTAGRAM.width}" height="${INSTAGRAM.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="${INSTAGRAM_PHOTO_HEIGHT}" width="${INSTAGRAM.width}" height="${INSTAGRAM.height - INSTAGRAM_PHOTO_HEIGHT}" fill="${COLORS.black}" />
      ${signatureMarkupInstagram(signatureStyle, monogram)}
      <text x="64" y="836" fill="${COLORS.gold}" font-family="${FONT_STACK}" font-size="74" font-weight="500">
        ${escapeXml(formatPrice(input.price))}
      </text>
      <text x="64" y="892" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="44" font-weight="400">
        ${escapeXml(`${input.beds} BEDS  -  ${input.baths} BATHS`)}
      </text>
      <text x="64" y="942" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="34" font-weight="400">
        ${escapeXml(addressLines[0] ?? "")}
      </text>
      <text x="64" y="978" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="34" font-weight="400">
        ${escapeXml(addressLines[1] ?? "")}
      </text>
      <text x="64" y="1016" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="18" font-weight="400">
        ${escapeXml(agentLines[0] ?? "")}
      </text>
      <text x="64" y="1040" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="12" font-weight="400">
        ${escapeXml(brokerageLines[0] ?? "")}
      </text>
      ${ehoMarkup}
    </svg>`,
    "utf8"
  );
}

function linkedInOverlaySvg(input: RealtorGenerateInput): Buffer {
  const sidebarX = LINKEDIN_PHOTO_WIDTH;
  const sidebarWidth = LINKEDIN.width - LINKEDIN_PHOTO_WIDTH;
  const addressLines = wrapText(input.address, 24, 2);
  const agentLines = wrapText(input.agentName ?? "", 24, 1);
  const brokerageLines = wrapText(input.brokerageName, 30, 1);
  const signatureStyle = input.signatureStyle ?? "gold_underline";
  const monogram = deriveMonogram(input);
  const ehoMarkup = input.includeEho
    ? `<rect x="${sidebarX + sidebarWidth - 76}" y="${LINKEDIN.height - 42}" width="56" height="24" rx="4" fill="none" stroke="${COLORS.ivory}" stroke-width="1" />
       <text x="${sidebarX + sidebarWidth - 48}" y="${LINKEDIN.height - 26}" text-anchor="middle" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="12" font-weight="400">EHO</text>`
    : "";

  return Buffer.from(
    `<svg width="${LINKEDIN.width}" height="${LINKEDIN.height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${sidebarX}" y="0" width="${sidebarWidth}" height="${LINKEDIN.height}" fill="${COLORS.black}" />
      ${signatureMarkupLinkedIn(signatureStyle, monogram)}
      <text x="${sidebarX + 40}" y="126" fill="${COLORS.gold}" font-family="${FONT_STACK}" font-size="58" font-weight="500">
        ${escapeXml(formatPrice(input.price))}
      </text>
      <text x="${sidebarX + 40}" y="178" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="38" font-weight="400">
        ${escapeXml(`${input.beds} BEDS  -  ${input.baths} BATHS`)}
      </text>
      <text x="${sidebarX + 40}" y="252" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="31" font-weight="400">
        ${escapeXml(addressLines[0] ?? "")}
      </text>
      <text x="${sidebarX + 40}" y="286" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="31" font-weight="400">
        ${escapeXml(addressLines[1] ?? "")}
      </text>
      <text x="${sidebarX + 40}" y="${LINKEDIN.height - 64}" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="18" font-weight="400">
        ${escapeXml(agentLines[0] ?? "")}
      </text>
      <text x="${sidebarX + 40}" y="${LINKEDIN.height - 34}" fill="${COLORS.ivory}" font-family="${FONT_STACK}" font-size="12" font-weight="400">
        ${escapeXml(brokerageLines[0] ?? "")}
      </text>
      ${ehoMarkup}
    </svg>`,
    "utf8"
  );
}

async function prepareLogo(input: Buffer, width: number, height: number): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function renderInstagram(input: RealtorGenerateInput): Promise<Buffer> {
  const photoLayer = await sharp(input.photoBuffer)
    .rotate()
    .resize(INSTAGRAM.width, INSTAGRAM_PHOTO_HEIGHT, {
      fit: "cover",
      position: "attention",
    })
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [
    { input: photoLayer, top: 0, left: 0 },
    { input: instagramOverlaySvg(input), top: 0, left: 0 },
  ];

  if (input.logoBuffer) {
    const logo = await prepareLogo(input.logoBuffer, 180, 62);
    composites.push({ input: logo, top: 964, left: 858 });
  }

  return sharp({
    create: {
      width: INSTAGRAM.width,
      height: INSTAGRAM.height,
      channels: 4,
      background: COLORS.black,
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function renderLinkedIn(input: RealtorGenerateInput): Promise<Buffer> {
  const photoLayer = await sharp(input.photoBuffer)
    .rotate()
    .resize(LINKEDIN_PHOTO_WIDTH, LINKEDIN.height, {
      fit: "cover",
      position: "attention",
    })
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [
    { input: photoLayer, top: 0, left: 0 },
    { input: linkedInOverlaySvg(input), top: 0, left: 0 },
  ];

  if (input.logoBuffer) {
    const logo = await prepareLogo(input.logoBuffer, 142, 52);
    composites.push({ input: logo, top: LINKEDIN.height - 74, left: LINKEDIN.width - 162 });
  }

  return sharp({
    create: {
      width: LINKEDIN.width,
      height: LINKEDIN.height,
      channels: 4,
      background: COLORS.black,
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export async function generateRealtorAssets(input: RealtorGenerateInput): Promise<RealtorAsset[]> {
  await validatePhotoDimensions(input.photoBuffer);

  const [instagramBuffer, linkedInBuffer] = await Promise.all([renderInstagram(input), renderLinkedIn(input)]);

  return [
    {
      platform: "instagram",
      width: INSTAGRAM.width,
      height: INSTAGRAM.height,
      buffer: instagramBuffer,
    },
    {
      platform: "linkedin",
      width: LINKEDIN.width,
      height: LINKEDIN.height,
      buffer: linkedInBuffer,
    },
  ];
}
