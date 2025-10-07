// Header scroll shadow
const header = document.querySelector(".site-header");
const toTop = document.getElementById("toTop");
const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");

function onScroll() {
  const y = window.scrollY || document.documentElement.scrollTop;
  if (y > 10) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
  if (y > 160) toTop.classList.add("show");
  else toTop.classList.remove("show");
  if (toTop) {
    const doc = document.documentElement;
    const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const p = Math.min(100, Math.max(0, (y / max) * 100));
    toTop.style.setProperty("--progress", p.toFixed(1));
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Theme switcher removed – using default theme only

// Mobile nav: right drawer with overlay + animated button
(function initMobileNav() {
  const overlay = document.getElementById("navOverlay");
  const navClose = document.getElementById("navClose");
  if (!nav || !navToggle) return;

  // Move language switcher into the drawer on mobile, back on desktop
  const langSwitch = document.getElementById("langSwitch");
  const headerContainer = document.querySelector(".container.nav");
  function relocateLang() {
    if (!langSwitch) return;
    if (window.innerWidth <= 1024) {
      if (langSwitch.parentElement !== nav) nav.appendChild(langSwitch);
    } else if (headerContainer) {
      // place after nav in header
      if (langSwitch.parentElement !== headerContainer) {
        headerContainer.appendChild(langSwitch);
      }
    }
  }
  relocateLang();
  // Attach robust handlers to drawer links: close and smooth-scroll
  function bindDrawerLinks() {
    const links = nav.querySelectorAll('a[href^="#"]');
    links.forEach((a) => {
      a.addEventListener(
        "click",
        (e) => {
          const hash = a.getAttribute("href");
          if (!hash || hash === "#") return;
          const id = hash.slice(1);
          const target = document.getElementById(id);
          if (!target) return;
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function")
            e.stopImmediatePropagation();
          closeMenu();
          setTimeout(() => {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            try {
              history.replaceState(null, "", hash);
            } catch {}
          }, 60);
        },
        { capture: true }
      );
    });
  }
  bindDrawerLinks();

  function openMenu() {
    nav.classList.add("show");
    navToggle.classList.add("active");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Закрыть меню");
    overlay?.classList.add("show");
    if (overlay) overlay.hidden = false;
    if (navClose) navClose.hidden = false;
    document.body.classList.add("menu-open");
    relocateLang();
  }

  function closeMenu() {
    nav.classList.remove("show");
    navToggle.classList.remove("active");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Открыть меню");
    overlay?.classList.remove("show");
    if (overlay) overlay.hidden = true;
    if (navClose) navClose.hidden = true;
    document.body.classList.remove("menu-open");
  }

  function toggleMenu() {
    if (nav.classList.contains("show")) closeMenu();
    else openMenu();
  }

  navToggle.addEventListener("click", toggleMenu);
  navClose?.addEventListener("click", closeMenu);
  // Close on overlay click as well (more intuitive)
  overlay?.addEventListener("click", closeMenu);
  // Guard against other delegated handlers
  nav?.addEventListener(
    "click",
    (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) e.stopPropagation();
    },
    { capture: true }
  );

  // Close when switching language inside the drawer (after applying language)
  // Important: do NOT capture/stopPropagation so the actual language handler receives the click
  nav?.querySelectorAll("#langSwitch [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setTimeout(closeMenu, 30);
    });
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  // Close on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) closeMenu();
    relocateLang();
    bindDrawerLinks();
  });
})();

// FAQ collapses: JS-driven animation for open/close
// Smooth height + fade/slide without layout jank
(function faqAnimateJs() {
  const detailsList = Array.from(
    document.querySelectorAll("#faq .faq-new details")
  );
  if (!detailsList.length) return;

  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const DURATION = 280;

  detailsList.forEach((el) => {
    const summary = el.querySelector("summary");
    const content = el.querySelector(".answer") || summary?.nextElementSibling;
    if (!summary || !content) return;

    let animating = false;

    function finish(resetOpenOnly) {
      content.style.height = "";
      content.style.transition = "";
      content.style.overflow = "";
      content.style.opacity = "";
      content.style.transform = "";
      content.style.paddingTop = "";
      content.style.paddingBottom = "";
      animating = false;
    }

    function expand() {
      if (animating) return;
      animating = true;
      // Prepare
      const cs = getComputedStyle(content);
      const padTop = parseFloat(cs.paddingTop) || 0;
      const padBottom = parseFloat(cs.paddingBottom) || 0;
      content.style.overflow = "hidden";
      content.style.paddingTop = "0px";
      content.style.paddingBottom = "0px";
      content.style.height = "0px";
      content.style.opacity = "0";
      content.style.transform = "translateY(-4px)";
      // Make it open so content is measurable
      el.setAttribute("open", "");
      const target = content.scrollHeight + padTop + padBottom;
      // Animate to target height
      requestAnimationFrame(() => {
        content.style.transition = `height ${DURATION}ms ${EASE}, opacity 200ms ease, transform 200ms ease, padding-top ${DURATION}ms ${EASE}, padding-bottom ${DURATION}ms ${EASE}`;
        content.style.height = target + "px";
        content.style.paddingTop = padTop + "px";
        content.style.paddingBottom = padBottom + "px";
        content.style.opacity = "1";
        content.style.transform = "translateY(0)";
      });
      const onEnd = (ev) => {
        if (ev.target !== content || ev.propertyName !== "height") return;
        content.removeEventListener("transitionend", onEnd);
        finish();
      };
      content.addEventListener("transitionend", onEnd);
    }

    function collapse() {
      if (animating) return;
      animating = true;
      // Start from current height
      const cs = getComputedStyle(content);
      const padTop = parseFloat(cs.paddingTop) || 0;
      const padBottom = parseFloat(cs.paddingBottom) || 0;
      const start = content.scrollHeight + padTop + padBottom;
      content.style.overflow = "hidden";
      content.style.height = start + "px";
      // force reflow to apply the start height
      void content.offsetHeight;
      requestAnimationFrame(() => {
        content.style.transition = `height ${DURATION}ms ${EASE}, opacity 200ms ease, transform 200ms ease, padding-top ${DURATION}ms ${EASE}, padding-bottom ${DURATION}ms ${EASE}`;
        content.style.height = "0px";
        content.style.paddingTop = "0px";
        content.style.paddingBottom = "0px";
        content.style.opacity = "0";
        content.style.transform = "translateY(-4px)";
      });
      const onEnd = (ev) => {
        if (ev.target !== content || ev.propertyName !== "height") return;
        content.removeEventListener("transitionend", onEnd);
        el.removeAttribute("open");
        finish();
      };
      content.addEventListener("transitionend", onEnd);
    }

    function onToggle(e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function")
        e.stopImmediatePropagation();
      if (el.hasAttribute("open")) collapse();
      else expand();
    }

    summary.addEventListener("click", onToggle, { capture: true });
    summary.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter" || e.key === " ") onToggle(e);
      },
      { capture: true }
    );
  });
})();

