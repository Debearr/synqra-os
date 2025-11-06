import type { CardProfile } from "@/lib/cardRegistry";

export const buildVCard = (profile: CardProfile) => {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profile.name}`,
    `N:${profile.name};;;;`,
    profile.title ? `TITLE:${profile.title}` : undefined,
    profile.phone ? `TEL;TYPE=CELL:${profile.phone}` : undefined,
    profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : undefined,
    profile.website ? `URL:${profile.website}` : undefined,
    profile.location ? `ADR;TYPE=WORK:;;${profile.location};;;;` : undefined,
    profile.socials?.linkedin ? `X-SOCIALPROFILE;TYPE=linkedin:${profile.socials.linkedin}` : undefined,
    profile.socials?.x ? `X-SOCIALPROFILE;TYPE=x:${profile.socials.x}` : undefined,
    profile.socials?.instagram ? `X-SOCIALPROFILE;TYPE=instagram:${profile.socials.instagram}` : undefined,
    profile.socials?.github ? `X-SOCIALPROFILE;TYPE=github:${profile.socials.github}` : undefined,
    "END:VCARD",
  ].filter(Boolean);

  return lines.join("\n");
};
