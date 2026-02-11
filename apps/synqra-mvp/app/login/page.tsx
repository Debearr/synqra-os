import Link from "next/link";

export const metadata = {
  title: "Login - Synqra",
  description: "Synqra login entry and access options.",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12 text-white">
      <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
      <p className="mt-3 text-sm text-white/75">
        Account access is currently limited. If you already have access, continue to the studio. Otherwise apply for
        pilot access or join the waitlist.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link className="rounded-lg bg-[#D4AF37] px-5 py-3 text-center text-sm font-semibold text-black" href="/studio">
          Continue to Studio
        </Link>
        <Link className="rounded-lg border border-white/20 px-5 py-3 text-center text-sm" href="/pilot/apply">
          Apply for Pilot
        </Link>
        <Link className="rounded-lg border border-white/20 px-5 py-3 text-center text-sm" href="/waitlist">
          Join Waitlist
        </Link>
      </div>
    </main>
  );
}