// To top button
toTop?.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

// Smooth wheel scrolling for the page (non-touch, no reduced-motion)
(function smoothWheelScroll() {
  const prefersReduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  if (prefersReduce || isCoarse) return;

  let targetY = window.scrollY || document.documentElement.scrollTop || 0;
  let currentY = targetY;
  let ticking = false;

  const MAX_STEP = 10; // cap per event after normalization
  const SPEED = 1.0; // multiplier from wheel delta to pixels
  const EASE = 0.1; // higher = быстрее реагирует, короче шлейф
  const KICK = 0.1; // мгновенный шаг сразу при событии
  const STOP_EPS = 0.2;

  function normDelta(e) {
    let d = e.deltaY;
    if (e.deltaMode === 1) d *= 16; // lines → px
    else if (e.deltaMode === 2) d *= window.innerHeight; // page → px
    return Math.max(-MAX_STEP, Math.min(MAX_STEP, d));
  }

  function canScroll(el) {
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight
    )
      return true;
    return false;
  }

  function hasScrollableParent(node) {
    let el = node;
    while (el && el !== document.body && el !== document.documentElement) {
      if (canScroll(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function animate() {
    ticking = true;
    const diff = targetY - currentY;
    currentY += diff * EASE;
    if (Math.abs(diff) <= STOP_EPS) {
      currentY = targetY;
      window.scrollTo(0, Math.round(currentY));
      ticking = false;
      return;
    }
    window.scrollTo(0, Math.round(currentY));
    requestAnimationFrame(animate);
  }

  window.addEventListener(
    "wheel",
    (e) => {
      // Ignore when user is interacting with scrollable containers or menu drawer
      if (document.body.classList.contains("menu-open")) return; // allow native in drawer
      const scrollable = hasScrollableParent(e.target);
      if (scrollable) return; // let inner element handle its own scroll

      // Our custom smooth scroll
      e.preventDefault();
      const delta = normDelta(e) * SPEED;

      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - window.innerHeight, 0);

      // Base for calculations is the real scroll position
      currentY = window.scrollY || document.documentElement.scrollTop || 0;
      // Immediate reaction: apply small part of delta right now
      const kickY = Math.min(max, Math.max(0, currentY + delta * KICK));
      if (kickY !== currentY) window.scrollTo(0, Math.round(kickY));
      currentY = kickY;

      // Continue smoothly towards full delta target
      targetY = Math.min(max, Math.max(0, currentY + delta * (1 - KICK)));
      if (!ticking) requestAnimationFrame(animate);
    },
    { passive: false }
  );

  // Keep target in sync when user scrolls via keyboard/touchpad momentum
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        targetY = window.scrollY || document.documentElement.scrollTop || 0;
        currentY = targetY;
      }
    },
    { passive: true }
  );
})();

// Active nav link by section
const sections = Array.from(document.querySelectorAll("main section[id]"));
const navLinks = Array.from(
  document.querySelectorAll('.nav-links a[href^="#"]')
);
const byId = (href) => href.replace("#", "");

const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute("id");
      if (entry.isIntersecting) {
        navLinks.forEach((l) =>
          l.classList.toggle("active", byId(l.getAttribute("href")) === id)
        );
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
);

sections.forEach((s) => obs.observe(s));

// Reveal animations on scroll
const revealEls = Array.from(document.querySelectorAll(".reveal"));
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach((el) => revealObs.observe(el));

// Contact form simple validation
const form = document.getElementById("contactForm");
const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();
  const errName = document.getElementById("errName");
  const errEmail = document.getElementById("errEmail");
  const errMessage = document.getElementById("errMessage");
  errName.textContent = errEmail.textContent = errMessage.textContent = "";

  let ok = true;
  if (name.length < 2) {
    errName.textContent = "Укажите имя (2+ символа).";
    ok = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEmail.textContent = "Некорректный email.";
    ok = false;
  }
  if (message.length < 10) {
    errMessage.textContent = "Сообщение слишком короткое.";
    ok = false;
  }
  if (!ok) return;

  // Demo success (no backend here)
  form.reset();
  const btn = form.querySelector("button");
  const text = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Отправлено ✓";
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = text;
  }, 2000);
});

// Smooth FAQ accordion animations
(function initFaqAccordion() {
  const acc = Array.from(document.querySelectorAll("#faq .faq-new details"));
  if (!acc.length) return;

  // Используем чисто CSS-анимации (max-height/opacity/transform)
  acc.forEach((el) => {
    const summary = el.querySelector("summary");
    if (!summary) return;

    function onToggleClick(e) {
      e.preventDefault();
      if (el.hasAttribute("open")) el.removeAttribute("open");
      else el.setAttribute("open", "");
    }

    summary.addEventListener("click", onToggleClick);
    summary.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        onToggleClick(e);
      }
    });
  });
})();

