import { FACEBOOK_CONFIG } from './facebook.config.js';

export function buildFacebookAuthUrl(overrideScope, state) {
  if (!FACEBOOK_CONFIG.appId) {
    throw new Error('META_APP_ID environment variable is missing.');
  }

  const queryObj = {
    client_id: FACEBOOK_CONFIG.appId,
    redirect_uri: FACEBOOK_CONFIG.redirectUri,
    response_type: 'code'
  };
  if (state) queryObj.state = state;

  // If a Facebook Login for Business config_id is provided in environment variables, Meta requires config_id instead of raw scope strings.
  if (FACEBOOK_CONFIG.configId) {
    queryObj.config_id = FACEBOOK_CONFIG.configId;
  } else {
    queryObj.scope = overrideScope || FACEBOOK_CONFIG.defaultScope;
  }

  const params = new URLSearchParams(queryObj);
  return `${FACEBOOK_CONFIG.oauthDialogUrl}?${params.toString()}`;
}

export async function exchangeFacebookCodeForToken(code) {
  const tokenParams = new URLSearchParams({
    client_id: FACEBOOK_CONFIG.appId,
    client_secret: FACEBOOK_CONFIG.appSecret,
    redirect_uri: FACEBOOK_CONFIG.redirectUri,
    code: code
  });

  const res = await fetch(`${FACEBOOK_CONFIG.baseUrl}/oauth/access_token?${tokenParams.toString()}`);
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message || 'Facebook token exchange failed');
  }

  return data.access_token;
}
