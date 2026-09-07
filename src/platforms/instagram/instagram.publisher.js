import { instagramApiClient } from './instagram.client.js';

export async function publishToInstagramMedia(igAccountId, accessToken, caption, imageUrl) {
  if (!accessToken || accessToken.startsWith('mock_')) {
    return {
      success: false,
      error: 'Instagram account is not connected or lacks a valid access token. Please connect your Instagram Business account.'
    };
  }

  // 1. Create Media Container
  const containerData = await instagramApiClient.post(`${igAccountId}/media`, accessToken, {
    image_url: imageUrl,
    caption
  });

  // 2. Publish Container
  const publishData = await instagramApiClient.post(`${igAccountId}/media_publish`, accessToken, {
    creation_id: containerData.id
  });

  return {
    success: true,
    platformPostId: publishData.id
  };
}
