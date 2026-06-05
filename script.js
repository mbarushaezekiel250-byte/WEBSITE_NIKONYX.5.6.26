// ── Language dropdown ──
const LANG_KEY = 'nikonyx-lang';
const LANG_LABELS = { en: 'English', fr: 'Français', de: 'Deutsch' };

function closeLangDropdowns(except) {
  document.querySelectorAll('[data-lang-dd]').forEach((dd) => {
    if (except && dd === except) return;
    dd.classList.remove('open');
    const trigger = dd.querySelector('.lang-dd-trigger');
    const menu = dd.querySelector('.lang-dd-menu');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  });
}

function setLang(lang) {
  const code = LANG_LABELS[lang] ? lang : 'en';
  document.documentElement.lang = code === 'fr' ? 'fr' : code === 'de' ? 'de' : 'en';

  document.querySelectorAll('[data-lang-dd]').forEach((dd) => {
    dd.querySelectorAll('.lang-dd-opt').forEach((opt) => {
      const on = opt.dataset.lang === code;
      opt.classList.toggle('active', on);
      opt.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const label = dd.querySelector('.lang-dd-label');
    if (label) label.textContent = LANG_LABELS[code];
    const flag = dd.querySelector('.lang-dd-flag');
    if (flag) {
      flag.classList.remove('lang-flag--en', 'lang-flag--fr', 'lang-flag--de');
      flag.classList.add('lang-flag--' + code);
    }
  });

  closeLangDropdowns();
  try { localStorage.setItem(LANG_KEY, code); } catch (_) {}
}

document.querySelectorAll('[data-lang-dd]').forEach((dd) => {
  const trigger = dd.querySelector('.lang-dd-trigger');
  const menu = dd.querySelector('.lang-dd-menu');

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !dd.classList.contains('open');
    closeLangDropdowns();
    if (willOpen) {
      dd.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      if (menu) menu.hidden = false;
    }
  });

  dd.querySelectorAll('.lang-dd-opt').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      setLang(opt.dataset.lang);
    });
  });
});

document.addEventListener('click', () => closeLangDropdowns());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLangDropdowns();
});

let savedLang;
try { savedLang = localStorage.getItem(LANG_KEY); } catch (_) {}
setLang(savedLang && LANG_LABELS[savedLang] ? savedLang : 'en');

// ── Navbar scroll ──
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  });
}

// ── Hamburger + full-screen overlay ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const navOverlay = document.getElementById('nav-overlay');

function closeMobileNav() {
  navLinks?.classList.remove('open');
  hamburger?.classList.remove('active');
  navOverlay?.classList.remove('open');
  document.body.classList.remove('menu-open');
}

function openMobileNav() {
  navOverlay?.classList.add('open');
  hamburger?.classList.add('active');
  document.body.classList.add('menu-open');
}

if (hamburger) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navOverlay?.classList.contains('open')) closeMobileNav();
    else openMobileNav();
  });
}

navOverlay?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMobileNav);
});

document.addEventListener('click', (e) => {
  if (navbar && !navbar.contains(e.target) && !navOverlay?.contains(e.target)) {
    closeMobileNav();
  }
});

// ── Active nav link ──
const pathParts = window.location.pathname.split('/').filter(Boolean);
const currentPage = pathParts[pathParts.length - 1] || 'index.html';
const isHome = currentPage === 'index.html' || currentPage === '';

document.querySelectorAll('.nav-links a, .nav-overlay a').forEach((link) => {
  const href = link.getAttribute('href')?.split('/').pop() || '';
  if (href === currentPage || (isHome && (href === 'index.html' || href === ''))) {
    link.classList.add('active');
  }
});

// ── Reveal on scroll ──
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach((el) => observer.observe(el));
}

// ── FAQ accordion ──
document.querySelectorAll('.faq-question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── FAQ search ──
const faqSearch = document.getElementById('faqSearch');
if (faqSearch) {
  faqSearch.addEventListener('input', () => {
    const q = faqSearch.value.trim().toLowerCase();
    document.querySelectorAll('.faq-item').forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = !q || text.includes(q) ? '' : 'none';
    });
  });
}

// ── Contact form ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type=submit]');
    const name = contactForm.querySelector('[name=name]').value.trim();
    const email = contactForm.querySelector('[name=email]').value.trim();
    const msg = contactForm.querySelector('[name=message]').value.trim();
    if (!name || !email || !msg) {
      showFormMsg('Please fill in all required fields.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormMsg('Please enter a valid email address.', 'error');
      return;
    }
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      showFormMsg('Thank you! Your message has been sent.', 'success');
      contactForm.reset();
      btn.textContent = 'Send Message';
      btn.disabled = false;
    }, 1400);
  });
}

function showFormMsg(text, type) {
  let el = document.getElementById('formMsg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'formMsg';
    contactForm.appendChild(el);
  }
  el.textContent = text;
  el.style.cssText = `padding:12px 16px;border-radius:10px;font-size:14px;margin-top:10px;
    background:${type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'};
    color:${type === 'success' ? '#86efac' : '#fca5a5'};
    border:1px solid ${type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};`;
}

// ── AI search bar (home) ──
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
if (searchBtn && searchInput) {
  const runSearch = () => {
    const q = searchInput.value.trim();
    if (q) {
      alert('NX Outfit Search: "' + q + '"\n\nDownload the Nikonyx app to get full AI outfit suggestions!');
    }
  };
  searchBtn.addEventListener('click', runSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });
}

// ── Occasion chips (phone mockup + any page) ──
document.querySelectorAll('.occasion-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const row = chip.closest('.ph-chips');
    if (!row) return;
    row.querySelectorAll('.occasion-chip').forEach((c) => {
      c.classList.remove('active', 'ph-chip-active');
    });
    chip.classList.add('active', 'ph-chip-active');
  });
});
