import Link from "next/link";

type DoorStateVariant = "lapsed" | "denied" | "pending" | "error";

type DoorStateProps = {
  variant: DoorStateVariant;
};

type DoorCopy = {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  showRefId?: boolean;
};

const COPY: Record<DoorStateVariant, DoorCopy> = {
  lapsed: {
    title: "Access paused.",
    body: "",
    ctaLabel: "Resume",
    ctaHref: "/pricing",
  },
  denied: {
    title: "Not approved.",
    body: "",
    ctaLabel: "Learn what we look for",
    ctaHref: "/apply",
  },
  pending: {
    title: "Application received.",
    body: "We'll be in touch.",
  },
  error: {
    title: "Something went wrong.",
    body: "",
    ctaLabel: "Try again",
    ctaHref: "/apply",
    showRefId: true,
  },
};

export default function DoorState({ variant }: DoorStateProps) {
  const copy = COPY[variant];
  const refId = `STATE-${variant.toUpperCase()}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-white">
      <section className="w-full max-w-xl space-y-5 border border-white/20 bg-black/40 p-8 text-center">
        <h1 className="text-2xl font-medium tracking-tight">{copy.title}</h1>
        {copy.body ? <p className="text-sm text-white/80">{copy.body}</p> : null}
        {copy.showRefId ? <p className="text-xs uppercase tracking-[0.14em] text-white/60">Ref ID: {refId}</p> : null}
        {copy.ctaHref && copy.ctaLabel ? (
          <div className="pt-2">
            <Link
              href={copy.ctaHref}
              className="inline-block border border-[#b89556] px-4 py-2 text-sm uppercase tracking-[0.12em] text-white"
            >
              {copy.ctaLabel}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
