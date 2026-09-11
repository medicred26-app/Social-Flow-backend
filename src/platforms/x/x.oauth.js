import { resolveRedirectUri, encodeOAuthState } from '../../shared/utils/publicUrls.js';

export function getXRedirectUri() {
  return resolveRedirectUri(process.env.X_REDIRECT_URI, '/api/platforms/x/oauth/callback');
}

export function buildXAuthUrl(req) {
  const clientId = process.env.X_CLIENT_ID || '';
  if (!clientId) {
    throw new Error('X_CLIENT_ID environment variable is missing.');
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: getXRedirectUri(),
    scope: 'tweet.read tweet.write users.read offline.access',
    state: encodeOAuthState(req),
    code_challenge: 'challenge',
    code_challenge_method: 'plain',
  });
  return `https://twitter.com/i/oauth2/authorize?${params}`;
}
