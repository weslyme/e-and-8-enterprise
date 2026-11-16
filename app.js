(function() {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* Navigation Scroll Effect */
  window.addEventListener('scroll', () => {
    const nav = $('#navWrap');
    if (nav) {
      if (window.scrollY > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
  });

  /* Magnetic Buttons */
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* Scroll Reveal */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  $$('.reveal').forEach(el => observer.observe(el));

  /* Progress Bar */
  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const prog = document.getElementById("progress");
    if(prog) prog.style.width = scrolled + "%";
  });

  /* Client logos: drop clients/<name>.png (or .svg/.jpg/.webp) and it replaces the initials automatically */
  $$('.client[data-logo]').forEach(tile => {
    const base = tile.dataset.logo, exts = ['svg', 'png', 'webp', 'jpg'];
    const tryNext = i => {
      if (i >= exts.length) return;
      const img = new Image();
      img.alt = tile.querySelector('h4').textContent + ' logo';
      img.onload = () => { const box = tile.querySelector('.client-logo'); box.innerHTML = ''; box.append(img); };
      img.onerror = () => tryNext(i + 1);
      img.src = base + '.' + exts[i];
    };
    tryNext(0);
  });

  /* Quote form: Web3Forms async submission */
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      const statusDiv = document.getElementById('formStatus');
      
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending...';
      submitBtn.disabled = true;
      statusDiv.classList.remove('show', 'success', 'error');

      try {
        const formData = new FormData(quoteForm);
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (data.success) {
          statusDiv.innerHTML = '<strong>Success!</strong> Thank you for your inquiry. Our team will get back to you shortly.';
          statusDiv.classList.add('show', 'success');
          quoteForm.reset();
        } else {
          statusDiv.innerHTML = '<strong>Error:</strong> ' + (data.message || 'Something went wrong. Please try again.');
          statusDiv.classList.add('show', 'error');
        }
      } catch (error) {
        statusDiv.innerHTML = '<strong>Network Error:</strong> Please check your connection and try again.';
        statusDiv.classList.add('show', 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
})();