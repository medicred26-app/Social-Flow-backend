import { supabase } from '../shared/utils/supabase.js';
import { MARKETPLACE_CONFIG } from './marketplace.config.js';

// In-memory persistent state (fallback if Supabase tables not yet migrated)
const memoryStore = {
  settings: {
    commission_percentage: MARKETPLACE_CONFIG.defaultCommissionPercentage
  },
  categories: [...MARKETPLACE_CONFIG.categories],
  freelancers: [],
  services: [],
  portfolio: [],
  jobs: [],
  reviews: [],
  payments: []
};

// 1. Commission / Settings Helpers
export async function getCommissionPercentage() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'commission_rate')
        .maybeSingle();

      if (!error && data?.setting_value?.percentage !== undefined) {
        return Number(data.setting_value.percentage);
      }
    }
  } catch (err) {
    console.warn('[Marketplace DB] Using memory fallback for commission rate:', err.message);
  }
  return memoryStore.settings.commission_percentage;
}

export async function setCommissionPercentage(percentage) {
  const rate = Math.max(0, Math.min(50, Number(percentage)));
  memoryStore.settings.commission_percentage = rate;

  try {
    if (supabase) {
      await supabase.from('platform_settings').upsert({
        setting_key: 'commission_rate',
        setting_value: { percentage: rate },
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
    }
  } catch (err) {
    console.warn('[Marketplace DB] Could not sync commission rate to Supabase:', err.message);
  }
  return rate;
}

// 2. Categories Helpers
export async function getCategories() {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('marketplace_categories').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[Marketplace DB] Using memory store categories:', err.message);
  }
  return memoryStore.categories;
}

// 3. Freelancers Helpers
export async function getApprovedFreelancers(filters = {}) {
  const { category, search, availability, minRating } = filters;

  try {
    if (supabase) {
      let query = supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('verification_status', 'approved');

      if (availability) query = query.eq('availability_status', availability);

      const { data, error } = await query;
      if (!error && data) {
        let results = data;
        if (category) {
          results = results.filter(f => f.categories?.includes(category));
        }
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(f => 
            f.professional_title?.toLowerCase().includes(s) || 
            f.user_name?.toLowerCase().includes(s) ||
            f.bio?.toLowerCase().includes(s) ||
            f.skills?.some(sk => sk.toLowerCase().includes(s))
          );
        }
        if (minRating) {
          results = results.filter(f => Number(f.rating_avg) >= Number(minRating));
        }
        return results;
      }
    }
  } catch (err) {
    console.warn('[Marketplace DB] Using memory store for freelancers:', err.message);
  }

  let results = memoryStore.freelancers.filter(f => f.verification_status === 'approved');
  if (category) results = results.filter(f => f.categories?.includes(category));
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(f => 
      f.professional_title?.toLowerCase().includes(s) || 
      f.user_name?.toLowerCase().includes(s) ||
      f.bio?.toLowerCase().includes(s) ||
      f.skills?.some(sk => sk.toLowerCase().includes(s))
    );
  }
  if (availability) results = results.filter(f => f.availability_status === availability);
  if (minRating) results = results.filter(f => Number(f.rating_avg) >= Number(minRating));

  return results;
}

export async function getFreelancerById(id) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('[Marketplace DB] Using memory freelancer lookup:', err.message);
  }
  return memoryStore.freelancers.find(f => f.id === id || f.user_id === id) || null;
}

export async function getFreelancerByUserId(userId) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('[Marketplace DB] Using memory user_id freelancer lookup:', err.message);
  }
  return memoryStore.freelancers.find(f => f.user_id === userId) || null;
}

