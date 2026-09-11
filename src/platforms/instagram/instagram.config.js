import { resolveRedirectUri } from '../../shared/utils/publicUrls.js';

export const INSTAGRAM_CONFIG = {
  platformId: 'instagram',
  displayName: 'Instagram Business',
  graphApiVersion: 'v19.0',
  baseUrl: 'https://graph.facebook.com/v19.0',
  oauthDialogUrl: process.env.INSTAGRAM_OAUTH_DIALOG_URL || 'https://api.instagram.com/oauth/authorize',
  get appId() {
    return process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || process.env.FACEBOOK_APP_ID || '';
  },
  get appSecret() {
    return process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || '';
  },
  get redirectUri() {
    return resolveRedirectUri(
      process.env.INSTAGRAM_REDIRECT_URI,
      '/api/platforms/instagram/oauth/callback'
    );
  },
  defaultScope: process.env.INSTAGRAM_SCOPE || 'instagram_business_basic,instagram_business_content_publish',
  maxCaptionLength: 2200,
  maxHashtags: 30,
  supportedMedia: ['image', 'video']
};

