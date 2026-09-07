import { xApiClient } from './x.client.js';

export async function publishTweet(bearerToken, caption, mediaIds = []) {
  if (!bearerToken || bearerToken.startsWith('mock_')) {
    return {
      success: false,
      error: 'X (Twitter) account is not connected or lacks a valid Bearer Token. Please connect your X account.'
    };
  }

  const payload = { text: caption };
  if (mediaIds.length > 0) {
    payload.media = { media_ids: mediaIds };
  }

  const data = await xApiClient.post('tweets', bearerToken, payload);
  return {
    success: true,
    platformPostId: data.data?.id
  };
}