// Simple i18n (RU, EN, ET)
(function initI18n() {
  const i18n = {
    ru: {
      "#home@data-hero-text":
        "Современные сайты «под ключ» для бизнеса и брендов",
      // Hero
      "#home .hero-text h1:nth-of-type(1)":
        "Современные сайты под ключ для бизнеса и брендов",
      "#home .hero-text h1:nth-of-type(2)": "Дизайн, верстка и запуск под ключ",
      "#home .hero-text p":
        "Делаем быстрые, понятные и красивые сайты, которые помогают вашему бизнесу расти.",
      "#home .cta a.btn.btn-gradient": "Обсудить проект",
      "#home .cta a.btn.btn-ghost": "Услуги",
      "#home .badges li:nth-of-type(1)": "Адаптивная верстка",
      "#home .badges li:nth-of-type(2)": "SEO‑оптимизация",
      "#home .badges li:nth-of-type(3)": "Поддержка после запуска",

      // About
      "#about h2": "О нас",
      "#about .reveal p":
        "Проектируем и создаём сайты, ориентируясь на бизнес‑цели и удобство пользователя. Работаем прозрачно и в срок.",
      "#about .checklist li:nth-of-type(1)": "UX/UI‑дизайн и прототипирование",
      "#about .checklist li:nth-of-type(2)":
        "Адаптивная верстка на современных стандартах",
      "#about .checklist li:nth-of-type(3)":
        "Высокая скорость загрузки и качество",
      "#about .checklist li:nth-of-type(4)": "SEO, аналитика и поддержка",

      // Process
      "#process .container > h2.center": "От заявки до готового сайта",
      "#process .lead.center": "Как мы работаем: три простых шага.",
      "#process .step:nth-of-type(1) h3": "Заявка и бриф",
      "#process .step:nth-of-type(1) p":
        "Обсуждаем цели, собираем требования и формируем план работ.",
      "#process .step:nth-of-type(2) h3": "Дизайн и разработка",
      "#process .step:nth-of-type(2) p":
        "Создаём дизайн, верстаем страницы и интегрируем функциональность.",
      "#process .step:nth-of-type(3) h3": "Запуск и поддержка",
      "#process .step:nth-of-type(3) p":
        "Публикуем сайт, подключаем аналитику и остаёмся на связи.",

      // Services
      "#services .container > h2:nth-of-type(2)": "Цены и услуги",
      "#services .lead.center":
        "Выберите подходящий пакет — подберём оптимальное решение под вашу задачу.",
      "#services .pricing-grid > article:nth-of-type(1) h3": "Сайт‑визитка",
      "#services .pricing-grid > article:nth-of-type(2) h3":
        "Корпоративный сайт",
      // Main pricing – card 1
      "#services .pricing-grid > article:nth-of-type(1) .price": "100 €",
      "#services .pricing-grid > article:nth-of-type(1) .desc":
        "Подходит для малого бизнеса, лендинга, портфолио и персональных проектов.",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(1)":
        "Индивидуальный дизайн с анимацией",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(2)":
        "Адаптивность под все устройства",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(3)":
        "Создание 1 главной страницы",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(4)":
        "Установка на хостинг + подключение домена",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(5)":
        "Базовая SEO‑оптимизация",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(6)":
        "Гарантия на сайт 1 год",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(7)":
        "Бесплатные правки первый месяц",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(8)":
        "Срок выполнения — от 5 дней",
      "#services .pricing-grid > article:nth-of-type(1) .btn":
        "Связаться сейчас",
      // Main pricing – card 2
      "#services .pricing-grid > article:nth-of-type(2) .price": "150 €",
      "#services .pricing-grid > article:nth-of-type(2) .desc":
        "Оптимально для компаний: 3–5 страниц, всё необходимое для запуска.",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(1)":
        "Индивидуальный дизайн с анимацией",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(2)":
        "Адаптивность под все устройства",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(3)":
        "Создание от 3 до 5 страниц",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(4)":
        "Установка на хостинг + подключение домена",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(5)":
        "Базовая SEO‑оптимизация",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(6)":
        "Гарантия на сайт 1 год",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(7)":
        "Бесплатные правки первый месяц",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(8)":
        "Срок выполнения — от 10 дней",
      "#services .pricing-grid > article:nth-of-type(2) .btn":
        "Связаться сейчас",
      // Additional services (small grid)
      "#services .center.subheading": "Дополнительные услуги",
      "#services .pricing-grid.small > article:nth-of-type(1) .price":
        "30 €/месяц",
      "#services .pricing-grid.small > article:nth-of-type(1) h4":
        "Пакет “Полная поддержка”",
      "#services .pricing-grid.small > article:nth-of-type(1) .desc":
        "Подходит тем, кто хочет получать стабильную и быструю поддержку сайта без ограничений.",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(1)":
        "Неограниченное количество правок",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(2)":
        "Поддержка 24/7",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(3)":
        "Внесение изменений по запросу",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(4)":
        "Консультации и техническое сопровождение",
      "#services .pricing-grid.small > article:nth-of-type(1) .btn":
        "Связаться сейчас",
      "#services .pricing-grid.small > article:nth-of-type(2) .price":
        "Оплата по запросу",
      "#services .pricing-grid.small > article:nth-of-type(2) h4":
        "Пакет “Поддержка по запросу”",
      "#services .pricing-grid.small > article:nth-of-type(2) .desc":
        "Оптимальный вариант, если сайт требует изменений время от времени.",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(1)":
        "Правки и обновления по необходимости",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(2)":
        "Стоимость зависит от задачи",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(3)":
        "Быстрая обратная связь",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(4)":
        "Предварительная оценка до начала работ",
      "#services .pricing-grid.small > article:nth-of-type(2) .btn":
        "Связаться сейчас",
      'nav a[href="#home"]': "Главная",
      'nav a[href="#about"]': "О нас",
      'nav a[href="#services"]': "Услуги",
      'nav a[href="#faq"]': "FAQ",
      'nav a[href="#contact"]': "Связаться",

      ".impression h2": "СИЛА ПЕРВОГО ВПЕЧАТЛЕНИЯ",
      ".impression .lead":
        "Быстрый и продуманный сайт — это уважение к времени клиента и лучший способ заявить о себе профессионально.",
      ".impression-quote blockquote":
        "«У вас никогда не будет второго шанса произвести первое впечатление.»",
      ".impression-quote cite": "© Уилл Роджерс",

      ".faq-title": "Часто задаваемые вопросы",
      ".faq-new details:nth-of-type(1) > summary":
        "Что значит «сайт под ключ»?",
      ".faq-new details:nth-of-type(1) .answer p":
        "Это значит, что мы берём на себя весь процесс — от дизайна и верстки до наполнения, установки, подключения домена и базовой SEO‑настройки. Вам не нужно разбираться в технических деталях — вы получаете полностью готовый к запуску сайт.",
      ".faq-new details:nth-of-type(2) > summary":
        "Что нужно от меня на старте?",
      ".faq-new details:nth-of-type(2) .answer p":
        "На начальном этапе нам понадобится краткое техническое задание: чем вы занимаетесь, цели сайта, желаемый стиль, примеры, которые нравятся, и материалы (тексты, логотип, фото — если есть).",
      ".faq-new details:nth-of-type(3) > summary":
        "Что если у меня нет ни логотипа, ни контента?",
      ".faq-new details:nth-of-type(3) .answer p":
        "Мы поможем с подбором стоковых изображений, иконок и подготовим базовый текст под ваш продукт или услугу. Также можем создать простой текстовый логотип для старта.",
      ".faq-new details:nth-of-type(4) > summary":
        "Будет ли сайт хорошо работать на разных устройствах?",
      ".faq-new details:nth-of-type(4) .answer p":
        "Мы используем оптимизированные шаблоны, настраиваем кэширование и базовую оптимизацию, чтобы сайт загружался быстро как на ПК, так и на телефонах.",
      ".faq-new details:nth-of-type(5) > summary":
        "Нужно ли дополнительно платить за хостинг и домен?",
      ".faq-new details:nth-of-type(5) .answer p":
        "Да, стоимость хостинга и домена оплачивается отдельно и не входит в цену разработки. Поможем выбрать провайдера и при необходимости всё настроим. Оплата обычно ежегодная или помесячная.",

      ".contact-info .heading-line:nth-of-type(1)": "Связаться",
      ".contact-info .heading-line:nth-of-type(2)": "Найти",
      ".contact-info .heading-line:nth-of-type(3)": "Подписаться",
      ".contact-info .contact-lines li:nth-of-type(1)": "Эстония, Тарту",
      ".contact-form2 .contact-head": "НАПИШИТЕ НАМ",
      ".contact-form2 .lead":
        "Заполните форму — и мы свяжемся с вами в ближайшее время.",
      "#name@label": "Ваше имя",
      "#name@placeholder": "Иван Иванов",
      "#email@label": "Ваша e‑почта",
      "#email@placeholder": "you@mail.com",
      "#subject@label": "Тема письма",
      "#subject@placeholder": "Вопрос по разработке",
      "#message@label": "Введите сообщение",
      "#message@placeholder": "Кратко опишите задачу",
      '.contact-form2 button[type="submit"]': "ОТПРАВИТЬ",

      ".price-card .btn": "Связаться сейчас",
    },
    en: {
      "#home@data-hero-text":
        "Modern turnkey websites for businesses and brands",
      // Hero
      "#home .hero-text h1:nth-of-type(1)":
        "Modern turnkey websites for businesses and brands.",
      "#home .hero-text h1:nth-of-type(2)": "Design, coding and launch turnkey",
      "#home .hero-text p":
        "We build fast, clear and beautiful websites that help your business grow.",
      "#home .cta a.btn.btn-gradient": "Discuss the project",
      "#home .cta a.btn.btn-ghost": "Services",
      "#home .badges li:nth-of-type(1)": "Responsive layout",
      "#home .badges li:nth-of-type(2)": "SEO optimization",
      "#home .badges li:nth-of-type(3)": "Post‑launch support",

      // About
      "#about h2": "About us",
      "#about .reveal p":
        "We design and build websites focused on business goals and user experience. Transparent process and on time.",
      "#about .checklist li:nth-of-type(1)": "UX/UI design and prototyping",
      "#about .checklist li:nth-of-type(2)":
        "Responsive, standards‑based coding",
      "#about .checklist li:nth-of-type(3)": "High performance and quality",
      "#about .checklist li:nth-of-type(4)": "SEO, analytics and support",

      // Process
      "#process .container > h2.center": "From Request To Live Website",
      "#process .lead.center": "Our workflow in three simple steps.",
      "#process .step:nth-of-type(1) h3": "Briefing",
      "#process .step:nth-of-type(1) p":
        "We discuss goals, collect requirements and prepare a plan.",
      "#process .step:nth-of-type(2) h3": "Design & Development",
      "#process .step:nth-of-type(2) p":
        "We craft the design, code pages and integrate features.",
      "#process .step:nth-of-type(3) h3": "Launch & Support",
      "#process .step:nth-of-type(3) p":
        "We go live, connect analytics and stay in touch.",

      // Services
      "#services .container > h2:nth-of-type(2)": "Pricing & Services",
      "#services .lead.center":
        "Choose the package — we will match the best option for your task.",
      "#services .pricing-grid > article:nth-of-type(1) h3":
        "Landing / Starter site",
      "#services .pricing-grid > article:nth-of-type(2) h3":
        "Corporate website",
      // Main pricing – card 1
      "#services .pricing-grid > article:nth-of-type(1) .price": "100 €",
      "#services .pricing-grid > article:nth-of-type(1) .desc":
        "Great for small businesses: a landing or portfolio.",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(1)":
        "Custom design with animations",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(2)":
        "Responsive across devices",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(3)":
        "One main page",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(4)":
        "Hosting setup + domain connection",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(5)":
        "Basic SEO optimization",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(6)":
        "1‑year site warranty",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(7)":
        "Free edits in the first month",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(8)":
        "Delivery time — from 5 days",
      "#services .pricing-grid > article:nth-of-type(1) .btn": "Contact now",
      // Main pricing – card 2
      "#services .pricing-grid > article:nth-of-type(2) .price": "150 €",
      "#services .pricing-grid > article:nth-of-type(2) .desc":
        "Best for companies: 3–5 pages with everything to launch.",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(1)":
        "Custom design with animations",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(2)":
        "Responsive across devices",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(3)":
        "From 3 to 5 pages",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(4)":
        "Hosting setup + domain connection",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(5)":
        "Basic SEO optimization",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(6)":
        "1‑year site warranty",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(7)":
        "Free edits in the first month",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(8)":
        "Delivery time — from 10 days",
      "#services .pricing-grid > article:nth-of-type(2) .btn": "Contact now",
      // Additional services (small grid)
      "#services .center.subheading": "Additional services",
      "#services .pricing-grid.small > article:nth-of-type(1) .price":
        "30 €/month",
      "#services .pricing-grid.small > article:nth-of-type(1) h4":
        "“Full Support” package",
      "#services .pricing-grid.small > article:nth-of-type(1) .desc":
        "For those who want stable, fast website support with no limits.",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(1)":
        "Unlimited edits",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(2)":
        "24/7 support",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(3)":
        "Changes on request",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(4)":
        "Consulting and technical assistance",
      "#services .pricing-grid.small > article:nth-of-type(1) .btn":
        "Contact now",
      "#services .pricing-grid.small > article:nth-of-type(2) .price":
        "Pay as you go",
      "#services .pricing-grid.small > article:nth-of-type(2) h4":
        "“On‑Demand Support” package",
      "#services .pricing-grid.small > article:nth-of-type(2) .desc":
        "Best if your site needs occasional changes.",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(1)":
        "Edits and updates as needed",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(2)":
        "Price depends on the task",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(3)":
        "Quick response",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(4)":
        "Preliminary estimate before work",
      "#services .pricing-grid.small > article:nth-of-type(2) .btn":
        "Contact now",
      'nav a[href="#home"]': "Home",
      'nav a[href="#about"]': "About",
      'nav a[href="#services"]': "Services",
      'nav a[href="#faq"]': "FAQ",
      'nav a[href="#contact"]': "Contact",

      ".impression h2": "THE POWER OF FIRST IMPRESSIONS",
      ".impression .lead":
        "A fast, well‑thought‑out website shows respect for clients’ time and is the best way to present yourself professionally.",
      ".impression-quote blockquote":
        "“You never get a second chance to make a first impression.”",
      ".impression-quote cite": "© Will Rogers",

      ".faq-title": "Frequently Asked Questions",
      ".faq-new details:nth-of-type(1) > summary":
        "What does “turnkey website” mean?",
      ".faq-new details:nth-of-type(1) .answer p":
        "It means we handle the entire process — from design and coding to content, installation, domain setup and basic SEO. You don’t need to deal with technical details — you get a site ready to launch.",
      ".faq-new details:nth-of-type(2) > summary":
        "What do you need from me to get started?",
      ".faq-new details:nth-of-type(2) .answer p":
        "At the start we need a short brief: what you do, the site goals, preferred style, examples you like, and materials (texts, logo, photos — if available).",
      ".faq-new details:nth-of-type(3) > summary":
        "What if I don’t have a logo or content?",
      ".faq-new details:nth-of-type(3) .answer p":
        "We can pick stock images and icons and prepare basic copy for your product or service. We can also create a simple text logo if you need a starter option.",
      ".faq-new details:nth-of-type(4) > summary":
        "Will the site work well on different devices?",
      ".faq-new details:nth-of-type(4) .answer p":
        "We use optimized templates, set up caching and basic performance tweaks so the site loads fast on both desktop and mobile.",
      ".faq-new details:nth-of-type(5) > summary":
        "Do I need to pay separately for hosting and a domain?",
      ".faq-new details:nth-of-type(5) .answer p":
        "Yes, hosting and domain are paid separately and are not included in the development price. We’ll help choose a provider and configure everything. Billing is usually yearly or monthly.",

      ".contact-info .heading-line:nth-of-type(1)": "Get in touch",
      ".contact-info .heading-line:nth-of-type(2)": "Find us",
      ".contact-info .heading-line:nth-of-type(3)": "Follow",
      ".contact-info .contact-lines li:nth-of-type(1)": "Estonia, Tartu",
      ".contact-form2 .contact-head": "CONTACT US",
      ".contact-form2 .lead":
        "Fill out the form and we will get back to you shortly.",
      "#name@label": "Your name",
      "#name@placeholder": "John Doe",
      "#email@label": "Your email",
      "#email@placeholder": "you@mail.com",
      "#subject@label": "Subject",
      "#subject@placeholder": "Question about development",
      "#message@label": "Your message",
      "#message@placeholder": "Describe your request briefly",
      '.contact-form2 button[type="submit"]': "Send",

      ".price-card .btn": "Contact now",
    },
    et: {
      "#home@data-hero-text":
        "Kaasaegsed võtmed kätte veebilehed ettevõtetele ja brändidele",
      // Hero
      "#home .hero-text h1:nth-of-type(1)":
        "Kaasaegsed võtmed kätte veebilehed ettevõtetele ja brändidele",
      "#home .hero-text h1:nth-of-type(2)":
        "Disain, arendus ja käivitus “võtmed kätte”",
      "#home .hero-text p":
        "Teeme kiired, selged ja kaunid lehed, mis aitavad sinu äri kasvatada.",
      "#home .cta a.btn.btn-gradient": "Arutame projekti",
      "#home .cta a.btn.btn-ghost": "Teenused",
      "#home .badges li:nth-of-type(1)": "Responsive‑kujundus",
      "#home .badges li:nth-of-type(2)": "SEO‑optimeerimine",
      "#home .badges li:nth-of-type(3)": "Tugi pärast käivitust",

      // About
      "#about h2": "Meist",
      "#about .reveal p":
        "Disainime ja ehitame lehti, lähtudes äri‑eesmärkidest ja kasutaja kogemusest. Töötame selgelt ja õigeks ajaks.",
      "#about .checklist li:nth-of-type(1)": "UX/UI disain ja prototüüp",
      "#about .checklist li:nth-of-type(2)":
        "Responsiivne standarditele vastav kood",
      "#about .checklist li:nth-of-type(3)": "Kõrge jõudlus ja kvaliteet",
      "#about .checklist li:nth-of-type(4)": "SEO, analüütika ja tugi",

      // Process
      "#process .container > h2.center": "Päringust kuni valmis veebileheni",
      "#process .lead.center": "Meie töövoog kolmes lihtsas etapis.",
      "#process .step:nth-of-type(1) h3": "Päring ja briif",
      "#process .step:nth-of-type(1) p":
        "Arutame eesmärgid, kogume nõuded ja paneme paika plaani.",
      "#process .step:nth-of-type(2) h3": "Disain ja arendus",
      "#process .step:nth-of-type(2) p":
        "Loome disaini, arendame lehed ja lisame funktsionaalsuse.",
      "#process .step:nth-of-type(3) h3": "Käivitus ja tugi",
      "#process .step:nth-of-type(3) p":
        "Avaldame lehe, ühendame analüütika ja oleme toeks.",

      // Services
      "#services .container > h2:nth-of-type(2)": "Hinnad ja teenused",
      "#services .lead.center":
        "Vali sobiv pakett — leiame sinu vajadustele parima lahenduse.",
      "#services .pricing-grid > article:nth-of-type(1) h3":
        "Läheleht / starter",
      "#services .pricing-grid > article:nth-of-type(2) h3": "Ettevõtte veeb",
      // Main pricing – card 1
      "#services .pricing-grid > article:nth-of-type(1) .price": "100 €",
      "#services .pricing-grid > article:nth-of-type(1) .desc":
        "Sobib väikesele ettevõttele: maandumisleht või portfell.",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(1)":
        "Kohandatud disain animatsioonidega",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(2)":
        "Responsiivne kõigis seadmetes",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(3)":
        "1 põhileht",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(4)":
        "Hostingu seadistus + domeen",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(5)":
        "Baas‑SEO",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(6)":
        "1‑aastane garantii",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(7)":
        "Tasuta parandused esimesel kuul",
      "#services .pricing-grid > article:nth-of-type(1) .features li:nth-child(8)":
        "Valmimisaeg — alates 5 päevast",
      "#services .pricing-grid > article:nth-of-type(1) .btn": "Võta ühendust",
      // Main pricing – card 2
      "#services .pricing-grid > article:nth-of-type(2) .price": "150 €",
      "#services .pricing-grid > article:nth-of-type(2) .desc":
        "Parim ettevõtetele: 3–5 lehte, kõik vajaliku käivituseks.",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(1)":
        "Kohandatud disain animatsioonidega",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(2)":
        "Responsiivne kõigis seadmetes",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(3)":
        "3 kuni 5 lehte",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(4)":
        "Hostingu seadistus + domeen",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(5)":
        "Baas‑SEO",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(6)":
        "1‑aastane garantii",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(7)":
        "Tasuta parandused esimesel kuul",
      "#services .pricing-grid > article:nth-of-type(2) .features li:nth-child(8)":
        "Valmimisaeg — alates 10 päevast",
      "#services .pricing-grid > article:nth-of-type(2) .btn": "Võta ühendust",
      // Additional services (small grid)
      "#services .center.subheading": "Lisateenused",
      "#services .pricing-grid.small > article:nth-of-type(1) .price":
        "30 €/kuu",
      "#services .pricing-grid.small > article:nth-of-type(1) h4":
        "“Täistoetus” pakett",
      "#services .pricing-grid.small > article:nth-of-type(1) .desc":
        "Sobib neile, kes soovivad stabiilset ja kiiret toe teenust ilma piiranguta.",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(1)":
        "Piiramatu arv parandusi",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(2)":
        "Tugi 24/7",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(3)":
        "Muudatused soovi korral",
      "#services .pricing-grid.small > article:nth-of-type(1) .features li:nth-child(4)":
        "Konsultatsioon ja tehniline tugi",
      "#services .pricing-grid.small > article:nth-of-type(1) .btn":
        "Võta ühendust",
      "#services .pricing-grid.small > article:nth-of-type(2) .price":
        "Hinnastus vastavalt tööle",
      "#services .pricing-grid.small > article:nth-of-type(2) h4":
        "“Nõudmisel tugi” pakett",
      "#services .pricing-grid.small > article:nth-of-type(2) .desc":
        "Parim, kui leht vajab aeg‑ajalt muudatusi.",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(1)":
        "Parandused ja uuendused vastavalt vajadusele",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(2)":
        "Hind sõltub ülesandest",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(3)":
        "Kiire tagasiside",
      "#services .pricing-grid.small > article:nth-of-type(2) .features li:nth-child(4)":
        "Eelhinnang enne tööd",
      "#services .pricing-grid.small > article:nth-of-type(2) .btn":
        "Võta ühendust",
      'nav a[href="#home"]': "Avaleht",
      'nav a[href="#about"]': "Meist",
      'nav a[href="#services"]': "Teenused",
      'nav a[href="#faq"]': "KKK",
      'nav a[href="#contact"]': "Kontakt",

      ".impression h2": "ESMAMULJE JÕUD",
      ".impression .lead":
        "Kiire ja läbimõeldud veebileht näitab austust kliendi aja vastu ja on parim viis end professionaalselt esitleda.",
      ".impression-quote blockquote":
        "«Esimest muljet ei saa kaks korda jätta.»",
      ".impression-quote cite": "© Will Rogers",

      ".faq-title": "Korduma kippuvad küsimused",
      ".faq-new details:nth-of-type(1) > summary":
        "Mida tähendab “võtmed kätte” veebileht?",
      ".faq-new details:nth-of-type(1) .answer p":
        "See tähendab, et tegeleme kogu protsessiga — disainist ja arendusest kuni sisu, paigalduse, domeeni seadistuse ja baastasemel SEO-ni. Te ei pea tehniliste detailidega tegelema — saate kohe käivitamiseks valmis lehe.",
      ".faq-new details:nth-of-type(2) > summary":
        "Mida on alustamiseks minult vaja?",
      ".faq-new details:nth-of-type(2) .answer p":
        "Alguses vajame lühikest briifi: millega tegelete, lehe eesmärgid, soovitud stiil, meeldivad näited ja materjalid (tekst, logo, fotod — kui on).",
      ".faq-new details:nth-of-type(3) > summary":
        "Mis siis, kui mul pole logo ega sisu?",
      ".faq-new details:nth-of-type(3) .answer p":
        "Aitame valida stock‑pildid ja ikoonid ning paneme kokku baasteksti teie toote või teenuse jaoks. Vajadusel loome lihtsa tekstilogoga stardi.",
      ".faq-new details:nth-of-type(4) > summary":
        "Kas veebileht töötab hästi eri seadmetes?",
      ".faq-new details:nth-of-type(4) .answer p":
        "Kasutame optimeeritud malle, seadistame vahemälu ja jõudlust, et leht laeks kiiresti nii arvutis kui ka telefonis.",
      ".faq-new details:nth-of-type(5) > summary":
        "Kas hostingu ja domeeni eest tuleb eraldi maksta?",
      ".faq-new details:nth-of-type(5) .answer p":
        "Jah, hosting ja domeen on eraldi kulud ega sisaldu arenduse hinnas. Aitame pakkuja valida ja seadistada. Tasumine on tavaliselt aastane või kuupõhine.",

      ".contact-info .heading-line:nth-of-type(1)": "Võta ühendust",
      ".contact-info .heading-line:nth-of-type(2)": "Leia meid",
      ".contact-info .heading-line:nth-of-type(3)": "Jälgi",
      ".contact-info .contact-lines li:nth-of-type(1)": "Eesti, Tartu",
      ".contact-form2 .contact-head": "KIRJUTAGE MEILE",
      ".contact-form2 .lead": "Täida vorm ja võtame sinuga peagi ühendust.",
      "#name@label": "Teie nimi",
      "#name@placeholder": "Jaan Tamm",
      "#email@label": "Teie e‑post",
      "#email@placeholder": "you@mail.com",
      "#subject@label": "Teema",
      "#subject@placeholder": "Küsimus arenduse kohta",
      "#message@label": "Sõnum",
      "#message@placeholder": "Kirjelda lühidalt soovi",
      '.contact-form2 button[type="submit"]': "Saada",

      ".price-card .btn": "Võta ühendust",
    },
  };

  // Inline additions: contact widget translations (title + first two bullets + updated third)
  try {
    // RU
    i18n.ru[".contact-widgets .widget:nth-of-type(1) h4"] =
      "\u0427\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B";
    i18n.ru[
      ".contact-widgets .widget:nth-of-type(1) .tick-list li:nth-of-type(1)"
    ] =
      "\u041E\u0442\u0432\u0435\u0447\u0430\u0435\u043C \u0432 \u0434\u0435\u043D\u044C \u0437\u0430\u043F\u0440\u043E\u0441\u0430";
    i18n.ru[
      ".contact-widgets .widget:nth-of-type(1) .tick-list li:nth-of-type(2)"
    ] =
      "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C RU \u2022 EN \u2022 ET";
    i18n.ru[".contact-widgets .tick-list li:nth-of-type(3)"] =
      "Индивидуальный подход";

    // EN
    i18n.en[".contact-widgets .widget:nth-of-type(1) h4"] = "FAQ";
    i18n.en[
      ".contact-widgets .widget:nth-of-type(1) .tick-list li:nth-of-type(1)"
    ] = "Same-day response";
    i18n.en[
      ".contact-widgets .widget:nth-of-type(1) .tick-list li:nth-of-type(2)"
    ] = "We support RU \u2022 EN \u2022 ET";
    i18n.en[".contact-widgets .tick-list li:nth-of-type(3)"] =
      "Individual approach";

    // ET
    i18n.et[".contact-widgets .widget:nth-of-type(1) h4"] =
      "Korduma kippuvad k\u00FCsimused";
    i18n.et[
      ".contact-widgets .widget:nth-of-type(1) .tick-list li:nth-of-type(1)"
    ] = "Vastame samal p\u00E4eval";
    i18n.et[
      ".contact-widgets .widget:nth-of-type(1) .tick-list li:nth-of-type(2)"
    ] = "Toetame RU \u2022 EN \u2022 ET";
    i18n.et[".contact-widgets .tick-list li:nth-of-type(3)"] =
      "Individuaalne lähenemine";

    // Remove unused "Find us" heading translations
    delete i18n.ru[".contact-info .heading-line:nth-of-type(2)"];
    delete i18n.en[".contact-info .heading-line:nth-of-type(2)"];
    delete i18n.et[".contact-info .heading-line:nth-of-type(2)"];
  } catch (_) {}

  // Inline additions: mobile menu title translations
  try {
    i18n.ru[".mm-title"] = "Меню";
    i18n.en[".mm-title"] = "Menu";
    i18n.et[".mm-title"] = "Menüü";
  } catch (_) {}

  // Overrides for multiline About paragraph (with line breaks)
  const i18nOverride = {
    ru: {
      "#about .reveal p":
        "Мы создаём адаптивные сайты под ключ — от идеи и структуры до полноценного запуска. Наши проекты отличаются современным дизайном, удобством использования и высокой скоростью загрузки.\n\nВ основе нашей работы — простота, скорость и внимательность к деталям. Мы подбираем решения, которые действительно работают, и всегда учитываем потребности клиента.",
    },
    en: {
      "#about .reveal p":
        "We build responsive turnkey websites — from the idea and structure to a full launch. Our projects stand out for modern design, usability, and high loading speed.\n\nAt the core of our work are simplicity, speed, and attention to detail. We deliver solutions that truly work and always take the client\u2019s needs into account.",
    },
    et: {
      "#about .reveal p":
        "Loome responsiivseid veebilehti võtmed kätte — ideest ja struktuurist kuni täisväärtusliku käivituseni. Meie projektid paistavad silma kaasaegse disaini, kasutusmugavuse ja kiire laadimisajaga.\n\nMeie töö aluseks on lihtsus, kiirus ja tähelepanelikkus detailide suhtes. Pakume lahendusi, mis päriselt toimivad, ja arvestame alati kliendi vajadusi.",
    },
  };

  // Capture original RU hero texts so we can restore your own heading
  // even if the dictionary had a different default.
  const toCapture = [
    "#home .hero-text h1:nth-of-type(1)",
    "#home .hero-text h1:nth-of-type(2)",
    "#home .hero-text p",
  ];
  toCapture.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el && !el.getAttribute("data-i18n-ru")) {
      el.setAttribute("data-i18n-ru", el.textContent.trim());
    }
  });

  function setTextAll(selector, value) {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach((n) => {
      n.textContent = value;
    });
  }
  function setAttrAll(selector, attr, value) {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach((n) => {
      n.setAttribute(attr, value);
    });
  }

  function applyLang(lang) {
    const dict = i18n[lang] || i18n.ru;
    Object.entries(dict).forEach(([sel, val]) => {
      if (sel.includes("@")) {
        const [selector, attr] = sel.split("@");
        if (attr === "label") {
          // find associated label by for= or preceding label in same field
          const input = document.querySelector(selector);
          if (input) {
            const id = input.getAttribute("id");
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) label.textContent = val;
          }
        } else {
          setAttrAll(selector, attr, val);
        }
      } else {
        setTextAll(sel, val);
      }
    });
    // Apply overrides (after base dict) so they win
    const over = i18nOverride[lang];
    if (over) {
      Object.entries(over).forEach(([sel, val]) => setTextAll(sel, val));
    }
    // Apply inline data translations if provided in markup
    document.querySelectorAll(`[data-i18n-${lang}]`).forEach((el) => {
      const val = el.getAttribute(`data-i18n-${lang}`);
      if (val) el.textContent = val;
    });
    // For RU explicitly restore your original captured content
    if (lang === "ru") {
      document.querySelectorAll("[data-i18n-ru]").forEach((el) => {
        const v = el.getAttribute("data-i18n-ru");
        if (v) el.textContent = v;
      });
    }
    // Footer translations
    const footer = {
      ru: { copy: "Все права защищены" },
      en: { copy: "All rights reserved" },
      et: { copy: "Kõik õigused kaitstud" },
    };
    const ft = footer[lang] || footer.ru;
    document.querySelector(".footer-copy")?.replaceChildren(ft.copy);
    // Remove any made-by block if present
    document
      .querySelectorAll(".footer-madeby, .made-by")
      .forEach((n) => n.remove());

    document.documentElement.setAttribute("lang", lang);
    // Update active state
    document
      .querySelectorAll(".lang-switch [data-lang]")
      .forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.lang === lang)
      );
    localStorage.setItem("lang", lang);
    // RU-specific tweaks
    if (lang === "ru") {
      setTextAll('nav a[href="#faq"]', "ЧЗВ");
      setTextAll(".faq-title", "Часто задаваемые вопросы");
    }
  }

  // Bind UI
  document.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  applyLang(localStorage.getItem("lang") || "ru");
})();

