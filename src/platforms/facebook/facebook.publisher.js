import { facebookApiClient } from './facebook.client.js';

export async function publishToFacebookFeed(pageId, accessToken, caption, mediaUrls = []) {
  if (!accessToken || accessToken.startsWith('mock_')) {
    return {
      success: false,
      error: 'Facebook account is not connected or lacks a valid Page Access Token. Please connect your Facebook Page.'
    };
  }

  const payload = {
    message: caption,
    link: mediaUrls.length > 0 ? mediaUrls[0] : undefined
  };

  const data = await facebookApiClient.post(`${pageId}/feed`, accessToken, payload);
  return {
    success: true,
    platformPostId: data.id
  };
}
