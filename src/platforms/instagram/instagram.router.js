import { Router } from 'express';
import { instagramService } from './instagram.service.js';
import { encodeOAuthState, frontendAccountsUrl } from '../../shared/utils/publicUrls.js';

const router = Router();

router.get('/oauth', (req, res) => {
  try {
    req.oauthState = encodeOAuthState(req);
    const url = instagramService.getAuthUrl(req);
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
    return res.redirect(frontendAccountsUrl(req, { error: 'No code received from Instagram/Meta' }));
  }

  const result = await instagramService.connect({ code });
  if (result.success) {
    return res.redirect(
      frontendAccountsUrl(req, {
        instagram_connected: 'true',
        name: result.account.name || 'Instagram Account',
        handle: result.account.handle || '@instagram',
        avatar: result.account.avatar || '',
        followers: result.account.followers || 0,
      })
    );
  }

  return res.redirect(frontendAccountsUrl(req, { error: result.error }));
});

router.post('/connect', async (req, res) => {
  const result = await instagramService.connect(req.body);
  res.json(result);
});

router.post('/publish', async (req, res) => {
  const result = await instagramService.publish(req.body);
  if (result.success) res.json(result);
  else res.status(400).json(result);
});

router.post('/disconnect', async (req, res) => {
  const result = await instagramService.disconnect(req.body.accountId);
  res.json(result);
});

export default router;
