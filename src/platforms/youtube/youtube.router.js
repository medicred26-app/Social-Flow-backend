import { Router } from 'express';
import { youtubeService } from './youtube.service.js';
import { encodeOAuthState, frontendAccountsUrl } from '../../shared/utils/publicUrls.js';

const router = Router();

router.get('/oauth', (req, res) => {
  try {
    req.oauthState = encodeOAuthState(req);
    const url = youtubeService.getAuthUrl(req);
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
    return res.redirect(frontendAccountsUrl(req, { error: 'No authorization code received from Google' }));
  }

  const result = await youtubeService.handleOAuthCallback(code);
  if (result.success) {
    return res.redirect(
      frontendAccountsUrl(req, {
        youtube_connected: 'true',
        name: result.account.name || 'YouTube Channel',
        handle: result.account.handle || '@YouTube',
        avatar: result.account.avatar || '',
        followers: result.account.followers || 0,
      })
    );
  }

  return res.redirect(frontendAccountsUrl(req, { error: result.error || 'YouTube connection failed' }));
});

router.post('/connect', async (req, res) => {
  const result = await youtubeService.connect(req.body);
  res.json(result);
});

router.post('/publish', async (req, res) => {
  const result = await youtubeService.publish(req.body);
  if (result.success) res.json(result);
  else res.status(400).json(result);
});

router.post('/disconnect', async (req, res) => {
  const result = await youtubeService.disconnect(req.body.accountId);
  res.json(result);
});

export default router;
