import type { CSSProperties } from "react";
import Image from "next/image";

import type { CardProfile } from "@/lib/cardRegistry";
import { cardCssVariables, getCardTokens } from "@/lib/cardTokens";
import { buildSeasonalCardStyles, type SeasonalVariant } from "@/lib/seasonalLogic";

type DigitalCardProps = {
  profile: CardProfile;
  qrDataUrl: string;
  season: SeasonalVariant;
};

const tokens = getCardTokens();

export const DigitalCard = ({ profile, qrDataUrl, season }: DigitalCardProps) => {
  const cssVars = {
    ...cardCssVariables(),
    ...buildSeasonalCardStyles(season),
  } as CSSProperties;

  const focusItems = profile.focus?.slice(0, 3) ?? [];
  const highlightItems = profile.highlights?.slice(0, 3) ?? [];

  return (
    <article className="card-shell" style={cssVars} data-season={season.id}>
      <div className="card-surface" aria-live="polite">
        <div className="card-header">
          <div className="avatar-wrapper" aria-hidden={!profile.avatar}>
            <Image
              src={profile.avatar ?? "/images/team/default-avatar.svg"}
              alt={`Portrait of ${profile.name}`}
              width={132}
              height={132}
              priority
            />
            <span className="season-badge">{season.badge}</span>
          </div>
          <div className="identity">
            <span className="microcaps">{profile.location}</span>
            <h1>{profile.name}</h1>
            <h2>{profile.title}</h2>
          </div>
        </div>

        <p className="bio">{profile.bio}</p>

        <div className="card-grid">
          <section className="card-section">
            <h3>Signal Core</h3>
            <ul>
              {focusItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card-section">
            <h3>Highlights</h3>
            <ul>
              {highlightItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="card-footer">
          <div className="contact">
            <a href={`mailto:${profile.email}`}>
              <span>{tokens.typography.micro.family.includes("Mono") ? "Mail" : "Email"}</span>
              <strong>{profile.email}</strong>
            </a>
            <a href={`tel:${profile.phone}`}>
              <span>Secure Line</span>
              <strong>{profile.phone}</strong>
            </a>
            <a href={`/api/card/${profile.handle}/vcard`} download>
              <span>vCard Export</span>
              <strong>Download</strong>
            </a>
          </div>

          <div className="qr">
            <Image
              src={qrDataUrl}
              alt={`QR to ${profile.name}'s digital card`}
              width={tokens.qr.size}
              height={tokens.qr.size}
              priority
              unoptimized
            />
            <a className="qr-link" href={`/api/card/${profile.handle}/qr`}>
              High-res QR
            </a>
          </div>
        </footer>
      </div>
    </article>
  );
};

export default DigitalCard;