export async function saveFreelancerApplication(profileData) {
  const profile = {
    id: profileData.id || `fl_${Date.now()}`,
    user_id: profileData.user_id,
    user_email: profileData.user_email,
    user_name: profileData.user_name || profileData.user_email.split('@')[0],
    user_avatar: profileData.user_avatar || '',
    professional_title: profileData.professional_title,
    bio: profileData.bio,
    skills: profileData.skills || [],
    categories: profileData.categories || [],
    experience_years: profileData.experience_years || 1,
    hourly_rate: profileData.hourly_rate || 0,
    availability_status: 'available',
    verification_status: 'pending_review',
    rating_avg: 0.0,
    completed_jobs_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingIdx = memoryStore.freelancers.findIndex(f => f.user_id === profile.user_id);
  if (existingIdx >= 0) {
    memoryStore.freelancers[existingIdx] = { ...memoryStore.freelancers[existingIdx], ...profile };
  } else {
    memoryStore.freelancers.push(profile);
  }

  try {
    if (supabase) {
      await supabase.from('freelancer_profiles').upsert(profile);
    }
  } catch (err) {
    console.warn('[Marketplace DB] Could not persist freelancer profile to Supabase:', err.message);
  }

  return profile;
}

export async function updateFreelancersVerification(id, status, reason = '') {
  const fl = memoryStore.freelancers.find(f => f.id === id || f.user_id === id);
  if (fl) {
    fl.verification_status = status;
    if (reason) fl.rejection_reason = reason;
    fl.updated_at = new Date().toISOString();
  }

  try {
    if (supabase) {
      await supabase
        .from('freelancer_profiles')
        .update({ verification_status: status, rejection_reason: reason, updated_at: new Date().toISOString() })
        .eq('id', id);
    }
  } catch (err) {
    console.warn('[Marketplace DB] Could not update verification status in Supabase:', err.message);
  }

  return fl || { id, verification_status: status };
}

export async function getPendingFreelancers() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('verification_status', 'pending_review');

      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('[Marketplace DB] Memory fallback for pending freelancers:', err.message);
  }
  return memoryStore.freelancers.filter(f => f.verification_status === 'pending_review');
}

// 4. Jobs & Projects Helpers
export async function createJob(jobData) {
  const commissionRate = await getCommissionPercentage();
  const budget = Number(jobData.budget);
  const platformFee = (budget * commissionRate) / 100;
  const freelancerAmount = budget - platformFee;

  const job = {
    id: `job_${Date.now()}`,
    client_id: jobData.client_id,
    client_name: jobData.client_name || jobData.client_id.split('@')[0],
    client_email: jobData.client_email || '',
    freelancer_id: jobData.freelancer_id,
    title: jobData.title,
    description: jobData.description,
    category: jobData.category || 'General',
    budget,
    commission_percentage: commissionRate,
    platform_fee: platformFee,
    freelancer_amount: freelancerAmount,
    deadline_days: Number(jobData.deadline_days) || 7,
    status: 'requested',
    requirements: jobData.requirements || '',
    deliverable_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  memoryStore.jobs.push(job);

  try {
    if (supabase) {
      await supabase.from('jobs').insert(job);
    }
  } catch (err) {
    console.warn('[Marketplace DB] Could not insert job to Supabase:', err.message);
  }

  return job;
}

export async function getUserJobs(userId) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .or(`client_id.eq.${userId}`);

      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('[Marketplace DB] Memory fallback for user jobs:', err.message);
  }

  // Find freelancer ID for user
  const fl = memoryStore.freelancers.find(f => f.user_id === userId);
  const flId = fl ? fl.id : null;

  return memoryStore.jobs.filter(j => j.client_id === userId || (flId && j.freelancer_id === flId));
}

export async function getJobById(id) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('[Marketplace DB] Memory fallback for job lookup:', err.message);
  }
  return memoryStore.jobs.find(j => j.id === id) || null;
}

export async function updateJobStatus(id, status, deliverableNotes = '') {
  const job = memoryStore.jobs.find(j => j.id === id);
  if (job) {
    job.status = status;
    if (deliverableNotes) job.deliverable_notes = deliverableNotes;
    job.updated_at = new Date().toISOString();
  }

  try {
    if (supabase) {
      const updates = { status, updated_at: new Date().toISOString() };
      if (deliverableNotes) updates.deliverable_notes = deliverableNotes;
      await supabase.from('jobs').update(updates).eq('id', id);
    }
  } catch (err) {
    console.warn('[Marketplace DB] Could not update job status in Supabase:', err.message);
  }

  return job || { id, status };
}

