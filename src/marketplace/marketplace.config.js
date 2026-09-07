export const MARKETPLACE_CONFIG = {
  defaultCommissionPercentage: 15,
  categories: [
    { name: 'Video Editors', slug: 'video-editors', icon: 'Video', description: 'Reels, Shorts, Promo videos, and YouTube editing' },
    { name: 'Graphic Designers', slug: 'graphic-designers', icon: 'Palette', description: 'Thumbnails, banners, social posts, and branding' },
    { name: 'SEO Specialists', slug: 'seo-specialists', icon: 'Search', description: 'Search engine optimization, keywords, and audit' },
    { name: 'Social Media Managers', slug: 'social-media-managers', icon: 'Share2', description: 'Content scheduling, channel management, and growth' },
    { name: 'Content Writers', slug: 'content-writers', icon: 'PenTool', description: 'Captions, blogs, website copy, and newsletters' },
    { name: 'Digital Marketers', slug: 'digital-marketers', icon: 'TrendingUp', description: 'Paid ads, Meta ads, Google ads, and strategy' },
    { name: 'Content Creators', slug: 'content-creators', icon: 'Camera', description: 'UGC content, video creation, and influencer media' },
    { name: 'Copywriters', slug: 'copywriters', icon: 'FileText', description: 'Ad copy, sales copy, and persuasive posts' },
    { name: 'AI/Automation Specialists', slug: 'ai-automation-specialists', icon: 'Cpu', description: 'Workflows, chatbots, and AI social automation' }
  ],
  freelancerStatuses: ['draft', 'pending_review', 'approved', 'rejected', 'suspended'],
  jobStatuses: ['requested', 'pending', 'accepted', 'in_progress', 'submitted', 'revision_requested', 'completed', 'cancelled', 'disputed'],
  paymentStatuses: ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled']
};
