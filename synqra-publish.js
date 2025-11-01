import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.LINKEDIN_ACCESS_TOKEN;
const urn = process.env.LINKEDIN_PERSON_URN;

async function publishPost() {
  try {
    const payload = {
      author: urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: '🚀 Synqra test post — automation setup complete!',
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
      headers: {
        Authorization: \Bearer \\,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    console.log('✅ Post published successfully:', res.data);
  } catch (err) {
    console.error('❌ Error publishing post:', err.response?.data || err.message);
  }
}

publishPost();
