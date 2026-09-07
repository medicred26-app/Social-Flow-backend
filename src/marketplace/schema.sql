-- SocialFlow Services Marketplace Database Schema Migration
-- Execute this script in your Supabase SQL Editor

-- 1. Platform Settings (Configurable Commission System)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_settings (setting_key, setting_value)
VALUES ('commission_rate', '{"percentage": 15}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Marketplace Categories
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT 'Briefcase',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Categories
INSERT INTO marketplace_categories (name, slug, icon, description) VALUES
('Video Editors', 'video-editors', 'Video', 'Reels, Shorts, Promo videos, and YouTube editing'),
('Graphic Designers', 'graphic-designers', 'Palette', 'Thumbnails, banners, social posts, and branding'),
('SEO Specialists', 'seo-specialists', 'Search', 'Search engine optimization, keywords, and audit'),
('Social Media Managers', 'social-media-managers', 'Share2', 'Content scheduling, channel management, and growth'),
('Content Writers', 'content-writers', 'PenTool', 'Captions, blogs, website copy, and newsletters'),
('Digital Marketers', 'digital-marketers', 'TrendingUp', 'Paid ads, Meta ads, Google ads, and strategy'),
('Content Creators', 'content-creators', 'Camera', 'UGC content, video creation, and influencer media'),
('Copywriters', 'copywriters', 'FileText', 'Ad copy, sales copy, and persuasive posts'),
('AI/Automation Specialists', 'ai-automation-specialists', 'Cpu', 'Workflows, chatbots, and AI social automation')
ON CONFLICT (slug) DO NOTHING;

-- 3. Freelancer Profiles
CREATE TABLE IF NOT EXISTS freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(150),
  user_avatar TEXT,
  professional_title VARCHAR(150) NOT NULL,
  bio TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  experience_years INT DEFAULT 1,
  availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'busy', 'unavailable'
  verification_status VARCHAR(50) DEFAULT 'pending_review', -- 'draft', 'pending_review', 'approved', 'rejected', 'suspended'
  hourly_rate NUMERIC(10,2) DEFAULT 0.00,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  rating_avg NUMERIC(3,2) DEFAULT 0.00,
  completed_jobs_count INT DEFAULT 0,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Marketplace Services
CREATE TABLE IF NOT EXISTS marketplace_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
  category_slug VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  delivery_days INT NOT NULL DEFAULT 1,
  revisions INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Portfolio Items
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  external_url TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Jobs / Projects System
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(100) NOT NULL,
  client_name VARCHAR(150),
  client_email VARCHAR(255),
  freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES marketplace_services(id) ON DELETE SET NULL,
  title VARCHAR(250) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  budget NUMERIC(10,2) NOT NULL,
  commission_percentage NUMERIC(5,2) DEFAULT 15.00,
  platform_fee NUMERIC(10,2) NOT NULL,
  freelancer_amount NUMERIC(10,2) NOT NULL,
  deadline_days INT DEFAULT 7,
  status VARCHAR(50) DEFAULT 'requested',
  requirements TEXT,
  deliverable_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Reviews & Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  client_id VARCHAR(100) NOT NULL,
  client_name VARCHAR(150),
  freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Marketplace Payments
CREATE TABLE IF NOT EXISTS marketplace_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  client_id VARCHAR(100) NOT NULL,
  freelancer_id UUID REFERENCES freelancer_profiles(id) ON DELETE RESTRICT,
  gross_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  freelancer_amount NUMERIC(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_provider VARCHAR(50) DEFAULT 'stripe',
  transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index optimizations
CREATE INDEX IF NOT EXISTS idx_freelancer_status ON freelancer_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_services_freelancer ON marketplace_services(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_freelancer ON jobs(freelancer_id);
