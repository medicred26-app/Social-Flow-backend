import { linkedinApiClient } from './linkedin.client.js';

export async function publishUgcPost(accessToken, authorUrn, caption) {
  if (!accessToken || accessToken.startsWith('mock_')) {
    return {
      success: false,
      error: 'LinkedIn account is not connected or lacks a valid access token. Please connect your LinkedIn Profile.'
    };
  }

  const payload = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: caption },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const data = await linkedinApiClient.post('ugcPosts', accessToken, payload);
  return {
    success: true,
    platformPostId: data.id
  };
}
