(() => {
  const body = document.body;
  const preloader = document.querySelector('.preloader');
  const loaderBar = document.querySelector('.loader-line span');
  const loaderValue = document.querySelector('.loader-value');
  let progress = 0;
  const loadStart = performance.now();
  const drawProgress = (value) => {
    progress = Math.min(100, value);
    if (loaderBar) loaderBar.style.width = `${progress}%`;
    if (loaderValue) loaderValue.textContent = `${Math.round(progress)}%`;
  };
  const loadTimer = setInterval(() => drawProgress(progress + Math.max(1, (92 - progress) * .09)), 45);
  const finishLoad = () => {
    clearInterval(loadTimer);
    const wait = Math.max(0, 900 - (performance.now() - loadStart));
    setTimeout(() => {
      drawProgress(100);
      setTimeout(() => {
        preloader?.classList.add('done');
        body.classList.remove('is-loading');
        setTimeout(startCounters, 500);
      }, 220);
    }, wait);
  };
  if (document.readyState === 'complete') finishLoad(); else window.addEventListener('load', finishLoad, { once: true });

  const header = document.querySelector('.header');
  const progressBar = document.querySelector('.scroll-progress span');
  const topButton = document.querySelector('.quick-top');
  const navLinks = [...document.querySelectorAll('.nav a')];
  const sections = [...document.querySelectorAll('[data-section]')];
  let scrollTick = false;
  const syncScroll = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    header?.classList.toggle('is-fixed', y > 70);
    if (progressBar) progressBar.style.width = `${Math.min(100, y / max * 100)}%`;
    if (topButton) topButton.style.opacity = y > 500 ? '1' : '.55';
    const current = [...sections].reverse().find((section) => section.offsetTop - 160 <= y);
    navLinks.forEach((link) => link.classList.toggle('active', !!current && link.getAttribute('href') === `#${current.id}`));
    scrollTick = false;
  };
  window.addEventListener('scroll', () => { if (!scrollTick) { requestAnimationFrame(syncScroll); scrollTick = true; } }, { passive: true });
  syncScroll();

  const revealItems = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -40px' });
  revealItems.forEach((item) => revealObserver.observe(item));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const runCounter = (node, duration) => {
    const target = Number(node.dataset.count || 0);
    if (reduceMotion) { node.textContent = String(target); return; }
    const start = performance.now();
    const tick = (now) => {
      const ratio = Math.min(1, (now - start) / duration);
      node.textContent = String(Math.round(target * (1 - Math.pow(1 - ratio, 3))));
      if (ratio < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  let countersStarted = false;
  function startCounters() {
    if (countersStarted) return;
    countersStarted = true;
    document.querySelectorAll('[data-count]').forEach((node, index) => {
      setTimeout(() => runCounter(node, 2200), index * 280);
    });
  }

  const area = document.querySelector('#area');
  const areaOut = document.querySelector('#area-out');
  const total = document.querySelector('#total');
  const totalNote = document.querySelector('#total-note');
  const removal = document.querySelector('#removal');
  const layerInputs = [...document.querySelectorAll('input[name="layers"]')];
  let displayedTotal = 7200;
  const animateTotal = (target) => {
    const startValue = displayedTotal;
    const start = performance.now();
    const tick = (now) => {
      const ratio = Math.min(1, (now - start) / 280);
      displayedTotal = Math.round(startValue + (target - startValue) * ratio);
      if (total) total.textContent = `от ${displayedTotal.toLocaleString('ru-RU')} ₽`;
      if (ratio < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const calculate = () => {
    if (!area) return;
    const square = Number(area.value);
    const layers = layerInputs.find((input) => input.checked)?.value || '1';
    const amount = square * (layers === '2' ? 550 : 300) + (removal?.checked ? square * 100 : 0);
    if (areaOut) areaOut.textContent = `${square} м²`;
    if (totalNote) totalNote.textContent = `${square} м² · ${layers} ${layers === '1' ? 'слой' : 'слоя'}${removal?.checked ? ' · с демонтажем' : ''}`;
    animateTotal(amount);
  };
  area?.addEventListener('input', calculate);
  removal?.addEventListener('change', calculate);
  layerInputs.forEach((input) => input.addEventListener('change', calculate));

  const galleryButtons = [...document.querySelectorAll('[data-gallery]')];
  const dialog = document.querySelector('.lightbox');
  const dialogImage = dialog?.querySelector('img');
  const dialogCaption = dialog?.querySelector('p');
  let galleryIndex = 0;
  const showGallery = (index) => {
    if (!dialog || !dialogImage || !dialogCaption || !galleryButtons.length) return;
    galleryIndex = (index + galleryButtons.length) % galleryButtons.length;
    const button = galleryButtons[galleryIndex];
    dialogImage.src = button.dataset.gallery || '';
    dialogImage.alt = button.querySelector('img')?.alt || '';
    dialogCaption.textContent = button.dataset.caption || '';
    if (!dialog.open) dialog.showModal();
  };
  galleryButtons.forEach((button, index) => button.addEventListener('click', () => showGallery(index)));
  dialog?.querySelector('.lightbox-close')?.addEventListener('click', () => dialog.close());
  dialog?.querySelector('.lightbox-prev')?.addEventListener('click', () => showGallery(galleryIndex - 1));
  dialog?.querySelector('.lightbox-next')?.addEventListener('click', () => showGallery(galleryIndex + 1));
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.addEventListener('keydown', (event) => {
    if (!dialog?.open) return;
    if (event.key === 'ArrowLeft') showGallery(galleryIndex - 1);
    if (event.key === 'ArrowRight') showGallery(galleryIndex + 1);
  });
  let touchX = 0;
  dialog?.addEventListener('touchstart', (event) => { touchX = event.changedTouches[0].clientX; }, { passive: true });
  dialog?.addEventListener('touchend', (event) => { const delta = event.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 45) showGallery(galleryIndex + (delta < 0 ? 1 : -1)); }, { passive: true });

  document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });
})();
