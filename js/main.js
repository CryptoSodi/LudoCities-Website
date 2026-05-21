/* ═══════════════════════════════════════════════
   LUDO CITIES — GSAP Animations + Interactions
═══════════════════════════════════════════════ */

const { gsap, ScrollTrigger } = window;
if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ─── Theme Toggle ───────────────────────────── */
const themeToggle = document.getElementById('theme-toggle');
themeToggle?.addEventListener('click', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const next = isLight ? 'dark' : 'light';
  if (next === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('ludo-theme', next);
});

/* ─── Custom Cursor ──────────────────────────── */
const cursor = document.getElementById('cursor');
if (cursor && window.matchMedia('(hover: hover)').matches) {
  let cx = -100, cy = -100, tx = -100, ty = -100;
  document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
  (function moveCursor() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx - 6}px, ${cy - 6}px)`;
    requestAnimationFrame(moveCursor);
  })();

  // Grow cursor on interactive elements
  document.querySelectorAll('a, button, .feat-card, .nft-card, .comm-card, details').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width  = '32px';
      cursor.style.height = '32px';
      cursor.style.opacity = '0.5';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width  = '12px';
      cursor.style.height = '12px';
      cursor.style.opacity = '1';
    });
  });
}

/* ─── Nav Scroll Effect ──────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ─── Mobile Menu ────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const navMobile  = document.getElementById('nav-mobile');
hamburger?.addEventListener('click', () => {
  const open = navMobile.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  navMobile.setAttribute('aria-hidden', !open);
  const spans = hamburger.querySelectorAll('span');
  if (open) {
    gsap.to(spans[0], { rotation: 45, y: 7, duration: 0.25 });
    gsap.to(spans[1], { opacity: 0, duration: 0.15 });
    gsap.to(spans[2], { rotation: -45, y: -7, duration: 0.25 });
  } else {
    gsap.to(spans, { rotation: 0, y: 0, opacity: 1, duration: 0.25 });
  }
});
navMobile?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navMobile.classList.remove('open');
    navMobile.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    const spans = hamburger.querySelectorAll('span');
    gsap.to(spans, { rotation: 0, y: 0, opacity: 1, duration: 0.2 });
  });
});

/* ─── Hero Entrance ──────────────────────────── */
const heroTl = gsap.timeline({ delay: 0.3 });

heroTl
  .to('.hero-eyebrow', {
    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
  })
  .to('.hero-logo-img', {
    opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
  }, '-=0.3')
  .to('.hero-subtitle', {
    opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
  }, '-=0.4')
  .to('.hero-cta', {
    opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
  }, '-=0.35');

/* ─── Feature Cards ──────────────────────────── */
if (ScrollTrigger) {
  gsap.utils.toArray('.feat-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        delay: i * 0.12,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          once: true,
        }
      }
    );
  });

  /* ─── Game Preview (center fade-up) ───────── */
  gsap.fromTo('.game-text',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: '.game-preview', start: 'top 70%', once: true }
    }
  );

  /* ─── NFT Cards stagger ────────────────────── */
  gsap.utils.toArray('.nft-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)',
        delay: i * 0.1,
        scrollTrigger: { trigger: card, start: 'top 88%', once: true }
      }
    );
  });

  /* ─── Seeker section ──────────────────────── */
  gsap.fromTo('.seeker-text',
    { opacity: 0, x: -50 },
    { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: '.seeker-section', start: 'top 75%', once: true }
    }
  );
  gsap.fromTo('.seeker-visual',
    { opacity: 0, x: 50 },
    { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out', delay: 0.15,
      scrollTrigger: { trigger: '.seeker-section', start: 'top 75%', once: true }
    }
  );
  gsap.fromTo('.platform-visual',
    { opacity: 0, x: -50 },
    { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: '.platforms', start: 'top 75%', once: true }
    }
  );
  gsap.fromTo('.platform-copy',
    { opacity: 0, x: 50 },
    { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out', delay: 0.12,
      scrollTrigger: { trigger: '.platforms', start: 'top 75%', once: true }
    }
  );

  /* ─── Roadmap comet line (scroll-driven) ────── */
  const rmLine = document.getElementById('rmProgressLine');
  if (rmLine) {
    gsap.set(rmLine, { height: '0%' });
    ScrollTrigger.create({
      trigger: '.roadmap-section',
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: 0.4,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        rmLine.style.height = `${(self.progress * 100).toFixed(2)}%`;
      }
    });
  }

  /* ─── Roadmap cards entrance (one-shot per card) ──── */
  gsap.utils.toArray('.rm-timeline-item').forEach((item, i) => {
    const card = item.querySelector('.rm-glass-card');
    if (!card) return;
    const isRight = i % 2 !== 0;
    gsap.fromTo(card,
      { opacity: 0, x: isRight ? 60 : -60, scale: 0.92 },
      {
        opacity: 1, x: 0, scale: 1,
        duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 80%', once: true },
      }
    );
  });

  /* ─── Community cards ──────────────────────── */
  gsap.utils.toArray('.comm-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.3)',
        delay: i * 0.12,
        scrollTrigger: { trigger: card, start: 'top 88%', once: true }
      }
    );
  });

  /* ─── FAQ items ────────────────────────────── */
  gsap.utils.toArray('.faq-item').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, y: 14 },
      {
        opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
        delay: i * 0.08,
        scrollTrigger: { trigger: item, start: 'top 90%', once: true }
      }
    );
  });

  /* ─── Section headers ──────────────────────── */
  gsap.utils.toArray('.section-header').forEach(header => {
    gsap.fromTo(header,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: header, start: 'top 85%', once: true }
      }
    );
  });
}

/* ─── NFT Card 3D tilt ───────────────────────── */
document.querySelectorAll('.nft-card, .feat-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx   = (e.clientX - rect.left) / rect.width  - 0.5;
    const cy   = (e.clientY - rect.top)  / rect.height - 0.5;
    gsap.to(card, {
      rotateX: -cy * 8,
      rotateY:  cx * 8,
      transformPerspective: 600,
      duration: 0.3,
      ease: 'power1.out',
      overwrite: 'auto',
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
  });
});

/* ─── Smooth anchor scroll ───────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});

/* ─── Colour-coded cursor per section ───────── */
const sectionColors = {
  hero:      '#FFD600',
  features:  '#FF3B4E',
  game:      '#0091FF',
  seeker:    '#9945FF',
  roadmap:   '#FFD600',
  community: '#0091FF',
};
if (cursor && ScrollTrigger) {
  Object.entries(sectionColors).forEach(([id, color]) => {
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: 'top center',
      end: 'bottom center',
      onToggle: self => {
        if (self.isActive) cursor.style.background = color;
      },
    });
  });
}

