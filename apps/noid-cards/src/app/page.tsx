import Link from "next/link";

import { getAllCardProfiles } from "@/lib/cardRegistry";
import { resolveSeason } from "@/lib/seasonalLogic";

export const revalidate = 1800;

export default function Home() {
  const profiles = getAllCardProfiles();
  const season = resolveSeason();

  return (
    <main className="landing-shell">
      <header className="landing-hero">
        <div className="badge">{season.badge}</div>
        <h1>NØID Digital Cards</h1>
        <p>
          Luxury profiles calibrated for investor-ready sharing. Each signal below
          resolves to a live credential.
        </p>
      </header>

      <section className="card-directory">
        {profiles.map((profile) => (
          <Link key={profile.handle} href={`/card/${profile.handle}`} className="directory-card">
            <span className="handle">/{profile.handle}</span>
            <span className="name">{profile.name}</span>
            <span className="title">{profile.title}</span>
            <span className="location">{profile.location}</span>
          </Link>
        ))}
      </section>

      <footer className="landing-footer">
        <span>Deploys on Vercel · Data by Supabase · Automations via Railway</span>
        <a href="https://noidlux.com" className="site-link">
          noidlux.com
        </a>
      </footer>
    </main>
  );
}
