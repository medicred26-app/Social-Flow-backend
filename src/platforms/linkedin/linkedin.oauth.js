import { resolveRedirectUri, encodeOAuthState } from '../../shared/utils/publicUrls.js';

export function getLinkedInRedirectUri() {
  return resolveRedirectUri(process.env.LINKEDIN_REDIRECT_URI, '/api/platforms/linkedin/oauth/callback');
}

export function buildLinkedInAuthUrl(req) {
  const clientId = process.env.LINKEDIN_CLIENT_ID || '';
  if (!clientId) {
    throw new Error('LINKEDIN_CLIENT_ID environment variable is missing.');
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: getLinkedInRedirectUri(),
    scope: 'openid profile email w_member_social',
    state: encodeOAuthState(req),
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}
