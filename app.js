(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* Dynamic year and years in business */
  const yrEl = $('#yr');
  if (yrEl) yrEl.textContent = new Date().getFullYear();
  const years = Math.max(1, new Date().getFullYear() - 2018);
  $$('[data-years]').forEach(el => el.dataset.count = years);

  /* Split hero headline into animated words */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const wrap = (node, grad = false) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part;
            if (grad) s.className = 'grad-text';
            s.style.transitionDelay = (0.15 + i++ * 0.06) + 's';
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          const g = grad || n.classList.contains('grad-text');
          n.classList.remove('grad-text');
          wrap(n, g);
        }
      });
    };
    wrap(el);
    requestAnimationFrame(() => setTimeout(() => el.classList.add('in'), 80));
  });

  /* Scroll reveal + counters */
  const count = el => {
    const target = +el.dataset.count, dur = 1600, t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    reduce ? (el.textContent = target) : requestAnimationFrame(tick);
  };
  const reveal = el => { el.classList.add('in'); $$('[data-count]', el).forEach(count); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(reveal);
  }

  /* Nav, progress bar, mobile bar, active link */
  const navWrap = $('#navWrap'), bar = $('#progress'), mbar = $('#mobileBar');
  const links = $$('.nav-links a[href^="#"]');
  const sections = links.map(a => $(a.getAttribute('href')));
  const isQuotePage = !!$('#quoteForm') && !$('#home');

  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (navWrap) navWrap.classList.toggle('scrolled', y > 20 || isQuotePage);
    if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    if (mbar && !isQuotePage) mbar.classList.toggle('show', y > 500);
    if (sections.length) {
      let current = -1;
      sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) current = i; });
      links.forEach((a, i) => a.classList.toggle('active', i === current));
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const menuBtn = $('#menuBtn');
  if (menuBtn && navWrap) {
    const icons = {
      open: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
      close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    };
    const setMenu = open => {
      navWrap.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.innerHTML = open ? icons.close : icons.open;
    };
    setMenu(false);
    menuBtn.onclick = () => setMenu(!navWrap.classList.contains('open'));
    $$('.nav-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  }

  /* Desktop-only pointer effects */
  if (fine && !reduce) {
    $$('.card').forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px, ${(e.clientY - r.top - r.height / 2) * .2}px)`;
      });
      b.addEventListener('pointerleave', () => b.style.transform = '');
    });
    const globe = $('#globe');
    if (globe) {
      addEventListener('pointermove', e => {
        const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
        globe.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      }, { passive: true });
    }
  }

  /* Client logos: automatically load clients/<name>.(svg|png|webp|jpg) when uploaded */
  $$('.client[data-logo]').forEach(tile => {
    const base = tile.dataset.logo, exts = ['svg', 'png', 'webp', 'jpg'];
    const tryNext = i => {
      if (i >= exts.length) return;
      const img = new Image();
      img.alt = tile.querySelector('h4').textContent + ' logo';
      img.onload = () => {
        const box = tile.querySelector('.client-logo');
        box.innerHTML = '';
        box.append(img);
      };
      img.onerror = () => tryNext(i + 1);
      img.src = base + '.' + exts[i];
    };
    tryNext(0);
  });

  /* Quote form handler (on public.html) */
  const quoteForm = $('#quoteForm');
  const statusBox = $('#formStatus');
  if (quoteForm && statusBox) {
    const COMPANY_EMAIL = 'e8enterprise@gmail.com';
    quoteForm.addEventListener('submit', e => {
      e.preventDefault();
      const v = id => $('#' + id).value.trim();
      const summary = `Name: ${v('name')}\nCompany: ${v('company') || 'N/A'}\nEmail: ${v('email')}\nPhone: ${v('phone') || 'N/A'}\nInterested in: ${v('interest')}\n\nDetails:\n${v('msg')}`;
      const mailtoUrl = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent('Quote Request - ' + v('interest'))}&body=${encodeURIComponent(summary)}`;

      statusBox.innerHTML = `
        <strong>Inquiry prepared for E &amp; 8 Enterprise</strong>
        <span>Click below to open your email client with your details pre-filled, or copy your quote summary to send via Messenger or email.</span>
        <div class="form-status-actions">
          <a href="${mailtoUrl}">Open Email App</a>
          <button type="button" id="copyQuoteBtn">Copy Details</button>
        </div>
      `;
      statusBox.classList.add('show');

      $('#copyQuoteBtn').addEventListener('click', async function () {
        try {
          await navigator.clipboard.writeText(summary);
          this.textContent = 'Copied!';
          setTimeout(() => (this.textContent = 'Copy Details'), 2000);
        } catch {
          this.textContent = 'Select & Copy Manually';
        }
      });
    });
  }
})();
