import { Router } from 'express';
import { 
  getCategories, 
  getApprovedFreelancers, 
  getFreelancerById, 
  getFreelancerByUserId, 
  saveFreelancerApplication, 
  getPendingFreelancers, 
  updateFreelancersVerification, 
  getCommissionPercentage, 
  setCommissionPercentage,
  createJob,
  getUserJobs,
  getJobById,
  updateJobStatus
} from './marketplace.db.js';

const router = Router();

// GET Categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Public Approved Freelancers (Marketplace Listing)
router.get('/freelancers', async (req, res) => {
  try {
    const { category, search, availability, minRating } = req.query;
    const freelancers = await getApprovedFreelancers({ category, search, availability, minRating });
    res.json({ success: true, freelancers, count: freelancers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Specific Freelancer Profile
router.get('/freelancers/:id', async (req, res) => {
  try {
    const freelancer = await getFreelancerById(req.params.id);
    if (!freelancer) {
      return res.status(404).json({ success: false, error: 'Freelancer profile not found.' });
    }
    res.json({ success: true, freelancer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET My Freelancer Profile Status (Authenticated User)
router.get('/freelancer/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required.' });
    }
    const profile = await getFreelancerByUserId(userId);
    res.json({ success: true, profile: profile || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Freelancer Application / Registration
router.post('/freelancers/apply', async (req, res) => {
  try {
    const { userId, userEmail, userName, userAvatar, professionalTitle, bio, skills, categories, experienceYears, hourlyRate } = req.body;

    if (!userId || !userEmail || !professionalTitle || !bio) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID, Email, Professional Title, and Bio are required for freelancer registration.' 
      });
    }

    const application = await saveFreelancerApplication({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      user_avatar: userAvatar,
      professional_title: professionalTitle,
      bio,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      categories: Array.isArray(categories) ? categories : (categories ? [categories] : []),
      experience_years: Number(experienceYears) || 1,
      hourly_rate: Number(hourlyRate) || 0
    });

    res.status(201).json({
      success: true,
      message: 'Freelancer application submitted successfully! Profile is currently pending admin review.',
      profile: application
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Admin Pending Freelancers
router.get('/admin/pending-freelancers', async (req, res) => {
  try {
    const pending = await getPendingFreelancers();
    res.json({ success: true, pending, count: pending.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Admin Verification Action (Approve / Reject / Suspend)
router.post('/admin/verify-freelancer', async (req, res) => {
  try {
    const { id, status, reason } = req.body;
    if (!id || !['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid Freelancer ID and status (approved, rejected, suspended) required.' });
    }

    const updated = await updateFreelancersVerification(id, status, reason || '');
    res.json({ success: true, message: `Freelancer profile updated to ${status}.`, profile: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Platform Settings (Commission Rate)
router.get('/admin/settings', async (req, res) => {
  try {
    const commissionPercentage = await getCommissionPercentage();
    res.json({ 
      success: true, 
      settings: {
        commissionPercentage
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Update Platform Settings (Commission Rate)
router.post('/admin/settings', async (req, res) => {
  try {
    const { commissionPercentage } = req.body;
    if (commissionPercentage === undefined || isNaN(commissionPercentage)) {
      return res.status(400).json({ success: false, error: 'Valid commission percentage is required.' });
    }

    const updatedRate = await setCommissionPercentage(commissionPercentage);
    res.json({ 
      success: true, 
      message: `Platform commission rate updated to ${updatedRate}%.`,
      settings: { commissionPercentage: updatedRate }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Create Job / Project Request
router.post('/jobs', async (req, res) => {
  try {
    const { clientId, clientName, clientEmail, freelancerId, title, description, category, budget, deadlineDays } = req.body;
    if (!clientId || !freelancerId || !title || !description || !budget) {
      return res.status(400).json({ success: false, error: 'Client ID, Freelancer ID, Title, Description, and Budget are required.' });
    }

    const job = await createJob({
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail,
      freelancer_id: freelancerId,
      title,
      description,
      category,
      budget,
      deadline_days: deadlineDays
    });

    res.status(201).json({ success: true, message: 'Job request created successfully.', job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET My Jobs (Client or Freelancer)
router.get('/jobs', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }
    const jobs = await getUserJobs(userId);
    res.json({ success: true, jobs, count: jobs.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Job Details
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH Update Job Status
router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const { status, deliverableNotes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }
    const updated = await updateJobStatus(req.params.id, status, deliverableNotes);
    res.json({ success: true, message: `Job status updated to ${status}.`, job: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
