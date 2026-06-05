/* Step demos: yellow points → final app screen (like welcoming) → 4s → loop */
(function (global) {
  const STEP_MS = 2200;
  const FINAL_MS = 4000;

  const DEFAULT_FINAL_SCREENS = {
    ai: { type: 'home', title: 'Home Dashboard — same as welcoming screen' },
    wardrobe: { type: 'image', src: 'demo-wardrobe/step5-wardrobe-saved.png', title: 'Your Wardrobe — item saved' },
    tryon: { type: 'image', src: 'demo-tryon/tryon-result.png', title: 'AR Fitting Room — your look' },
    avatar: { type: 'image', src: 'demo-tryon/tryon-result.png', title: 'AR Fitting Room — your look' },
    friends: { type: 'image', src: 'phone-style-feed.png', title: 'Style Feed' },
    calendar: { type: 'calendar', title: 'Fashion Calendar — outfit planned' },
    scan3d: { type: 'image', src: 'phone-tryon.png', title: '3D Body Scan — try-on ready' },
    shopping: { type: 'image', src: 'phone-shopping.png', title: 'Smart Shopping' },
    chat: { type: 'home', title: 'Home — Ask Nikonyx' }
  };

  function fillTemplateSlot(slot, tplId, fallbackFile, assetPrefix) {
    const tpl = document.getElementById(tplId);
    if (tpl) {
      slot.innerHTML = tpl.innerHTML.replace(/\{\{asset\}\}/g, assetPrefix);
      return;
    }
    fetch(assetPrefix + fallbackFile)
      .then(r => (r.ok ? r.text() : ''))
      .then(html => {
        if (html) slot.innerHTML = html.replace(/\{\{asset\}\}/g, assetPrefix);
      })
      .catch(() => {});
  }

  function fillHomeSlot(slot, assetPrefix) {
    fillTemplateSlot(slot, 'nxHomeDashboardTpl', 'nx-home-dashboard.tpl', assetPrefix);
  }

  function fillCalendarSlot(slot, assetPrefix) {
    fillTemplateSlot(slot, 'nxCalendarScreenTpl', 'nx-calendar-screen.tpl', assetPrefix);
  }

  function injectFinalScreen(frame, featureKey, assetPrefix, finalScreens) {
    const spec = Object.assign({}, DEFAULT_FINAL_SCREENS, finalScreens)[featureKey] || DEFAULT_FINAL_SCREENS.ai;

    frame.classList.add('fp-story-frame--final', 'fp-story-frame--screen');
    frame.querySelectorAll('.fp-story-media, .fp-story-mock, .nx-scene, .nx-final-badge').forEach(el => el.remove());

    const titleEl = frame.querySelector('.fp-story-title');
    if (titleEl) titleEl.textContent = spec.title;

    let slot = frame.querySelector('.fp-story-final');
    if (!slot) {
      slot = document.createElement('div');
      const bar = frame.querySelector('.fp-story-bar');
      frame.insertBefore(slot, bar);
    }

    if (spec.type === 'home') {
      slot.className = 'fp-story-final fp-story-home';
      fillHomeSlot(slot, assetPrefix);
    } else if (spec.type === 'calendar') {
      slot.className = 'fp-story-final fp-story-calendar';
      fillCalendarSlot(slot, assetPrefix);
    } else {
      slot.className = 'fp-story-final fp-story-app-screen';
      slot.innerHTML = '<img src="' + assetPrefix + spec.src + '" alt="' + (spec.title || '') + '"/>';
    }
  }

  function initPhoneStories(cfg) {
    const {
      carouselId,
      boxSelector,
      slideSelector,
      boxActiveClass,
      labels,
      captionId,
      defaultKey,
      assetPrefix = 'assets/',
      finalScreens = {}
    } = cfg;

    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const boxes = document.querySelectorAll(boxSelector);
    const slides = carousel.querySelectorAll(slideSelector);
    const caption = captionId ? document.getElementById(captionId) : null;
    if (!boxes.length || !slides.length) return;

    let storyTimer = null;

    function initStoryView(view) {
      const slide = view.closest('[data-slide]');
      const featureKey = slide ? slide.dataset.slide : '';
      const frames = view.querySelectorAll('.fp-story-frame');

      frames.forEach((frame, i) => {
        const bar = frame.querySelector('.fp-story-progress');
        if (bar && !bar.children.length) {
          for (let j = 0; j < frames.length; j++) {
            bar.appendChild(document.createElement('i'));
          }
        }
        if (i === frames.length - 1) {
          injectFinalScreen(frame, featureKey, assetPrefix, finalScreens);
        }
      });
    }

    function setStoryProgress(view, idx) {
      const frames = view.querySelectorAll('.fp-story-frame');
      frames.forEach((frame, i) => {
        frame.classList.toggle('active', i === idx);
        frame.querySelectorAll('.fp-story-progress i').forEach((dot, j) => {
          dot.classList.toggle('on', j <= idx);
        });
      });
    }

    function stopStoryPlayback() {
      if (storyTimer) {
        clearTimeout(storyTimer);
        storyTimer = null;
      }
    }

    function runStory(view) {
      const frames = view.querySelectorAll('.fp-story-frame');
      if (!frames.length) return;

      let idx = 0;
      stopStoryPlayback();

      const tick = () => {
        setStoryProgress(view, idx);
        const delay = frames[idx].classList.contains('fp-story-frame--final') ? FINAL_MS : STEP_MS;
        storyTimer = setTimeout(() => {
          idx = (idx + 1) % frames.length;
          tick();
        }, delay);
      };

      tick();
    }

    slides.forEach(slide => {
      const view = slide.querySelector('.fp-story-view[data-story]');
      if (view) initStoryView(view);
      slide.querySelectorAll('.fp-demo-video').forEach(video => {
        video.setAttribute('data-use-story', '1');
        video.hidden = true;
      });
    });

    function show(key) {
      stopStoryPlayback();
      boxes.forEach(box => {
        const on = (box.dataset.feat || box.dataset.cap) === key;
        box.classList.toggle(boxActiveClass, on);
        box.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      let activeSlide = null;
      slides.forEach(slide => {
        const on = slide.dataset.slide === key;
        slide.classList.toggle('active', on);
        if (on) activeSlide = slide;
      });
      if (caption && labels[key]) caption.textContent = labels[key];
      if (activeSlide) {
        const view = activeSlide.querySelector('.fp-story-view[data-story]');
        if (view) {
          view.hidden = false;
          runStory(view);
        }
      }
    }

    boxes.forEach(box => {
      const select = () => show(box.dataset.feat || box.dataset.cap);
      box.addEventListener('click', select);
      box.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      });
    });

    show(defaultKey || boxes[0].dataset.feat || boxes[0].dataset.cap);

    const featsSection = carousel.closest('section') || carousel.closest('.cap-showcase');
    if (featsSection && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const active = carousel.querySelector(slideSelector + '.active');
          if (!active) return;
          const view = active.querySelector('.fp-story-view[data-story]');
          if (view) runStory(view);
        });
      }, { threshold: 0.35 });
      obs.observe(featsSection);
    }
  }

  global.initPhoneStories = initPhoneStories;
  global.NX_FINAL_SCREENS = DEFAULT_FINAL_SCREENS;
})(window);
