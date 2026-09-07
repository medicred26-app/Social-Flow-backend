import express from 'express';

const router = express.Router();

// Configurable platform commission percentage (Default 15%)
let platformCommissionPercentage = 15;

let projectsStore = [
  {
    id: 'proj-101',
    title: 'Viral Reel Edit & Captions Pack',
    description: 'Transform raw podcast clip into 9:16 Reel with custom captions and color grading.',
    category: 'video_editing',
    clientId: 'user-demo',
    clientName: 'Alex Morgan',
    freelancerId: 'free-1',
    freelancerName: 'Marcus Vance',
    freelancerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    price: 10000,
    platformFee: 1500,
    freelancerEarnings: 8500,
    status: 'completed',
    createdAt: '2026-09-02T08:00:00Z',
    updatedAt: '2026-09-04T09:20:00Z'
  }
];

// GET /api/projects - List client projects
router.get('/', (req, res) => {
  res.json({
    success: true,
    commissionConfig: { percentage: platformCommissionPercentage },
    count: projectsStore.length,
    projects: projectsStore
  });
});

// POST /api/projects - Create project with commission calculation
router.post('/', (req, res) => {
  const { title, description, category, freelancerId, freelancerName, freelancerAvatar, price } = req.body;

  const projectPrice = price || 5000;
  const platformFee = Math.round((projectPrice * platformCommissionPercentage) / 100);
  const freelancerEarnings = projectPrice - platformFee;

  const newProject = {
    id: `proj-${Date.now()}`,
    title: title || 'Custom Freelancer Order',
    description: description || '',
    category: category || 'video_editing',
    clientId: 'user-demo',
    clientName: 'Alex Morgan',
    freelancerId: freelancerId || 'free-1',
    freelancerName: freelancerName || 'Freelancer',
    freelancerAvatar: freelancerAvatar || '',
    price: projectPrice,
    platformFee,
    freelancerEarnings,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projectsStore.unshift(newProject);

  res.status(201).json({
    success: true,
    message: 'Project created successfully with 15% platform commission calculation.',
    project: newProject
  });
});

// POST /api/projects/:id/deliverable - Submit deliverable
router.post('/:id/deliverable', (req, res) => {
  const { id } = req.params;
  const { title, mediaUrl, mediaType, thumbnailUrl, captionSuggestion, hashtagsSuggestion, notes } = req.body;

  const project = projectsStore.find(p => p.id === id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  project.status = 'review_requested';
  project.deliverable = {
    id: `deliv-${Date.now()}`,
    title: title || 'Completed Deliverable',
    mediaUrl: mediaUrl || '',
    mediaType: mediaType || 'video',
    thumbnailUrl: thumbnailUrl || '',
    captionSuggestion: captionSuggestion || '',
    hashtagsSuggestion: hashtagsSuggestion || [],
    notes: notes || '',
    submittedAt: new Date().toISOString()
  };
  project.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Deliverable submitted for client review.', project });
});

export default router;
