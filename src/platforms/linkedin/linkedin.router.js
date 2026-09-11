import { Router } from 'express';
import { linkedinService } from './linkedin.service.js';
import { frontendAccountsUrl } from '../../shared/utils/publicUrls.js';

const router = Router();

router.get('/oauth', (req, res) => {
  try {
    res.redirect(linkedinService.getAuthUrl(req));
  } catch (err) {
    res.redirect(frontendAccountsUrl(req, { error: err.message }));
  }
});

router.get('/oauth/callback', (req, res) => {
  const { error, error_description } = req.query;
  if (error) {
    return res.redirect(frontendAccountsUrl(req, { error: error_description || error }));
  }
  return res.redirect(
    frontendAccountsUrl(req, {
      error: 'LinkedIn connected back to SocialFlow. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET on Render to finish token exchange.',
    })
  );
});

router.post('/connect', async (req, res) => {
  const result = await linkedinService.connect(req.body);
  res.json(result);
});

router.post('/publish', async (req, res) => {
  const result = await linkedinService.publish(req.body);
  if (result.success) res.json(result);
  else res.status(400).json(result);
});

router.post('/disconnect', async (req, res) => {
  const result = await linkedinService.disconnect(req.body.accountId);
  res.json(result);
});

export default router;