// Ensure only one FAQ item open at a time
(function singleOpenFaq() {
  const faq = document.getElementById("faq");
  if (!faq) return;
  // Allow multiple FAQ items open: disable single-open behavior
  return;

  faq.addEventListener(
    "toggle",
    (e) => {
      const opened = e.target;
      if (!(opened instanceof HTMLDetailsElement)) return;
      if (!opened.open) return; // only react when an item is opened
      faq.querySelectorAll("details[open]").forEach((d) => {
        if (d !== opened) {
          // Просто убираем open — CSS сам анимирует закрытие через max-height
          d.removeAttribute("open");
        }
      });
    },
    true
  );
})();

// Site-wide particles background (simple, no external lib)
(function initParticlesBackground() {
  const prefersReduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) return;

  const canvas = document.createElement("canvas");
  canvas.className = "particles-canvas";
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0,
    H = 0;
  let particles = [];
  let running = true;

  const colorA = [179, 136, 255]; // accent light
  const colorB = [142, 45, 226]; // accent dark

  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    W = canvas.width = Math.floor(window.innerWidth * dpr);
    H = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    // density tuned for performance; fewer on small screens
    const area = (W * H) / (dpr * dpr);
    const target = Math.max(40, Math.min(140, Math.floor(area / 28000)));
    // keep existing particles if close
    if (particles.length > target) particles.length = target;
    while (particles.length < target) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-0.15, 0.15) * dpr,
        vy: rand(-0.15, 0.15) * dpr,
        r: rand(0.8, 1.8) * dpr,
      });
    }
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    // draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      // bounce off edges
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      const t = (p.x / W + p.y / H) * 0.5;
      const r = Math.floor(mix(colorA[0], colorB[0], t));
      const g = Math.floor(mix(colorA[1], colorB[1], t));
      const b = Math.floor(mix(colorA[2], colorB[2], t));
      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw connections
    const maxDist = 120 * dpr;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x,
          dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < maxDist * maxDist) {
          const a = 1 - Math.sqrt(d2) / maxDist; // fade by distance
          ctx.strokeStyle = `rgba(179,136,255,${0.18 * a})`;
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  function onVisibility() {
    running = document.visibilityState !== "hidden";
    if (running) requestAnimationFrame(step);
  }

  window.addEventListener("resize", () => {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    resize();
  });
  document.addEventListener("visibilitychange", onVisibility);
  resize();
  requestAnimationFrame(step);
})();

