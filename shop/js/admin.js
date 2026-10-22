/**
 * SKYLIX Haute Coiffure - Admin Portal JavaScript
 * 
 * Manages Supabase Auth, photo uploads to Storage, database synchronization,
 * photo deletion with confirmation, stats overview, and configuration assistant.
 */

(function () {
  'use strict';

  // State
  let currentAdminSession = null;
  let adminPhotosList = [];
  let pendingDeleteTarget = null;
  let selectedUploadFile = null;
  let adminFilterCategory = 'All';

  // DOM Elements - Views
  const loginView = document.getElementById('loginView');
  const adminView = document.getElementById('adminView');

  // Login Form Elements
  const loginForm = document.getElementById('loginForm');
  const loginEmailInput = document.getElementById('loginEmail');
  const loginPasswordInput = document.getElementById('loginPassword');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginErrorAlert = document.getElementById('loginErrorAlert');

  // Admin Top Bar
  const adminUserEmail = document.getElementById('adminUserEmail');
  const logoutBtn = document.getElementById('logoutBtn');
  const openConfigBtn = document.getElementById('openConfigBtn');
  const openConfigFromLoginBtn = document.getElementById('openConfigFromLoginBtn');

  // Stats Elements
  const statTotalPhotos = document.getElementById('statTotalPhotos');
  const statTotalCategories = document.getElementById('statTotalCategories');
  const statStorageStatus = document.getElementById('statStorageStatus');
  const setupBannerNotice = document.getElementById('setupBannerNotice');

  // Upload Form Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('previewImg');
  const previewFileName = document.getElementById('previewFileName');
  const previewFileSize = document.getElementById('previewFileSize');
  const removePreviewBtn = document.getElementById('removePreviewBtn');
  const uploadForm = document.getElementById('uploadPhotoForm');
  const photoTitleInput = document.getElementById('photoTitle');
  const photoCategorySelect = document.getElementById('photoCategory');
  const photoDescInput = document.getElementById('photoDesc');
  const photoFeaturedCheck = document.getElementById('photoFeatured');
  const photoOrderInput = document.getElementById('photoOrder');
  const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
  const uploadProgressWrapper = document.getElementById('uploadProgressWrapper');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressText = document.getElementById('uploadProgressText');

  // Gallery Management Elements
  const adminGalleryGrid = document.getElementById('adminGalleryGrid');
  const adminGallerySearch = document.getElementById('adminGallerySearch');
  const adminFilterPills = document.querySelectorAll('.admin-filter-pill');
  const adminPhotoCountBadge = document.getElementById('adminPhotoCountBadge');

  // Modals
  const deleteModal = document.getElementById('deleteModal');
  const deleteTargetTitle = document.getElementById('deleteTargetTitle');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  const configModal = document.getElementById('configModal');
  const closeConfigModalBtn = document.getElementById('closeConfigModalBtn');
  const configSupabaseUrl = document.getElementById('configSupabaseUrl');
  const configSupabaseKey = document.getElementById('configSupabaseKey');
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  const testConnResult = document.getElementById('testConnResult');
  const saveConfigBtn = document.getElementById('saveConfigBtn');
  const copySqlBtn = document.getElementById('copySqlBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initUploadDropzone();
    initGalleryControls();
    initModals();
    initToasts();
  });

  /**
   * 1. Authentication Lifecycle
   */
  async function initAuth() {
    // Populate config fields from existing settings
    if (window.SkylixDB) {
      const creds = SkylixDB.getCredentials();
      if (configSupabaseUrl) configSupabaseUrl.value = creds.url;
      if (configSupabaseKey) configSupabaseKey.value = creds.anonKey;
    }

    // Check configuration status
    checkSupabaseConfigBanner();

    // Listen to Supabase Auth State Changes
    if (window.SkylixDB) {
      try {
        const { data } = await SkylixDB.getSession();
        if (data && data.session) {
          handleAuthSuccess(data.session);
        } else {
          showLoginView();
        }

        SkylixDB.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            handleAuthSuccess(session);
          } else if (event === 'SIGNED_OUT') {
            handleSignOut();
          }
        });
      } catch (err) {
        console.warn('[SKYLIX Admin] Auth init check:', err);
        showLoginView();
      }
    } else {
      showLoginView();
    }

    // Login Form Submit
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value;

        if (!email || !password) {
          showLoginError('Please enter both email and password.');
          return;
        }

        if (!SkylixDB.isConfigured()) {
          showLoginError('Supabase is not configured yet. Click "Configure Supabase" below to enter your project credentials.');
          openConfigModal();
          return;
        }

        setLoginLoading(true);
        hideLoginError();

        try {
          const { data, error } = await SkylixDB.signIn(email, password);
          if (error) {
            showLoginError(error.message || 'Invalid login credentials.');
          } else if (data && data.session) {
            showToast('Welcome back, Administrator.', 'success');
            handleAuthSuccess(data.session);
          }
        } catch (err) {
          showLoginError(err.message || 'Login failed. Please check your credentials and Supabase setup.');
        } finally {
          setLoginLoading(false);
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await SkylixDB.signOut();
          showToast('Signed out successfully.', 'info');
          handleSignOut();
        } catch (err) {
          console.error('Logout error:', err);
          handleSignOut();
        }
      });
    }
  }

  function handleAuthSuccess(session) {
    currentAdminSession = session;
    if (adminUserEmail) {
      adminUserEmail.textContent = session.user.email || 'Admin';
    }

    if (loginView) loginView.style.display = 'none';
    if (adminView) adminView.style.display = 'flex';

    loadAdminPhotos();
  }

  function handleSignOut() {
    currentAdminSession = null;
    showLoginView();
  }

  function showLoginView() {
    if (loginView) loginView.style.display = 'flex';
    if (adminView) adminView.style.display = 'none';
  }

  function setLoginLoading(isLoading) {
    if (!loginSubmitBtn) return;
    if (isLoading) {
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = 'Signing in... <span style="display:inline-block; width:14px; height:14px; border:2px solid rgba(0,0,0,0.2); border-top-color:#000; border-radius:50%; animation:spin 0.8s linear infinite; margin-left:8px;"></span>';
    } else {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.innerHTML = 'Sign In to Admin Portal';
    }
  }

  function showLoginError(msg) {
    if (!loginErrorAlert) return;
    loginErrorAlert.textContent = msg;
    loginErrorAlert.style.display = 'block';
  }

  function hideLoginError() {
    if (!loginErrorAlert) return;
    loginErrorAlert.style.display = 'none';
  }

  function checkSupabaseConfigBanner() {
    const isReady = SkylixDB && SkylixDB.isConfigured();
    if (setupBannerNotice) {
      setupBannerNotice.style.display = isReady ? 'none' : 'flex';
    }
    const indicatorDot = document.getElementById('connectionDot');
    const indicatorText = document.getElementById('connectionText');
    if (indicatorDot && indicatorText) {
      if (isReady) {
        indicatorDot.className = 'status-dot';
        indicatorText.textContent = 'Supabase Connected';
      } else {
        indicatorDot.className = 'status-dot warning';
        indicatorText.textContent = 'Setup Required';
      }
    }
  }

  /**
   * 2. Photo Upload & Dropzone Management
   */
  function initUploadDropzone() {
    if (!dropzone || !fileInput) return;

    // Dropzone Click opens file picker
    dropzone.addEventListener('click', (e) => {
      if (e.target !== removePreviewBtn && !removePreviewBtn?.contains(e.target)) {
        fileInput.click();
      }
    });

    // File Input change
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFileSelected(file);
    });

    // Drag and Drop Events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file) handleFileSelected(file);
    });

    // Remove selected preview
    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFileSelection();
      });
    }

    // Upload Form Submit
    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedUploadFile) {
          showToast('Please select an image file to upload.', 'warning');
          return;
        }

        const title = photoTitleInput.value.trim();
        if (!title) {
          showToast('Please enter a photo title.', 'warning');
          photoTitleInput.focus();
          return;
        }

        const metadata = {
          title: title,
          category: photoCategorySelect.value,
          description: photoDescInput.value.trim(),
          is_featured: photoFeaturedCheck.checked,
          display_order: parseInt(photoOrderInput.value, 10) || 0
        };

        // Start upload process
        setUploadLoading(true);

        try {
          await SkylixDB.uploadPhoto(selectedUploadFile, metadata, (progress, message) => {
            if (uploadProgressWrapper && uploadProgressBar && uploadProgressText) {
              uploadProgressWrapper.classList.add('active');
              uploadProgressBar.style.width = `${progress}%`;
              uploadProgressText.textContent = `${message} (${progress}%)`;
            }
          });

          showToast('Photo uploaded and published to gallery!', 'success');
          resetUploadForm();
          await loadAdminPhotos();

        } catch (err) {
          console.error('[SKYLIX Admin] Upload error:', err);
          showToast(err.message || 'Upload failed. Check storage bucket & policies.', 'error');
        } finally {
          setUploadLoading(false);
          if (uploadProgressWrapper) {
            setTimeout(() => {
              uploadProgressWrapper.classList.remove('active');
            }, 1200);
          }
        }
      });
    }
  }

  function handleFileSelected(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('Unsupported file type. Please choose a JPG, PNG, or WebP image.', 'error');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('File exceeds 10MB limit. Please choose a smaller image.', 'error');
      return;
    }

    selectedUploadFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewFileName.textContent = file.name;
      previewFileSize.textContent = formatBytes(file.size);
      previewContainer.style.display = 'flex';
      dropzone.querySelector('.dropzone-icon').style.display = 'none';
      dropzone.querySelector('.dropzone-title').style.display = 'none';
      dropzone.querySelector('.dropzone-subtitle').style.display = 'none';
    };
    reader.readAsDataURL(file);

    // Auto-fill title if empty
    if (photoTitleInput && !photoTitleInput.value) {
      const cleanName = file.name
        .substring(0, file.name.lastIndexOf('.'))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      photoTitleInput.value = cleanName;
    }
  }

  function clearFileSelection() {
    selectedUploadFile = null;
    fileInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
    const icon = dropzone.querySelector('.dropzone-icon');
    const title = dropzone.querySelector('.dropzone-title');
    const subtitle = dropzone.querySelector('.dropzone-subtitle');
    if (icon) icon.style.display = 'block';
    if (title) title.style.display = 'block';
    if (subtitle) subtitle.style.display = 'block';
  }

  function resetUploadForm() {
    clearFileSelection();
    if (photoTitleInput) photoTitleInput.value = '';
    if (photoDescInput) photoDescInput.value = '';
    if (photoFeaturedCheck) photoFeaturedCheck.checked = false;
    if (photoOrderInput) photoOrderInput.value = '0';
  }

  function setUploadLoading(isLoading) {
    if (!uploadSubmitBtn) return;
    uploadSubmitBtn.disabled = isLoading;
    if (isLoading) {
      uploadSubmitBtn.textContent = 'Uploading to Cloud...';
    } else {
      uploadSubmitBtn.textContent = 'Upload & Publish Photo';
    }
  }

  /**
   * 3. Gallery Management & Deletion
   */
  async function loadAdminPhotos() {
    if (!adminGalleryGrid) return;

    adminGalleryGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 0; color: var(--text-muted);">
        <div style="display:inline-block; width:30px; height:30px; border:2px solid rgba(212,175,55,0.2); border-top-color:#D4AF37; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
        <p style="margin-top: 12px; font-size: 0.85rem;">Loading cloud gallery...</p>
      </div>
    `;

    try {
      const res = await SkylixDB.getGalleryImages('All');
      adminPhotosList = res.data || [];
      updateDashboardStats(adminPhotosList, res.isDemo);
      renderAdminGallery();
    } catch (err) {
      console.error('[SKYLIX Admin] Load error:', err);
      adminGalleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--danger-color);">
          <p>Failed to load photos: ${err.message}</p>
        </div>
      `;
    }
  }

  function updateDashboardStats(photos, isDemo) {
    if (statTotalPhotos) statTotalPhotos.textContent = photos.length;

    // Count unique categories
    const categories = new Set(photos.map(p => p.category).filter(Boolean));
    if (statTotalCategories) statTotalCategories.textContent = categories.size;

    // Storage Status
    if (statStorageStatus) {
      if (!isDemo && SkylixDB.isConfigured()) {
        statStorageStatus.textContent = 'Active (Live)';
        statStorageStatus.style.color = '#10b981';
      } else {
        statStorageStatus.textContent = 'Demo Mode';
        statStorageStatus.style.color = 'var(--gold-light)';
      }
    }

    if (adminPhotoCountBadge) {
      adminPhotoCountBadge.textContent = `${photos.length} Photos`;
    }
  }

  function initGalleryControls() {
    // Search Filter
    if (adminGallerySearch) {
      adminGallerySearch.addEventListener('input', () => {
        renderAdminGallery();
      });
    }

    // Category Filter Pills
    adminFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        adminFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        adminFilterCategory = pill.getAttribute('data-admin-filter') || 'All';
        renderAdminGallery();
      });
    });
  }

  function renderAdminGallery() {
    if (!adminGalleryGrid) return;

    const searchTerm = (adminGallerySearch?.value || '').toLowerCase().trim();

    let filtered = adminPhotosList.filter(item => {
      const matchesCategory = adminFilterCategory === 'All' || 
                              (item.category || '').toLowerCase() === adminFilterCategory.toLowerCase();
      const matchesSearch = !searchTerm || 
                            (item.title || '').toLowerCase().includes(searchTerm) || 
                            (item.description || '').toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      adminGalleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: rgba(255,255,255,0.02); border: 1px dashed var(--admin-border-subtle); border-radius: var(--radius-md);">
          <p style="color: var(--text-muted); font-size: 0.95rem;">No photos match the selected filters.</p>
        </div>
      `;
      return;
    }

    adminGalleryGrid.innerHTML = filtered.map(item => {
      const id = item.id;
      const title = escapeHtml(item.title || 'Untitled');
      const category = escapeHtml(item.category || 'General');
      const desc = escapeHtml(item.description || '');
      const imgUrl = item.image_url;
      const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';
      const isDemo = Boolean(item.is_demo);
      const isFeatured = Boolean(item.is_featured);

      return `
        <div class="admin-photo-card" id="photo-card-${id}">
          <div class="admin-photo-thumbnail">
            <img src="${imgUrl}" alt="${title}" loading="lazy" onerror="this.src='../assets/images/hero-salon.jpg'" />
            <span class="admin-photo-badge">${category}</span>
            ${isFeatured ? '<span class="admin-photo-featured">★ Featured</span>' : ''}
          </div>
          <div class="admin-photo-body">
            <h4 class="admin-photo-title">${title}</h4>
            ${desc ? `<p class="admin-photo-desc">${desc}</p>` : ''}
            <div class="admin-photo-footer">
              <span class="admin-photo-date">${dateStr} ${isDemo ? '• Demo' : ''}</span>
              <button class="btn-delete-photo" onclick="window.promptDeletePhoto('${id}', '${escapeJs(title)}', '${item.storage_path || ''}', ${isDemo})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 4. Delete Confirmation Flow
   */
  window.promptDeletePhoto = (id, title, storagePath, isDemo) => {
    pendingDeleteTarget = { id, title, storagePath, isDemo };
    if (deleteTargetTitle) deleteTargetTitle.textContent = title;
    if (deleteModal) deleteModal.classList.add('active');
  };

  function initModals() {
    // Delete Modal Actions
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', () => {
        if (deleteModal) deleteModal.classList.remove('active');
        pendingDeleteTarget = null;
      });
    }

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async () => {
        if (!pendingDeleteTarget) return;

        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';

        try {
          if (pendingDeleteTarget.isDemo) {
            // Remove demo item from memory
            adminPhotosList = adminPhotosList.filter(p => p.id !== pendingDeleteTarget.id);
            showToast(`Demo photo "${pendingDeleteTarget.title}" deleted from view.`, 'info');
          } else {
            await SkylixDB.deletePhoto(pendingDeleteTarget.id, pendingDeleteTarget.storagePath);
            showToast(`Photo "${pendingDeleteTarget.title}" deleted from cloud database and storage.`, 'success');
            await loadAdminPhotos();
          }

          renderAdminGallery();
          updateDashboardStats(adminPhotosList, false);

        } catch (err) {
          console.error('[SKYLIX Admin] Delete error:', err);
          showToast(`Delete failed: ${err.message}`, 'error');
        } finally {
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = 'Yes, Delete Photo';
          if (deleteModal) deleteModal.classList.remove('active');
          pendingDeleteTarget = null;
        }
      });
    }

    // Config Modal Actions
    if (openConfigBtn) openConfigBtn.addEventListener('click', openConfigModal);
    if (openConfigFromLoginBtn) openConfigFromLoginBtn.addEventListener('click', openConfigModal);
    if (closeConfigModalBtn) closeConfigModalBtn.addEventListener('click', closeConfigModal);

    // Save Supabase Credentials
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener('click', () => {
        const url = configSupabaseUrl.value.trim();
        const key = configSupabaseKey.value.trim();

        if (!url || !key) {
          showToast('Please provide both Project URL and Anon Key.', 'warning');
          return;
        }

        SkylixDB.saveCredentials(url, key);
        checkSupabaseConfigBanner();
        showToast('Supabase credentials saved successfully!', 'success');
        closeConfigModal();
        loadAdminPhotos();
      });
    }

    // Test Supabase Connection
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', async () => {
        const url = configSupabaseUrl.value.trim();
        const key = configSupabaseKey.value.trim();

        if (!url || !key) {
          showTestResult(false, 'Please fill in both URL and Anon Key before testing.');
          return;
        }

        testConnectionBtn.disabled = true;
        testConnectionBtn.textContent = 'Testing connection...';
        showTestResult(null, 'Pinging Supabase database and storage...');

        try {
          // Temporarily set credentials for test
          SkylixDB.saveCredentials(url, key);
          const res = await SkylixDB.testConnection();

          if (res.success) {
            let msg = `✓ Connection successful! Found ${res.photoCount} photos in gallery table.`;
            if (res.storageWarning) {
              msg += ` (Note: ${res.storageWarning})`;
            }
            showTestResult(true, msg);
          } else {
            showTestResult(false, `✗ ${res.error}`);
          }
        } catch (err) {
          showTestResult(false, `✗ Error: ${err.message}`);
        } finally {
          testConnectionBtn.disabled = false;
          testConnectionBtn.textContent = 'Test Live Connection';
        }
      });
    }

    // Copy SQL Schema
    if (copySqlBtn) {
      copySqlBtn.addEventListener('click', async () => {
        try {
          const res = await fetch('../supabase/schema.sql');
          const sql = await res.text();
          await navigator.clipboard.writeText(sql);
          showToast('SQL schema copied to clipboard! Paste it into your Supabase SQL Editor.', 'success');
        } catch (err) {
          showToast('Unable to copy automatically. Please open supabase/schema.sql.', 'info');
        }
      });
    }
  }

  function openConfigModal() {
    if (configModal) configModal.classList.add('active');
  }

  function closeConfigModal() {
    if (configModal) configModal.classList.remove('active');
  }

  function showTestResult(isSuccess, message) {
    if (!testConnResult) return;
    testConnResult.style.display = 'block';
    if (isSuccess === true) {
      testConnResult.style.color = '#10b981';
      testConnResult.style.background = 'rgba(16, 185, 129, 0.1)';
      testConnResult.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    } else if (isSuccess === false) {
      testConnResult.style.color = '#ef4444';
      testConnResult.style.background = 'rgba(239, 68, 68, 0.1)';
      testConnResult.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    } else {
      testConnResult.style.color = 'var(--text-muted)';
      testConnResult.style.background = 'rgba(255, 255, 255, 0.05)';
      testConnResult.style.border = '1px solid var(--admin-border-subtle)';
    }
    testConnResult.textContent = message;
  }

  /**
   * 5. Toast Notifications
   */
  function initToasts() {}

  function showToast(message, type = 'success', duration = 4000) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';
    if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `
      <span style="font-weight:bold; font-size:1.1rem;">${icon}</span>
      <span style="flex-grow:1;">${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeJs(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

})();
