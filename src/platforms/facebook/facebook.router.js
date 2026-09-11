import { Router } from 'express';
import { facebookService } from './facebook.service.js';
import { FACEBOOK_CONFIG } from './facebook.config.js';
import { encodeOAuthState, frontendAccountsUrl } from '../../shared/utils/publicUrls.js';

const router = Router();

router.get('/oauth', (req, res) => {
  try {
    req.oauthState = encodeOAuthState(req);
    const url = facebookService.getAuthUrl(req);
    res.redirect(url);
  } catch (err) {
    res.redirect(frontendAccountsUrl(req, { error: err.message }));
  }
});

router.get('/oauth/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(frontendAccountsUrl(req, { error: error_description || error }));
  }

  if (!code) {
    return res.redirect(frontendAccountsUrl(req, { error: 'No code received from Facebook' }));
  }

  const result = await facebookService.connect({ code });
  if (result.success) {
    return res.redirect(
      frontendAccountsUrl(req, {
        facebook_connected: 'true',
        name: result.account.name || 'Facebook Account',
        handle: result.account.handle || '@facebook',
        avatar: result.account.avatar || '',
        followers: result.account.followers || 0,
      })
    );
  }

  return res.redirect(frontendAccountsUrl(req, { error: result.error }));
});

router.get('/oauth/debug', (_req, res) => {
  res.json({
    success: true,
    appIdConfigured: Boolean(FACEBOOK_CONFIG.appId),
    redirectUri: FACEBOOK_CONFIG.redirectUri,
  });
});

router.post('/publish', async (req, res) => {
  const result = await facebookService.publish(req.body);
  if (result.success) res.json(result);
  else res.status(400).json(result);
});

router.post('/disconnect', async (req, res) => {
  const { accountId } = req.body;
  const result = await facebookService.disconnect(accountId);
  res.json(result);
});

export default router;