// Mobile Menu v2: independent full-screen menu for tablets/phones
(function initMobileMenuV2() {
  const mm = document.getElementById("mobileMenu");
  const mmPanel = document.getElementById("mmPanel");
  const mmNav = document.getElementById("mmNav");
  const mmLang = document.getElementById("mmLang");
  const mmOverlay = document.getElementById("mmOverlay");
  const mmClose = document.getElementById("mmClose");
  const langSwitch = document.getElementById("langSwitch");
  if (!mm || !mmPanel || !mmNav || !mmOverlay || !mmClose || !navToggle) return;

  function buildMenu() {
    // Build nav links
    mmNav.innerHTML = "";
    const src = Array.from(document.querySelectorAll("#nav a"));
    if (src.length) {
      src.forEach((a) => mmNav.appendChild(a.cloneNode(true)));
    } else {
      // Fallback: minimal set
      const links = [
        { href: "#home", text: "Главная" },
        { href: "#about", text: "О нас" },
        { href: "#services", text: "Услуги" },
        { href: "#faq", text: "ЧЗВ" },
        { href: "#contact", text: "Связаться" },
      ];
      links.forEach(({ href, text }) => {
        const a = document.createElement("a");
        a.href = href;
        a.textContent = text;
        if (href === "#contact") a.className = "btn btn-small";
        mmNav.appendChild(a);
      });
    }

    // Build a clone of the language switcher to avoid moving the original
    if (mmLang) {
      mmLang.innerHTML = "";
      // Title for language block
      const title = document.createElement("div");
      title.className = "mm-lang-title";
      title.textContent = "Язык";
      mmLang.appendChild(title);
      const active = localStorage.getItem("lang") || "ru";
      const wrap = document.createElement("div");
      wrap.className = "lang-switch";
      [
        { code: "ru", label: "RU" },
        { code: "en", label: "EN" },
        { code: "et", label: "ET" },
      ].forEach(({ code, label }) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.lang = code;
        b.textContent = label;
        if (code === active) b.classList.add("active");
        wrap.appendChild(b);
      });
      mmLang.appendChild(wrap);
    }
  }
  function open() {
    buildMenu();
    mm.hidden = false;
    requestAnimationFrame(() => mm.classList.add("open"));
    document.body.classList.add("menu-open");
  }
  function close() {
    mm.classList.remove("open");
    setTimeout(() => (mm.hidden = true), 250);
    document.body.classList.remove("menu-open");
    const headerContainer = document.querySelector(".container.nav");
    if (langSwitch) {
      if (window.innerWidth <= 1024) {
        // park switcher back into old nav (hidden on mobile)
        const oldNav = document.getElementById("nav");
        if (oldNav && langSwitch.parentElement !== oldNav)
          oldNav.appendChild(langSwitch);
      } else if (
        headerContainer &&
        langSwitch.parentElement !== headerContainer
      ) {
        headerContainer.appendChild(langSwitch);
      }
    }
  }

  navToggle.addEventListener(
    "click",
    (e) => {
      if (window.innerWidth <= 1024) {
        if (typeof e.stopImmediatePropagation === "function")
          e.stopImmediatePropagation();
        e.preventDefault();
        open();
      }
    },
    { capture: true }
  );

  mmOverlay.addEventListener("click", close);
  mmClose.addEventListener("click", close);
  mmNav.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    const id = hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    close();
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        history.replaceState(null, "", hash);
      } catch {}
    }, 60);
  });
  mmLang.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (!btn) return;
    const lang = btn.dataset.lang;
    const headerBtn = document.querySelector(
      `#langSwitch [data-lang="${lang}"]`
    );
    if (headerBtn) headerBtn.click();
    setTimeout(close, 50);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) close();
  });
})();
