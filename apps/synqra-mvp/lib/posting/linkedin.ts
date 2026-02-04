import { createClient } from '@supabase/supabase-js';
import type { PostingMetadata } from './router';
import { buildPostingIdempotencyKey } from './idempotency';

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

interface LinkedInPayload {
  text: string;
  media?: { url: string; title?: string }[];
}

export async function postToLinkedIn(
  payload: LinkedInPayload,
  meta?: PostingMetadata,
  accountId?: string
): Promise<any> {
  const supabase = getSupabaseClient();
  const jobId = meta?.jobId;
  if (!jobId) {
    throw new Error('Missing jobId for LinkedIn posting');
  }

  const idempotencyKey =
    meta?.idempotencyKey ||
    buildPostingIdempotencyKey({
      jobId,
      platform: 'LinkedIn',
      payload,
    });

  const { data: insertResult, error: insertError } = await supabase
    .from('posting_logs')
    .insert(
      {
        job_id: jobId,
        platform: 'LinkedIn',
        status: 'processing',
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'idempotency_key', ignoreDuplicates: true }
    )
    .select('status, response, external_id')
    .maybeSingle();

  if (insertError) {
    throw new Error(`Failed to create posting log: ${insertError.message}`);
  }

  if (!insertResult) {
    const { data: existing, error: existingError } = await supabase
      .from('posting_logs')
      .select('status, response, external_id')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to read posting log: ${existingError.message}`);
    }

    if (existing?.status === 'success') {
      return existing.response || { id: existing.external_id };
    }

    if (existing?.status === 'processing') {
      throw new Error('LinkedIn posting already in progress');
    }

    await supabase
      .from('posting_logs')
      .update({ status: 'processing', error_message: null })
      .eq('idempotency_key', idempotencyKey);
  }
  
  // Get token from database
  const { data: tokenData, error: tokenError } = await supabase
    .from('social_tokens')
    .select('access_token, account_id')
    .eq('platform', 'LinkedIn')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tokenError || !tokenData) {
    await supabase
      .from('posting_logs')
      .update({ status: 'failed', error_message: 'LinkedIn token not found' })
      .eq('idempotency_key', idempotencyKey);
    throw new Error('LinkedIn token not found - run OAuth flow first');
  }

  const { access_token } = tokenData;
  const personUrn = accountId || tokenData.account_id;

  if (!personUrn) {
    await supabase
      .from('posting_logs')
      .update({ status: 'failed', error_message: 'LinkedIn account ID not configured' })
      .eq('idempotency_key', idempotencyKey);
    throw new Error('LinkedIn account ID not configured');
  }

  // LinkedIn API v2 share endpoint
  const sharePayload = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: payload.text,
        },
        shareMediaCategory: payload.media ? 'IMAGE' : 'NONE',
        ...(payload.media && {
          media: payload.media.map((m) => ({
            status: 'READY',
            originalUrl: m.url,
            title: { text: m.title || '' },
          })),
        }),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(sharePayload),
  });

  if (!response.ok) {
    const error = await response.text();
    await supabase
      .from('posting_logs')
      .update({ status: 'failed', error_message: error })
      .eq('idempotency_key', idempotencyKey);
    throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  // Log successful post
  await supabase.from('posting_logs').update({
    status: 'success',
    response: result,
    external_id: result.id,
  }).eq('idempotency_key', idempotencyKey);

  return result;
}
