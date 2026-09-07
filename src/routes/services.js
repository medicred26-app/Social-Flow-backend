import express from 'express';

const router = express.Router();

let freelancersStore = [
  {
    id: 'free-1',
    name: 'Marcus Vance',
    handle: '@marcusvance_creative',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    title: 'Senior Short-Form Video Editor & Motion Designer',
    bio: 'Specializing in viral TikToks, Instagram Reels, and YouTube Shorts. 6+ years editing for top tech startups & creators.',
    skills: ['Premiere Pro', 'After Effects', 'AI Video Trimming', 'Color Grading'],
    categories: ['video_editing', 'motion_graphics'],
    rating: 4.9,
    reviewCount: 48,
    startingPrice: 4500,
    deliveryTimeDays: 2,
    availability: 'available'
  },
  {
    id: 'free-2',
    name: 'Elena Rostova',
    handle: '@elena_designs',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    title: 'High-CTR YouTube & Social Thumbnail Specialist',
    bio: 'Creating eye-catching, high-converting social media thumbnails and graphic assets.',
    skills: ['Photoshop', 'Figma', 'AI Background Removal'],
    categories: ['thumbnail_design', 'graphic_design'],
    rating: 5.0,
    reviewCount: 62,
    startingPrice: 2500,
    deliveryTimeDays: 1,
    availability: 'available'
  }
];

// GET /api/services/freelancers - List all freelancers
router.get('/freelancers', (req, res) => {
  const { category } = req.query;
  let results = freelancersStore;
  if (category && category !== 'all') {
    results = freelancersStore.filter(f => f.categories.includes(category));
  }
  res.json({ success: true, count: results.length, freelancers: results });
});

// GET /api/services/freelancers/:id - Freelancer detail
router.get('/freelancers/:id', (req, res) => {
  const freelancer = freelancersStore.find(f => f.id === req.params.id);
  if (!freelancer) {
    return res.status(404).json({ success: false, message: 'Freelancer not found.' });
  }
  res.json({ success: true, freelancer });
});

export default router;
