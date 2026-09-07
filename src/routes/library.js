import express from 'express';

const router = express.Router();

let libraryMemoryStore = [
  {
    id: 'lib-1',
    title: 'AI Product Launch Promo Reel',
    description: 'High-energy 9:16 vertical video showcasing new SocialFlow automation features.',
    media: [
      {
        id: 'm-lib-1',
        url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
        type: 'video',
        name: 'ai_product_promo.mp4',
        size: '14.2 MB'
      }
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    caption: '🚀 Transform your social media workflow with AI Content Studio!',
    hashtags: ['#SocialMediaAutomation', '#ContentCreator', '#AIStudio'],
    contentType: 'video',
    creationSource: 'ai_generated',
    status: 'ready',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-02T14:30:00Z'
  }
];

// GET /api/library - List all library items
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: libraryMemoryStore.length,
    items: libraryMemoryStore
  });
});

// POST /api/library - Save new content item
router.post('/', (req, res) => {
  const { title, description, media, thumbnailUrl, caption, hashtags, contentType, creationSource } = req.body;
  const newItem = {
    id: `lib-${Date.now()}`,
    title: title || 'Untitled Asset',
    description: description || '',
    media: media || [],
    thumbnailUrl: thumbnailUrl || '',
    caption: caption || '',
    hashtags: hashtags || [],
    contentType: contentType || 'video',
    creationSource: creationSource || 'user_upload',
    status: 'ready',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  libraryMemoryStore.unshift(newItem);
  res.status(201).json({
    success: true,
    message: 'Content asset saved to Content Library.',
    item: newItem
  });
});

// DELETE /api/library/:id - Delete item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  libraryMemoryStore = libraryMemoryStore.filter(i => i.id !== id);
  res.json({ success: true, message: 'Item deleted from Content Library.' });
});

export default router;
