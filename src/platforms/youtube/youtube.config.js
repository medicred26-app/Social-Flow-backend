import { resolveRedirectUri } from '../../shared/utils/publicUrls.js';

export const YOUTUBE_CONFIG = {
  platformId: 'youtube',
  displayName: 'YouTube Channel',
  baseUrl: 'https://www.googleapis.com/youtube/v3',
  get clientId() { return process.env.GOOGLE_CLIENT_ID || ''; },
  get clientSecret() { return process.env.GOOGLE_CLIENT_SECRET || ''; },
  get redirectUri() {
    return resolveRedirectUri(process.env.YOUTUBE_REDIRECT_URI, '/auth/youtube/callback');
  },
  defaultScope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
};

