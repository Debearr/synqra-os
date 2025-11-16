'use server';

import { revalidatePath } from 'next/cache';
import { saveNewsletterSignup } from '@/lib/supabase';

export type NewsletterFormState =
  | { status: 'idle'; message?: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export async function submitNewsletter(
  _prevState: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const company = formData.get('company')?.toString().trim();
  const useCase = formData.get('useCase')?.toString().trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      status: 'error',
      message: 'Please provide a valid email address.',
    };
  }

  try {
    const result = await saveNewsletterSignup({
      email,
      company: company?.length ? company : undefined,
      use_case: useCase?.length ? useCase : undefined,
      source: 'synqra-landing-waitlist',
    });

    if (!result.ok) {
      return {
        status: 'error',
        message: 'We could not save your request. Please try again in a moment.',
      };
    }

    revalidatePath('/landing');

    return {
      status: 'success',
      message: result.fallback
        ? "You're on the VIP list. We'll reach out shortly."
        : "You're on the VIP list. Welcome to Synqra.",
    };
  } catch (error) {
    console.error('Newsletter submission failed', error);
    return {
      status: 'error',
      message:
        'Our concierge desk is busy at the moment. Please try again in a few minutes.',
    };
  }
}
