'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitNewsletter, type NewsletterFormState } from '@/app/landing/actions';

const initialState: NewsletterFormState = { status: 'idle' };

function SubmitButton() {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center rounded-full bg-noid-teal px-6 py-3 text-sm font-semibold text-noid-black transition-all duration-500 hover:-translate-y-0.5 hover:shadow-teal-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-teal/40 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={status.pending}
    >
      {status.pending ? 'Adding you to the list…' : 'Secure my invite'}
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(submitNewsletter, initialState);

  useEffect(() => {
    if (state.status === 'success') {
      const form = document.getElementById('synqra-waitlist-form') as HTMLFormElement | null;
      form?.reset();
    }
  }, [state.status]);

  return (
    <section id="waitlist" className="mx-auto mt-24 max-w-3xl rounded-3xl border border-white/5 bg-noid-charcoal/70 p-10 shadow-teal-glow backdrop-blur">
      <div className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.3em] text-noid-gray/80">Newsletter + Waitlist</span>
        <h2 className="text-3xl font-semibold text-noid-white">Be first in line for the Synqra release.</h2>
        <p className="text-sm text-noid-gray/80">
          Receive curated updates, early access slots, and concierge onboarding invitations the moment Synqra opens.
        </p>
      </div>

      <form
        id="synqra-waitlist-form"
        action={formAction}
        className="mt-8 grid gap-4 md:grid-cols-2"
        aria-describedby="waitlist-feedback"
      >
        <label className="md:col-span-2">
          <span className="text-xs uppercase tracking-wide text-noid-gray/70">Email</span>
          <input
            required
            type="email"
            name="email"
            placeholder="executive@atelier.co"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-noid-charcoal-light/70 px-4 py-3 text-sm text-noid-white placeholder:text-noid-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-teal/50"
            autoComplete="email"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-wide text-noid-gray/70">Company</span>
          <input
            type="text"
            name="company"
            placeholder="Maison Atelier"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-noid-charcoal-light/70 px-4 py-3 text-sm text-noid-white placeholder:text-noid-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-teal/50"
            autoComplete="organization"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-wide text-noid-gray/70">Primary use case</span>
          <input
            type="text"
            name="useCase"
            placeholder="Thought leadership, executive updates, launch choreography"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-noid-charcoal-light/70 px-4 py-3 text-sm text-noid-white placeholder:text-noid-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noid-teal/50"
          />
        </label>

        <div className="md:col-span-2">
          <SubmitButton />
        </div>
      </form>

      <div
        id="waitlist-feedback"
        role="status"
        className="mt-4 text-sm"
        aria-live="polite"
      >
        {state.status === 'error' && <p className="text-noid-gold">{state.message}</p>}
        {state.status === 'success' && <p className="text-noid-teal">{state.message}</p>}
      </div>

      <p className="mt-6 text-[13px] text-noid-gray/70">
        By submitting, you consent to secure communications from Synqra and the NØID ecosystem. No spam—only bespoke launch updates.
      </p>
    </section>
  );
}
