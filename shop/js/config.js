/**
 * SKYLIX Salon - Supabase & Application Configuration
 * 
 * IMPORTANT:
 * - Only put your SUPABASE_URL and SUPABASE_ANON_KEY (public key) here or in localStorage.
 * - NEVER put your Supabase service_role key or database password in any client-side file.
 * - Supabase anon key is safe for client-side use because database operations are secured by Row Level Security (RLS).
 */

window.SKYLIX_CONFIG = {
  // Replace these with your Supabase project credentials,
  // OR configure them dynamically in the Admin Panel settings wizard!
  SUPABASE_URL: window.localStorage.getItem('skylix_supabase_url') || '',
  SUPABASE_ANON_KEY: window.localStorage.getItem('skylix_supabase_anon_key') || '',
  
  // Storage bucket name as defined in supabase/schema.sql
  STORAGE_BUCKET: 'gallery-images',
  
  // Contact & Social configuration
  SALON_NAME: 'SKYLIX Haute Coiffure & Salon',
  SALON_PHONE: '+1 (555) 749-5490',
  SALON_WHATSAPP: '15557495490', // Format: digits only with country code
  SALON_EMAIL: 'concierge@skylixsalon.com',
  SALON_ADDRESS: '480 Haute Boulevard, Suite 100, Mayfair District, NY 10022',
  OPENING_HOURS: {
    weekdays: 'Tuesday – Friday: 9:00 AM – 8:00 PM',
    saturday: 'Saturday: 8:30 AM – 7:00 PM',
    sunday: 'Sunday: 10:00 AM – 5:00 PM',
    monday: 'Monday: Closed (Private Bookings Only)'
  }
};
