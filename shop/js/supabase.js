/**
 * SKYLIX Salon - Supabase Integration Layer
 * 
 * Manages authentication, database queries, and storage uploads/deletions.
 * Uses official @supabase/supabase-js v2.
 */

(function () {
  'use strict';

  // Demo Fallback Data for when Supabase is not yet connected
  const DEMO_GALLERY_ITEMS = [
    {
      id: 'demo-1',
      title: 'Sun-Kissed Golden Balayage',
      category: 'Color & Balayage',
      description: 'Hand-painted honey blonde ribbons creating multidimensional movement and radiant natural shine.',
      image_url: 'assets/images/balayage.jpg',
      storage_path: '',
      is_featured: true,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      is_demo: true
    },
    {
      id: 'demo-2',
      title: 'Parisian Precision Bob',
      category: 'Signature Cuts',
      description: 'Razor-sharp blunt finish with soft interior weight removal for effortless Parisian chic.',
      image_url: 'assets/images/french-bob.jpg',
      storage_path: '',
      is_featured: true,
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      is_demo: true
    },
    {
      id: 'demo-3',
      title: 'Couture Bridal Chignon',
      category: 'Bridal & Glamour',
      description: 'Intricately woven low romantic bun accented with delicate gold leaf pins and soft tendrils.',
      image_url: 'assets/images/bridal-updo.jpg',
      storage_path: '',
      is_featured: true,
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      is_demo: true
    },
    {
      id: 'demo-4',
      title: 'Executive Low Fade & Beard Sculpture',
      category: 'Men\'s Grooming',
      description: 'Flawless skin fade transition paired with clean scissor work and tailored beard lines.',
      image_url: 'assets/images/executive-fade.jpg',
      storage_path: '',
      is_featured: true,
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      is_demo: true
    },
    {
      id: 'demo-5',
      title: 'Luminous Silk Treatment & Gloss',
      category: 'Luxury Treatments',
      description: 'Deep caviar peptide infusion delivering glass-like reflection and total frizz resistance.',
      image_url: 'assets/images/silk-treatment.jpg',
      storage_path: '',
      is_featured: true,
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      is_demo: true
    },
    {
      id: 'demo-6',
      title: 'The Haute Salon Lounge',
      category: 'Salon Architecture',
      description: 'Our private Mayfair styling suites featuring black Italian marble, gold accents, and custom illumination.',
      image_url: 'assets/images/hero-salon.jpg',
      storage_path: '',
      is_featured: false,
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      is_demo: true
    }
  ];

  let client = null;

  const SkylixDB = {
    demoItems: DEMO_GALLERY_ITEMS,

    /**
     * Retrieve stored or configured credentials
     */
    getCredentials() {
      const url = window.localStorage.getItem('skylix_supabase_url') || 
                  (window.SKYLIX_CONFIG && window.SKYLIX_CONFIG.SUPABASE_URL) || '';
      const anonKey = window.localStorage.getItem('skylix_supabase_anon_key') || 
                      (window.SKYLIX_CONFIG && window.SKYLIX_CONFIG.SUPABASE_ANON_KEY) || '';
      return { url: url.trim(), anonKey: anonKey.trim() };
    },

    /**
     * Check if valid Supabase credentials exist
     */
    isConfigured() {
      const { url, anonKey } = this.getCredentials();
      return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
    },

    /**
     * Save credentials to localStorage and re-initialize client
     */
    saveCredentials(url, anonKey) {
      if (url) window.localStorage.setItem('skylix_supabase_url', url.trim());
      if (anonKey) window.localStorage.setItem('skylix_supabase_anon_key', anonKey.trim());
      if (window.SKYLIX_CONFIG) {
        window.SKYLIX_CONFIG.SUPABASE_URL = url.trim();
        window.SKYLIX_CONFIG.SUPABASE_ANON_KEY = anonKey.trim();
      }
      this.init();
    },

    /**
     * Clear stored credentials
     */
    clearCredentials() {
      window.localStorage.removeItem('skylix_supabase_url');
      window.localStorage.removeItem('skylix_supabase_anon_key');
      if (window.SKYLIX_CONFIG) {
        window.SKYLIX_CONFIG.SUPABASE_URL = '';
        window.SKYLIX_CONFIG.SUPABASE_ANON_KEY = '';
      }
      client = null;
    },

    /**
     * Initialize the Supabase JS client
     */
    init() {
      if (!window.supabase) {
        console.warn('[SKYLIX] Supabase JS library is not yet loaded.');
        return null;
      }

      const { url, anonKey } = this.getCredentials();
      if (!url || !anonKey || !url.startsWith('http')) {
        client = null;
        return null;
      }

      try {
        client = window.supabase.createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
          }
        });
        return client;
      } catch (err) {
        console.error('[SKYLIX] Failed to initialize Supabase client:', err);
        client = null;
        return null;
      }
    },

    /**
     * Get the active Supabase client instance
     */
    getClient() {
      if (!client) {
        this.init();
      }
      return client;
    },

    /**
     * Test connection to Supabase instance and verify schema
     */
    async testConnection() {
      const sb = this.getClient();
      if (!sb) {
        return {
          success: false,
          error: 'Supabase credentials are not configured. Please enter your Project URL and Anon Key.'
        };
      }

      try {
        // 1. Test database query on public.gallery
        const { data, error, count } = await sb
          .from('gallery')
          .select('id', { count: 'exact', head: true });

        if (error) {
          if (error.code === '42P01') {
            return {
              success: false,
              tableMissing: true,
              error: 'Table "gallery" does not exist in your database. Please run the SQL schema in supabase/schema.sql.'
            };
          }
          return {
            success: false,
            error: error.message || 'Database query failed'
          };
        }

        // 2. Check storage bucket visibility
        const bucketName = (window.SKYLIX_CONFIG && window.SKYLIX_CONFIG.STORAGE_BUCKET) || 'gallery-images';
        const { data: bucketData, error: bucketError } = await sb.storage.from(bucketName).list('', { limit: 1 });
        
        const storageReady = !bucketError;

        return {
          success: true,
          photoCount: count || 0,
          storageReady: storageReady,
          storageWarning: bucketError ? `Bucket "${bucketName}" not found or policies need to be created. See supabase/schema.sql.` : null
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || 'Unable to connect to Supabase.'
        };
      }
    },

    /**
     * Fetch gallery items. Supports filtering by category.
     * Falls back to demo items if Supabase is unconfigured.
     */
    async getGalleryImages(category = 'All') {
      const sb = this.getClient();

      if (!sb) {
        let filtered = DEMO_GALLERY_ITEMS;
        if (category && category !== 'All') {
          filtered = filtered.filter(item => item.category === category);
        }
        return {
          isDemo: true,
          data: filtered,
          error: null
        };
      }

      try {
        let query = sb
          .from('gallery')
          .select('*')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('[SKYLIX] Error loading gallery from Supabase, falling back to demo data:', error);
          let filtered = DEMO_GALLERY_ITEMS;
          if (category && category !== 'All') {
            filtered = filtered.filter(item => item.category === category);
          }
          return {
            isDemo: true,
            data: filtered,
            error: error.message
          };
        }

        // If table is completely empty, provide fallback demo items or empty list
        if (!data || data.length === 0) {
          return {
            isDemo: false,
            data: [],
            isEmpty: true,
            error: null
          };
        }

        return {
          isDemo: false,
          data: data,
          error: null
        };
      } catch (err) {
        console.error('[SKYLIX] Exception fetching gallery:', err);
        return {
          isDemo: true,
          data: DEMO_GALLERY_ITEMS,
          error: err.message
        };
      }
    },

    /**
     * Upload an image to Supabase Storage and create a record in public.gallery
     */
    async uploadPhoto(file, metadata, onProgress) {
      const sb = this.getClient();
      if (!sb) {
        throw new Error('Supabase is not configured. Please enter your credentials in settings.');
      }

      // Check current auth session
      const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
      if (sessionErr || !sessionData.session) {
        throw new Error('You must be signed in as an administrator to upload photos.');
      }

      // Validate file
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP are supported.');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File exceeds maximum size of 10MB.');
      }

      if (onProgress) onProgress(20, 'Preparing file for upload...');

      // Generate a unique clean filename
      const fileExt = file.name.split('.').pop().toLowerCase();
      const cleanBaseName = file.name
        .substring(0, file.name.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 30);
      const uniquePath = `uploads/${Date.now()}_${cleanBaseName}.${fileExt}`;
      const bucketName = (window.SKYLIX_CONFIG && window.SKYLIX_CONFIG.STORAGE_BUCKET) || 'gallery-images';

      if (onProgress) onProgress(45, 'Uploading image to Supabase Storage...');

      // 1. Upload to Storage
      const { data: uploadData, error: uploadError } = await sb.storage
        .from(bucketName)
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[SKYLIX] Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}. Ensure the "${bucketName}" bucket exists with public access and insert policies.`);
      }

      if (onProgress) onProgress(75, 'Generating public image URL...');

      // 2. Get Public URL
      const { data: urlData } = sb.storage
        .from(bucketName)
        .getPublicUrl(uniquePath);

      const publicUrl = urlData.publicUrl;

      if (onProgress) onProgress(90, 'Saving photo details to database...');

      // 3. Insert record into `public.gallery`
      const record = {
        title: metadata.title.trim(),
        category: metadata.category || 'Signature Cuts',
        description: metadata.description ? metadata.description.trim() : '',
        image_url: publicUrl,
        storage_path: uniquePath,
        is_featured: Boolean(metadata.is_featured),
        display_order: parseInt(metadata.display_order, 10) || 0,
        user_id: sessionData.session.user.id
      };

      const { data: insertedData, error: insertError } = await sb
        .from('gallery')
        .insert([record])
        .select()
        .single();

      if (insertError) {
        console.error('[SKYLIX] Database insert error:', insertError);
        // Clean up the uploaded storage item if the DB record insertion fails
        await sb.storage.from(bucketName).remove([uniquePath]);
        throw new Error(`Database error: ${insertError.message}`);
      }

      if (onProgress) onProgress(100, 'Photo published successfully!');

      return insertedData;
    },

    /**
     * Delete an image from both public.gallery and Supabase Storage
     */
    async deletePhoto(id, storagePath) {
      const sb = this.getClient();
      if (!sb) {
        throw new Error('Supabase is not configured.');
      }

      const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
      if (sessionErr || !sessionData.session) {
        throw new Error('You must be signed in as an administrator to delete photos.');
      }

      const bucketName = (window.SKYLIX_CONFIG && window.SKYLIX_CONFIG.STORAGE_BUCKET) || 'gallery-images';

      // 1. Delete from database
      const { error: dbError } = await sb
        .from('gallery')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('[SKYLIX] Database delete error:', dbError);
        throw new Error(`Failed to delete record: ${dbError.message}`);
      }

      // 2. Delete from Storage if storage_path exists
      if (storagePath) {
        try {
          const { error: storageError } = await sb.storage
            .from(bucketName)
            .remove([storagePath]);

          if (storageError) {
            console.warn('[SKYLIX] Storage delete warning:', storageError);
          }
        } catch (storageEx) {
          console.warn('[SKYLIX] Storage deletion notice:', storageEx);
        }
      }

      return true;
    },

    // ==========================================
    // Authentication Helpers
    // ==========================================

    async signIn(email, password) {
      const sb = this.getClient();
      if (!sb) throw new Error('Supabase is not configured. Please set your credentials first.');
      return await sb.auth.signInWithPassword({ email, password });
    },

    async signOut() {
      const sb = this.getClient();
      if (!sb) return;
      return await sb.auth.signOut();
    },

    async getSession() {
      const sb = this.getClient();
      if (!sb) return { data: { session: null } };
      return await sb.auth.getSession();
    },

    onAuthStateChange(callback) {
      const sb = this.getClient();
      if (!sb) return { data: { subscription: { unsubscribe: () => {} } } };
      return sb.auth.onAuthStateChange(callback);
    },

    async signUp(email, password) {
      const sb = this.getClient();
      if (!sb) throw new Error('Supabase is not configured.');
      return await sb.auth.signUp({
        email,
        password,
        options: {
          data: { role: 'admin' }
        }
      });
    }
  };

  // Attach to window
  window.SkylixDB = SkylixDB;
  
  // Initialize if script is ready
  if (typeof window !== 'undefined') {
    if (window.supabase) {
      SkylixDB.init();
    } else {
      window.addEventListener('load', () => SkylixDB.init());
    }
  }
})();
