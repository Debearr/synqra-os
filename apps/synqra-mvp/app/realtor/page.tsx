"use client";

import { useEffect, useMemo, useState } from "react";

type SignatureStyle = "gold_underline" | "thin_gold_border" | "monogram_circle";

type GeneratedAsset = {
  platform: "instagram" | "linkedin";
  url: string;
  width: number;
  height: number;
};

type GenerateResponse = {
  assets: GeneratedAsset[];
  warnings?: string[];
  error?: string;
};

const SIGNATURE_STYLES: { id: SignatureStyle; label: string }[] = [
  { id: "gold_underline", label: "Option A: Gold underline" },
  { id: "thin_gold_border", label: "Option B: Thin gold border" },
  { id: "monogram_circle", label: "Option C: Monogram circle" },
];

export default function RealtorPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<SignatureStyle>("gold_underline");
  const [onboardingMessage, setOnboardingMessage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [priceRaw, setPriceRaw] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [address, setAddress] = useState("888 Forest Hill Road");
  const [brokerageName, setBrokerageName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [includeEho, setIncludeEho] = useState(false);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const formattedCadPrice = useMemo(() => {
    if (!priceRaw) return "";
    const value = Number(priceRaw);
    if (!Number.isFinite(value)) return "";
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  }, [priceRaw]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/realtor/onboarding");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          authenticated?: boolean;
          profile?: {
            signatureStyle?: SignatureStyle | null;
            onboardingCompleted?: boolean;
          } | null;
        };
        if (!active) return;

        if (payload.profile?.signatureStyle) {
          setSelectedStyle(payload.profile.signatureStyle);
        }
        if (payload.authenticated && payload.profile?.onboardingCompleted) {
          setStep(3);
        }
      } catch {
        // Ignore onboarding preload errors and keep local flow available.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const saveOnboarding = async () => {
    setOnboardingMessage(null);
    setError(null);
    setIsSavingOnboarding(true);
    try {
      const formData = new FormData();
      formData.append("signature_style", selectedStyle);
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await fetch("/api/realtor/onboarding", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        setOnboardingMessage("Sign in to save style per account. Continuing with local preference.");
        setStep(3);
        return;
      }

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to save onboarding settings.");
        return;
      }

      setOnboardingMessage("Signature style saved for this account.");
      setStep(3);
    } catch {
      setError("Unable to save onboarding settings.");
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const generateAsset = async () => {
    if (!photoFile) {
      setError("Please upload a property photo.");
      return;
    }
    setError(null);
    setWarnings([]);
    setAssets([]);
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("price", priceRaw);
      formData.append("beds", beds);
      formData.append("baths", baths);
      formData.append("address", address);
      formData.append("brokerage_name", brokerageName);
      if (agentName.trim()) {
        formData.append("agent_name", agentName);
      }
      formData.append("include_eho", String(includeEho));
      formData.append("signature_style", selectedStyle);

      const response = await fetch("/api/realtor/generate", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as GenerateResponse;
      if (!response.ok) {
        setError(payload.error ?? "Generation failed.");
        return;
      }

      setAssets(payload.assets ?? []);
      setWarnings(payload.warnings ?? []);
    } catch {
      setError("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10 text-white">
      <h1 className="text-2xl font-semibold tracking-wide">Synqra Realtor Onboarding</h1>

      <div className="rounded-xl border border-white/15 bg-black/40 p-5">
        <p className="text-sm text-white/80">Step {step} of 3</p>

        {step === 1 ? (
          <div className="mt-4 space-y-4">
            <h2 className="text-lg">Step 1: Upload agent logo (optional)</h2>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => {
                setLogoFile(event.target.files?.[0] ?? null);
              }}
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md bg-[#D4AF37] px-4 py-2 text-black"
            >
              Continue
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-4 space-y-4">
            <h2 className="text-lg">Step 2: Choose signature style</h2>
            <div className="space-y-2">
              {SIGNATURE_STYLES.map((style) => (
                <label key={style.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="signatureStyle"
                    value={style.id}
                    checked={selectedStyle === style.id}
                    onChange={() => setSelectedStyle(style.id)}
                  />
                  <span>{style.label}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={saveOnboarding}
              disabled={isSavingOnboarding}
              className="rounded-md bg-[#D4AF37] px-4 py-2 text-black disabled:opacity-60"
            >
              {isSavingOnboarding ? "Saving..." : "Continue"}
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-4 space-y-4">
            <h2 className="text-lg">Step 3: Generate first asset</h2>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => {
                setPhotoFile(event.target.files?.[0] ?? null);
              }}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Price (CAD)"
              value={priceRaw}
              onChange={(event) => setPriceRaw(event.target.value.replace(/[^\d]/g, ""))}
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2"
            />
            <p className="text-sm text-white/70">{formattedCadPrice || "$0"}</p>
            <input
              type="number"
              placeholder="Beds"
              value={beds}
              onChange={(event) => setBeds(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2"
            />
            <input
              type="number"
              placeholder="Baths"
              value={baths}
              onChange={(event) => setBaths(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2"
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2"
            />
            <input
              type="text"
              placeholder="Brokerage name"
              value={brokerageName}
              onChange={(event) => setBrokerageName(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2"
            />
            <input
              type="text"
              placeholder="Agent name (optional)"
              value={agentName}
              onChange={(event) => setAgentName(event.target.value)}
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeEho}
                onChange={(event) => setIncludeEho(event.target.checked)}
              />
              <span>Include EHO logo</span>
            </label>
            <button
              type="button"
              onClick={generateAsset}
              disabled={isGenerating}
              className="rounded-md bg-[#D4AF37] px-4 py-2 text-black disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        ) : null}
      </div>

      {onboardingMessage ? <p className="text-sm text-white/80">{onboardingMessage}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {warnings.map((warning) => (
        <p key={warning} className="text-sm text-yellow-300">
          {warning}
        </p>
      ))}

      {assets.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {assets.map((asset) => (
            <article key={asset.platform} className="rounded-xl border border-white/15 bg-black/40 p-3">
              <p className="mb-2 text-sm uppercase text-white/80">{asset.platform}</p>
              <img src={asset.url} alt={`${asset.platform} generated asset`} className="w-full rounded" />
              <a href={asset.url} className="mt-2 block text-sm text-[#D4AF37]" target="_blank" rel="noreferrer">
                Download (expires in 24h)
              </a>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
