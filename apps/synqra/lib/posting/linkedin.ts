import { createClient } from '@supabase/supabase-js';

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

export async function postToLinkedIn(payload: LinkedInPayload, accountId?: string): Promise<any> {
  const supabase = getSupabaseClient();
  
  // Get token from database
  const { data: tokenData, error: tokenError } = await supabase
    .from('social_tokens')
    .select('access_token, account_id')
    .eq('platform', 'LinkedIn')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('LinkedIn token not found - run OAuth flow first');
  }

  const { access_token } = tokenData;
  const personUrn = accountId || tokenData.account_id;

  if (!personUrn) {
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
    throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  // Log successful post
  await supabase.from('posting_logs').insert({
    platform: 'LinkedIn',
    status: 'success',
    response: result,
    external_id: result.id,
  });

  return result;
}
