/* =========================================================
   VISIONS — Interactividad
   Todo el JS es vanilla, sin dependencias externas.
   ========================================================= */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Utilidad: separar texto en palabras animables ---------- */
  function splitWords(el) {
    const text = el.textContent.trim();
    el.textContent = "";
    text.split(/\s+/).forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--i", i);
      span.textContent = word;
      el.appendChild(span);
      el.appendChild(document.createTextNode(" "));
    });
  }
  document.querySelectorAll("[data-split='words']").forEach(splitWords);

  /* ---------- Índice de hermanos para animaciones escalonadas ---------- */
  document.querySelectorAll(".destinos__grid, .testimonios__grid, .stats__grid").forEach((grid) => {
    Array.from(grid.children).forEach((child, i) => {
      child.style.setProperty("--card-i", i);
    });
  });
  document.querySelectorAll(".experiencia__list").forEach((list) => {
    Array.from(list.children).forEach((li, i) => li.style.setProperty("--li-i", i));
  });

  /* ---------- Entrada del hero al cargar ---------- */
  const hero = document.querySelector(".hero");
  if (hero) {
    if (prefersReducedMotion) {
      hero.classList.add("is-loaded");
    } else {
      requestAnimationFrame(() => {
        setTimeout(() => hero.classList.add("is-loaded"), 120);
      });
    }
  }

  /* ---------- Barra de progreso de scroll ---------- */
  const scrollProgress = document.getElementById("scrollProgress");
  function updateScrollProgress() {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = percent + "%";
  }

  /* ---------- Navbar: transformación al hacer scroll ---------- */
  const navbar = document.getElementById("navbar");
  function updateNavbarState() {
    if (!navbar) return;
    navbar.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  /* ---------- Botón "volver arriba" ---------- */
  const backToTop = document.getElementById("backToTop");
  function updateBackToTop() {
    if (!backToTop) return;
    backToTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.8);
  }
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Parallax de scroll en las tarjetas de destino ---------- */
  const scrollParallaxEls = Array.from(document.querySelectorAll("[data-parallax-scroll]"));
  function updateScrollParallax() {
    if (prefersReducedMotion || !scrollParallaxEls.length) return;
    const viewportCenter = window.innerHeight / 2;
    scrollParallaxEls.forEach((el) => {
      const rect = el.parentElement.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const distance = elCenter - viewportCenter;
      const strength = parseFloat(el.dataset.parallaxScroll) || 0.05;
      const offset = Math.max(-40, Math.min(40, distance * strength * -0.15));
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  }

  /* Un único listener de scroll, coordinado con requestAnimationFrame
     para no disparar trabajo de layout en cada evento. */
  let scrollTicking = false;
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateScrollProgress();
      updateNavbarState();
      updateBackToTop();
      updateScrollParallax();
      scrollTicking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  updateScrollProgress();
  updateNavbarState();
  updateBackToTop();
  updateScrollParallax();

  /* ---------- Menú móvil ---------- */
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMobile.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
    navMobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMobile.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menú");
      });
    });
  }

  /* ---------- Parallax sutil con el ratón en el hero + foco de luz ---------- */
  const parallaxLayers = document.querySelectorAll("[data-parallax]");
  const spotlight = document.getElementById("heroSpotlight");
  if (hero && hasFinePointer && !prefersReducedMotion) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let rafId = null;
    let pointerX = 0, pointerY = 0;

    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - 0.5;
      targetY = (event.clientY - rect.top) / rect.height - 0.5;
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      if (!rafId) rafId = requestAnimationFrame(animateParallax);
    });

    hero.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(animateParallax);
    });

    function animateParallax() {
      // Suavizado (easing) hacia la posición objetivo
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      parallaxLayers.forEach((layer) => {
        const strength = parseFloat(layer.dataset.parallax) || 0.03;
        const moveX = currentX * strength * 100;
        const moveY = currentY * strength * 100;
        layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });

      if (spotlight) {
        spotlight.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      }

      if (Math.abs(currentX - targetX) > 0.001 || Math.abs(currentY - targetY) > 0.001) {
        rafId = requestAnimationFrame(animateParallax);
      } else {
        rafId = null;
      }
    }
  }

  /* ---------- Botones "magnéticos": siguen ligeramente al cursor ---------- */
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (event) => {
        const rect = btn.getBoundingClientRect();
        const relX = event.clientX - rect.left - rect.width / 2;
        const relY = event.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${relX * 0.25}px, ${relY * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ---------- Efecto blur-up en imágenes ---------- */
  const lazyImages = document.querySelectorAll("img[data-src]");
  if ("IntersectionObserver" in window && lazyImages.length) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          const fullSrc = img.dataset.src;
          if (!fullSrc) return;

          const preloader = new Image();
          preloader.onload = () => {
            img.src = fullSrc;
            img.classList.add("is-loaded");
          };
          preloader.onerror = () => {
            // Si la imagen remota falla, evitamos dejar el blur permanente
            img.classList.add("is-loaded");
          };
          preloader.src = fullSrc;

          observer.unobserve(img);
        });
      },
      { rootMargin: "200px 0px" }
    );
    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {
    // Sin soporte de IntersectionObserver: cargar directamente
    lazyImages.forEach((img) => {
      if (img.dataset.src) img.src = img.dataset.src;
      img.classList.add("is-loaded");
    });
  }

  /* ---------- Animaciones "reveal" al hacer scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Contadores animados ---------- */
  const counters = document.querySelectorAll("[data-count]");
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || "0", 10);
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cúbico
      const value = target * eased;
      el.textContent = decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString("es-ES");
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = decimals > 0
          ? target.toFixed(decimals)
          : target.toLocaleString("es-ES");
        el.classList.add("is-done");
      }
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach((el) => animateCounter(el));
  }

  /* ---------- Formulario de contacto (demo, sin backend) ---------- */
  const ctaForm = document.getElementById("ctaForm");
  const ctaNote = document.getElementById("ctaNote");
  if (ctaForm && ctaNote) {
    ctaForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const emailInput = document.getElementById("email");
      const isValid = emailInput && emailInput.checkValidity();
      ctaNote.textContent = isValid
        ? "¡Gracias! Te escribiremos en menos de 24 horas."
        : "Introduce un correo válido para que podamos escribirte.";
      ctaNote.classList.add("is-visible");
      if (isValid) ctaForm.reset();
    });
  }

  /* ---------- Año dinámico en el footer ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
