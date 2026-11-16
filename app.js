/* ==========================================================================
   E & 8 Enterprise - Main JavaScript (PC & Mobile Compatible)
   ========================================================================== */

(function() {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // 1. Dynamic Year in Footer & Years in Business
  const currentYear = new Date().getFullYear();
  const yrEl = $('#yr');
  if (yrEl) yrEl.textContent = currentYear;

  const yearsActive = Math.max(1, currentYear - 2018);
  $$('[data-years]').forEach(el => {
    el.dataset.count = yearsActive;
    el.textContent = yearsActive + '+';
  });

  // 2. Scroll Progress Bar, Navbar & Mobile Bottom Bar
  const progress = $('#progress');
  const navWrap = $('#navWrap');
  const mobileBar = $('.mobile-bar');

  const onScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (progress && totalScroll > 0) {
      progress.style.width = `${(scrollY / totalScroll) * 100}%`;
    }
    if (navWrap) {
      navWrap.classList.toggle('scrolled', scrollY > 24);
    }
    if (mobileBar) {
      mobileBar.classList.toggle('show', scrollY > 320);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 3. Mobile Hamburger Menu Toggle (matches .nav-wrap.open in styles.css)
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  if (menuBtn && navWrap) {
    menuBtn.addEventListener('click', () => {
      const isOpen = navWrap.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
    if (navLinks) {
      $$('a', navLinks).forEach(link => {
        link.addEventListener('click', () => {
          navWrap.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  // 4. Scroll Reveal Observer (styles.css uses .reveal.in for opacity: 1)
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in', 'active');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in', 'active'));
  }

  // Ensure elements are visible when navigating back/forward on mobile & PC (bfcache)
  window.addEventListener('pageshow', () => {
    $$('#quote-request .reveal').forEach(el => el.classList.add('in', 'active'));
  });

  // 5. Animated Number Counters
  const countEls = $$('[data-count]');
  if ('IntersectionObserver' in window && countEls.length) {
    const countObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10) || 0;
        const suffix = el.dataset.suffix || (el.hasAttribute('data-years') ? '+' : '');
        const duration = 1200;
        const start = performance.now();

        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });

    countEls.forEach(el => countObserver.observe(el));
  }

  // 6. Card Spotlight Hover & Magnetic Buttons
  $$('.card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  $$('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // 7. Hero Globe Mouse-Tilt Effect
  const globe = $('#globe');
  if (globe) {
    window.addEventListener('pointermove', e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * -14;
      globe.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    }, { passive: true });
  }

  // 8. Automatic Client Logo Loader
  $$('.client[data-logo]').forEach(tile => {
    const base = tile.dataset.logo;
    const exts = ['svg', 'png', 'webp', 'jpg'];
    const tryNext = i => {
      if (i >= exts.length) return;
      const img = new Image();
      const titleEl = $('h4', tile);
      img.alt = (titleEl ? titleEl.textContent : 'Client') + ' logo';
      img.onload = () => {
        const box = $('.client-logo', tile);
        if (box) {
          box.innerHTML = '';
          box.append(img);
        }
      };
      img.onerror = () => tryNext(i + 1);
      img.src = `${base}.${exts[i]}`;
    };
    tryNext(0);
  });

  // 9. Web3Forms Quote Form Handler (Works on PC & Mobile)
  const quoteForm = $('#quoteForm');
  const formStatus = $('#formStatus');

  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('button[type="submit"]', quoteForm);
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending...';
      submitBtn.disabled = true;

      if (formStatus) {
        formStatus.className = 'form-status';
        formStatus.textContent = '';
      }

      try {
        const formData = new FormData(quoteForm);
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (formStatus) {
          if (data.success) {
            formStatus.innerHTML = '<strong>Success!</strong> Thank you for your inquiry. Our team will get back to you shortly.';
            formStatus.className = 'form-status show success';
            quoteForm.reset();
          } else {
            formStatus.innerHTML = '<strong>Error:</strong> ' + (data.message || 'Something went wrong. Please try again.');
            formStatus.className = 'form-status show error';
          }
        }
      } catch (error) {
        if (formStatus) {
          formStatus.innerHTML = '<strong>Network Error:</strong> Please check your connection and try again.';
          formStatus.className = 'form-status show error';
        }
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
})();