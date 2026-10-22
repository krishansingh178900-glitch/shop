/**
 * SKYLIX Haute Coiffure - Public Website JavaScript
 * Handles navigation, dynamic Supabase gallery loading, filtering, lightbox,
 * and WhatsApp appointment booking generator.
 */

(function () {
  'use strict';

  let currentCategory = 'All';
  let allGalleryData = [];

  // DOM Elements
  const header = document.getElementById('siteHeader');
  const mobileMenuBtn = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryBadge = document.getElementById('galleryBadge');
  const galleryBadgeText = document.getElementById('galleryBadgeText');

  // Lightbox Elements
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');

  // Booking Form Elements
  const bookingForm = document.getElementById('bookingForm');
  const bookingServiceSelect = document.getElementById('bookingService');

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileNav();
    initServiceTabs();
    initGallery();
    initLightbox();
    initBookingForm();
    initSmoothScroll();
  });

  /**
   * 1. Header scroll effect
   */
  function initHeaderScroll() {
    if (!header) return;
    const handleScroll = () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /**
   * 2. Mobile navigation toggle
   */
  function initMobileNav() {
    if (!mobileMenuBtn || !navMenu) return;
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
      mobileMenuBtn.innerHTML = isOpen ? '✕' : '☰';
    });

    // Close menu when clicking any nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.innerHTML = '☰';
      });
    });
  }

  /**
   * 3. Services & Pricing tab switching
   */
  function initServiceTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.service-category-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetCategory = btn.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPanel = document.getElementById(`panel-${targetCategory}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });

    // Handle "Book Service" buttons inside service list
    document.querySelectorAll('.service-book-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const serviceName = btn.getAttribute('data-service');
        if (serviceName && bookingServiceSelect) {
          // Preselect in booking form
          for (let option of bookingServiceSelect.options) {
            if (option.value === serviceName || option.text.includes(serviceName)) {
              bookingServiceSelect.value = option.value;
              break;
            }
          }
          // Smooth scroll to booking section
          const bookingSection = document.getElementById('booking');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  /**
   * 4. Dynamic Gallery Loader (Supabase + fallback)
   */
  async function initGallery() {
    if (!galleryGrid) return;

    // Filter Buttons Click
    galleryFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        galleryFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-filter') || 'All';
        renderGallery();
      });
    });

    // Load items from Supabase
    await loadGalleryData();
  }

  async function loadGalleryData() {
    galleryGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0;">
        <div style="display: inline-block; width: 38px; height: 38px; border: 3px solid rgba(212,175,55,0.2); border-top-color: #D4AF37; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="color: var(--text-muted); margin-top: 16px; font-size: 0.9rem;">Connecting to SKYLIX Cloud Gallery...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    try {
      if (window.SkylixDB) {
        const res = await window.SkylixDB.getGalleryImages('All');
        allGalleryData = res.data || [];

        // Update status badge
        if (galleryBadge && galleryBadgeText) {
          if (!res.isDemo && SkylixDB.isConfigured()) {
            galleryBadge.classList.add('live');
            galleryBadgeText.innerHTML = '<span class="pulse-dot"></span> Live Supabase Cloud Sync Active';
          } else {
            galleryBadge.classList.remove('live');
            galleryBadgeText.textContent = '✨ Curated Portfolio Showcase';
          }
        }
      } else {
        allGalleryData = [];
      }
    } catch (err) {
      console.error('[SKYLIX] Error loading gallery:', err);
      allGalleryData = [];
    }

    renderGallery();
  }

  function renderGallery() {
    if (!galleryGrid) return;

    let filtered = allGalleryData;
    if (currentCategory && currentCategory !== 'All') {
      filtered = allGalleryData.filter(item => {
        return (item.category || '').toLowerCase() === currentCategory.toLowerCase();
      });
    }

    if (filtered.length === 0) {
      galleryGrid.innerHTML = `
        <div class="gallery-empty" style="grid-column: 1 / -1;">
          <div class="gallery-empty-icon">✂</div>
          <h3>No Photos in This Category Yet</h3>
          <p>Our stylists regularly publish new couture work. Select another category or check back shortly.</p>
          <a href="admin/index.html" class="btn btn-outline-gold" style="font-size: 0.78rem; padding: 10px 20px;">Open Admin Uploader</a>
        </div>
      `;
      return;
    }

    galleryGrid.innerHTML = filtered.map((item, index) => {
      const title = escapeHtml(item.title || 'Haute Coiffure');
      const category = escapeHtml(item.category || 'Signature Cuts');
      const desc = escapeHtml(item.description || '');
      const imgUrl = item.image_url;

      return `
        <div class="gallery-item" data-index="${index}" onclick="window.openLightbox(${index})">
          <img src="${imgUrl}" alt="${title}" loading="lazy" onerror="this.src='assets/images/hero-salon.jpg'" />
          <div class="gallery-zoom-hint">⤢</div>
          <div class="gallery-item-overlay">
            <span class="gallery-category-pill">${category}</span>
            <h3 class="gallery-item-title">${title}</h3>
            ${desc ? `<p class="gallery-item-desc">${desc}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach filtered array to window for lightbox reference
    window.currentFilteredGallery = filtered;
  }

  /**
   * 5. Lightbox Modal logic
   */
  function initLightbox() {
    if (!lightboxModal) return;

    window.openLightbox = (index) => {
      const items = window.currentFilteredGallery || allGalleryData;
      const item = items[index];
      if (!item) return;

      lightboxImg.src = item.image_url;
      lightboxCategory.textContent = item.category || 'Signature Cuts';
      lightboxTitle.textContent = item.title || 'SKYLIX Creation';
      lightboxDesc.textContent = item.description || 'Exclusive salon styling by SKYLIX Master Artists.';
      lightboxModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightboxModal.classList.remove('active');
      document.body.style.overflow = '';
      if (lightboxImg) lightboxImg.src = '';
    };

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  /**
   * 6. WhatsApp Concierge Appointment Generator
   */
  function initBookingForm() {
    if (!bookingForm) return;

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('bookingName').value.trim();
      const phone = document.getElementById('bookingPhone').value.trim();
      const service = document.getElementById('bookingService').value;
      const stylist = document.getElementById('bookingStylist').value;
      const date = document.getElementById('bookingDate').value;
      const time = document.getElementById('bookingTime').value;
      const notes = document.getElementById('bookingNotes').value.trim();

      const whatsappNumber = (window.SKYLIX_CONFIG && window.SKYLIX_CONFIG.SALON_WHATSAPP) || '15557495490';

      // Build elegant message
      let message = `*SKYLIX SALON APPOINTMENT REQUEST*\n`;
      message += `----------------------------------------\n`;
      message += `• *Guest Name:* ${name}\n`;
      if (phone) message += `• *Phone:* ${phone}\n`;
      message += `• *Desired Service:* ${service}\n`;
      message += `• *Preferred Stylist:* ${stylist}\n`;
      if (date) message += `• *Preferred Date:* ${date}\n`;
      if (time) message += `• *Preferred Time:* ${time}\n`;
      if (notes) message += `• *Special Notes:* ${notes}\n`;
      message += `----------------------------------------\n`;
      message += `Sent via SKYLIX Online Concierge`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  /**
   * 7. Smooth scroll for anchor navigation
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
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

  // Expose global refresh function so Admin operations can trigger re-fetches if embedded
  window.refreshSkylixGallery = loadGalleryData;

})();
