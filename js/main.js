/* ═══════════════════════════════════════════════════════════
   ILHAM // DIGITAL ARCHIVE
   Vanilla interactions — no dependencies
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  var INTRO_KEY = "ilham-archive-entered";
  var THEME_KEY = "ilham-theme";
  var DECODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#<>+*";

  function decodeText(element, duration) {
    if (!element || reduceMotion.matches) {
      return;
    }

    var original = element.dataset.decodeText || element.textContent;
    element.dataset.decodeText = original;

    var length = original.length;
    var token = (element.__decodeToken || 0) + 1;
    var start = window.performance.now();
    var total = duration || 650;

    element.__decodeToken = token;

    var render = function (now) {
      if (element.__decodeToken !== token) {
        return;
      }

      var progress = Math.min(1, (now - start) / total);
      var revealed = Math.floor(progress * (length + 2));
      var output = "";

      for (var index = 0; index < length; index += 1) {
        var character = original.charAt(index);

        if (character === " " || character === "\u00a0" || index < revealed) {
          output += character;
        } else {
          output += DECODE_CHARS.charAt(
            Math.floor(Math.random() * DECODE_CHARS.length)
          );
        }
      }

      element.textContent = output;

      if (progress < 1) {
        window.requestAnimationFrame(render);
      } else {
        element.textContent = original;
      }
    };

    window.requestAnimationFrame(render);
  }

  /* ── Intro ─────────────────────────────────────────────── */

  var intro = $("#intro");
  var site = $("#site");
  var skipIntro = $("#skipIntro");
  var enterArchive = $("#enterArchive");
  var hero = $("#home");
  var heroTitle = $("#heroTitle");
  var introDismissed = false;
  var introPending = root.classList.contains("intro-pending");

  function startHeroReveal() {
    if (hero) {
      hero.classList.add("is-ready");
    }
  }

  function dismissIntro() {
    if (introDismissed || !intro) {
      return;
    }

    introDismissed = true;

    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch (error) {}

    root.classList.remove("intro-pending");

    if (lenis) {
      lenis.start();
    }

    if (site) {
      site.inert = false;
    }

    intro.setAttribute("aria-hidden", "true");
    intro.classList.add("is-leaving");
    startHeroReveal();

    window.setTimeout(function () {
      intro.hidden = true;
    }, reduceMotion.matches ? 20 : 620);

    if (heroTitle) {
      window.setTimeout(function () {
        heroTitle.focus({ preventScroll: true });
      }, reduceMotion.matches ? 30 : 140);
    }
  }

  if (introPending && intro && site) {
    site.inert = true;
    window.requestAnimationFrame(function () {
      intro.focus({ preventScroll: true });
    });
  } else {
    if (intro) {
      intro.hidden = true;
    }
    startHeroReveal();
  }

  if (skipIntro) {
    skipIntro.addEventListener("click", dismissIntro);
  }

  if (enterArchive) {
    enterArchive.addEventListener("click", dismissIntro);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && introPending && !introDismissed) {
      dismissIntro();
    }
  });

  /* Keep keyboard focus inside the intro until it is dismissed. */
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Tab" || !intro || intro.hidden || introDismissed || !introPending) {
      return;
    }

    var focusable = $$(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      intro
    ).filter(function (element) {
      return element.offsetWidth > 0 || element.offsetHeight > 0;
    });

    if (!focusable.length) {
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var active = document.activeElement;

    if (!intro.contains(active)) {
      event.preventDefault();
      first.focus({ preventScroll: true });
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });

  /* ── Theme switch ──────────────────────────────────────── */

  var themeToggle = $("#themeToggle");
  var themeMeta = $('meta[name="theme-color"]');
  var themeLabel = themeToggle ? $(".theme-toggle__label", themeToggle) : null;

  function applyTheme(theme, persist) {
    var next = theme === "light" ? "light" : "dark";
    root.dataset.theme = next;

    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        next === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"
      );
      themeToggle.setAttribute("title", next === "light" ? "Mode gelap" : "Mode terang");
    }

    if (themeLabel) {
      themeLabel.textContent = next === "light" ? "DARK" : "LIGHT";
    }

    if (themeMeta) {
      themeMeta.setAttribute("content", next === "light" ? "#f3f2ea" : "#080908");
    }

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (error) {}
    }
  }

  applyTheme(root.dataset.theme || "dark", false);

  /* Animate the theme change as a circle growing from the toggle. */
  function switchTheme(theme, origin) {
    var update = function () {
      applyTheme(theme, true);
    };

    if (!document.startViewTransition || reduceMotion.matches) {
      update();
      return;
    }

    var transition = document.startViewTransition(update);

    transition.ready
      .then(function () {
        var x = origin ? origin.x : window.innerWidth / 2;
        var y = origin ? origin.y : window.innerHeight / 2;
        var radius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        root.animate(
          {
            clipPath: [
              "circle(0px at " + x + "px " + y + "px)",
              "circle(" + radius + "px at " + x + "px " + y + "px)"
            ]
          },
          {
            duration: 520,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)"
          }
        );
      })
      .catch(function () {});
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var rect = themeToggle.getBoundingClientRect();
      var origin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      switchTheme(root.dataset.theme === "light" ? "dark" : "light", origin);
    });
  }

  var systemTheme = window.matchMedia("(prefers-color-scheme: light)");

  function hasSavedTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      return saved === "light" || saved === "dark";
    } catch (error) {
      return false;
    }
  }

  if (systemTheme.addEventListener) {
    systemTheme.addEventListener("change", function (event) {
      if (!hasSavedTheme()) {
        applyTheme(event.matches ? "light" : "dark", false);
      }
    });
  }

  /* ── Smooth scrolling (Lenis) ──────────────────────────── */

  var lenis = null;

  function getHeaderOffset() {
    var bar = document.getElementById("topbar");
    return bar ? -Math.round(bar.getBoundingClientRect().height) : 0;
  }

  function scrollToSection(element) {
    if (!element) {
      return;
    }

    if (lenis) {
      lenis.scrollTo(element, {
        offset: getHeaderOffset(),
        duration: 1.1
      });
    } else {
      element.scrollIntoView({
        behavior: reduceMotion.matches ? "auto" : "smooth",
        block: "start"
      });
    }

    if (element.hasAttribute("tabindex")) {
      window.setTimeout(function () {
        element.focus({ preventScroll: true });
      }, reduceMotion.matches ? 0 : 140);
    }
  }

  if (typeof Lenis === "function" && !reduceMotion.matches) {
    lenis = new Lenis({
      duration: 1.05,
      easing: function (time) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * time));
      },
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.3
    });

    var lenisFrame = function (time) {
      if (!lenis) {
        return;
      }
      lenis.raf(time);
      window.requestAnimationFrame(lenisFrame);
    };

    window.requestAnimationFrame(lenisFrame);

    if (introPending) {
      lenis.stop();
    }
  }

  document.addEventListener("click", function (event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;

    if (!link) {
      return;
    }

    var hash = link.getAttribute("href");

    if (!hash || hash.length < 2 || hash === "#main") {
      return;
    }

    var target = document.getElementById(hash.slice(1));

    if (!target) {
      return;
    }

    event.preventDefault();
    scrollToSection(target);

    try {
      history.pushState(null, "", hash);
    } catch (error) {}
  });

  /* ── Scroll progress + current section ─────────────────── */

  var topbar = $("#topbar");
  var scrollBar = $("#scrollBar");
  var nodeStatusIndex = $("#nodeStatusIndex");
  var nodeStatusName = $("#nodeStatusName");
  var navLinks = $$(".nav__link");
  var sections = $$("main section[data-section]");
  var menuToggle = $("#menuToggle");
  var nav = $("#primaryNav");
  var navScrim = $("#navScrim");
  var main = $("#main");
  var footer = $(".footer");
  var terminalToggle = $("#terminalToggle");
  var lastSectionId = "";
  var scrollQueued = false;
  var parallaxItems = $$("[data-parallax]");

  function updateParallax() {
    if (reduceMotion.matches) {
      return;
    }

    var viewport = window.innerHeight;

    parallaxItems.forEach(function (element) {
      var container = element.closest("section, footer") || element.parentElement;

      if (!container) {
        return;
      }

      var rect = container.getBoundingClientRect();

      if (rect.bottom < -260 || rect.top > viewport + 260) {
        return;
      }

      var speed = parseFloat(element.dataset.parallax) || 0.08;
      var distance = rect.top + rect.height / 2 - viewport / 2;
      var shift = -distance * speed;

      element.style.setProperty("--parallax-y", shift.toFixed(1) + "px");
    });
  }

  var SECTION_NAMES = {
    home: ["01", "HOME"],
    about: ["02", "ABOUT"],
    skills: ["03", "SKILLS"],
    projects: ["04", "PROJECTS"],
    journey: ["05", "JOURNEY"],
    contact: ["06", "CONTACT"]
  };

  function setActiveSection(id) {
    if (!id || id === lastSectionId) {
      return;
    }

    lastSectionId = id;

    navLinks.forEach(function (link) {
      var active = link.dataset.nav === id;
      link.classList.toggle("is-active", active);

      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    var meta = SECTION_NAMES[id];

    if (meta) {
      if (nodeStatusIndex) {
        nodeStatusIndex.textContent = meta[0];
      }
      if (nodeStatusName) {
        nodeStatusName.dataset.decodeText = meta[1];
        nodeStatusName.textContent = meta[1];
        decodeText(nodeStatusName, 420);
      }
    }
  }

  function updateScrollState() {
    scrollQueued = false;

    var y = window.scrollY || window.pageYOffset;
    var viewport = window.innerHeight;
    var doc = document.documentElement;
    var max = doc.scrollHeight - viewport;
    var progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

    if (topbar) {
      topbar.classList.toggle("is-scrolled", y > 18);
    }

    if (scrollBar) {
      scrollBar.style.transform = "scaleX(" + progress.toFixed(4) + ")";
    }

    var probe = y + viewport * 0.34;
    var current = sections.length ? sections[0] : null;

    sections.forEach(function (section) {
      if (section.offsetTop <= probe) {
        current = section;
      }
    });

    if (max > 0 && y >= max - 4 && sections.length) {
      current = sections[sections.length - 1];
    }

    if (current) {
      setActiveSection(current.dataset.section || current.id);
    }

    updateParallax();
  }

  function queueScrollUpdate() {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollState);
    }
  }

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate);
  updateScrollState();

  /* ── Mobile menu ───────────────────────────────────────── */

  var mobileQuery = window.matchMedia("(max-width: 980px)");
  var menuOpen = false;

  function setBackgroundInert(value) {
    if (main) {
      main.inert = value;
    }
    if (footer) {
      footer.inert = value;
    }
    if (terminalToggle) {
      terminalToggle.inert = value;
    }
  }

  function openMenu() {
    if (!nav || !menuToggle || !mobileQuery.matches) {
      return;
    }

    if (terminal && !terminal.hidden) {
      closeTerminal(false);
    }

    menuOpen = true;
    nav.classList.add("is-open");
    if (navScrim) {
      navScrim.classList.add("is-open");
    }
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    setBackgroundInert(true);

    if (lenis) {
      lenis.stop();
    }

    var firstLink = $(".nav__link", nav);
    if (firstLink) {
      window.setTimeout(function () {
        firstLink.focus({ preventScroll: true });
      }, 120);
    }
  }

  function closeMenu(returnFocus) {
    if (!nav || !menuToggle || !menuOpen) {
      return;
    }

    menuOpen = false;
    nav.classList.remove("is-open");
    if (navScrim) {
      navScrim.classList.remove("is-open");
    }
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    setBackgroundInert(false);

    if (lenis) {
      lenis.start();
    }

    if (returnFocus !== false) {
      menuToggle.focus({ preventScroll: true });
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      if (menuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (navScrim) {
    navScrim.addEventListener("click", function () {
      closeMenu();
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (terminal && !terminal.hidden) {
        closeTerminal(false);
      }

      if (!menuOpen) {
        return;
      }

      var targetSelector = link.getAttribute("href");
      var target = targetSelector ? $(targetSelector) : null;
      closeMenu(false);

      if (target) {
        window.setTimeout(function () {
          target.focus({ preventScroll: true });
        }, 380);
      }
    });
  });

  var brand = $(".brand");
  if (brand) {
    brand.addEventListener("click", function () {
      if (menuOpen) {
        closeMenu(false);
      }
    });
  }

  mobileQuery.addEventListener("change", function (event) {
    if (!event.matches && menuOpen) {
      closeMenu(false);
    }
  });

  /* ── Editorial title split + stagger indexes ───────────── */

  $$(".section-title").forEach(function (title) {
    if (title.dataset.split === "true") {
      return;
    }

    var lines = title.innerHTML.split(/<br\s*\/?>/i);

    if (!lines.length) {
      return;
    }

    title.innerHTML = "";

    lines.forEach(function (line, index) {
      var outer = document.createElement("span");
      var inner = document.createElement("span");

      outer.className = "title-line";
      inner.className = "title-line__inner";
      inner.style.setProperty("--i", String(index));
      inner.innerHTML = line.trim();

      outer.appendChild(inner);
      title.appendChild(outer);
    });

    title.dataset.split = "true";
  });

  var staggerIndex = 0;
  $$(".tech-list").forEach(function (list) {
    $$(".tech-node", list).forEach(function (node) {
      node.style.setProperty("--i", String(staggerIndex));
      staggerIndex += 1;
    });
  });

  $$(".channels .channel").forEach(function (channel, index) {
    channel.style.setProperty("--i", String(index));
  });

  $$(".project__svg").forEach(function (svg) {
    $$(".art-ridge, .art-accent-line", svg).forEach(function (shape) {
      shape.setAttribute("pathLength", "1");
    });
  });

  /* ── Reveal on scroll ──────────────────────────────────── */

  var revealTargets = $$(".reveal");
  var log = $(".log");

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");

            if (entry.target.classList.contains("section-head")) {
              var kickerLabel = $(".section-kicker i", entry.target);

              if (kickerLabel) {
                kickerLabel.setAttribute("aria-hidden", "true");
                decodeText(kickerLabel, 700);
              }
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px" }
    );

    revealTargets.forEach(function (element) {
      revealObserver.observe(element);
    });

    if (log) {
      revealObserver.observe(log);
    }
  } else {
    revealTargets.forEach(function (element) {
      element.classList.add("is-visible");
    });
    if (log) {
      log.classList.add("is-visible");
    }
  }

  /* ── Pointer micro-interactions ────────────────────────── */

  if (finePointer.matches && !reduceMotion.matches) {
    var ambientLight = $("#ambientLight");

    if (ambientLight) {
      var ambientX = window.innerWidth / 2;
      var ambientY = window.innerHeight / 2;
      var ambientTargetX = ambientX;
      var ambientTargetY = ambientY;

      document.addEventListener(
        "pointermove",
        function (event) {
          ambientTargetX = event.clientX;
          ambientTargetY = event.clientY;
          ambientLight.classList.add("is-active");
        },
        { passive: true }
      );

      document.addEventListener("pointerleave", function () {
        ambientLight.classList.remove("is-active");
      });

      var moveAmbientLight = function () {
        ambientX += (ambientTargetX - ambientX) * 0.07;
        ambientY += (ambientTargetY - ambientY) * 0.07;
        ambientLight.style.transform =
          "translate3d(" + ambientX.toFixed(1) + "px, " + ambientY.toFixed(1) + "px, 0)";
        window.requestAnimationFrame(moveAmbientLight);
      };

      window.requestAnimationFrame(moveAmbientLight);
    }

    var heroVisual = $("#heroVisual");

    if (hero && heroVisual) {
      var heroFrame = 0;

      hero.addEventListener("pointermove", function (event) {
        if (heroFrame) {
          return;
        }

        heroFrame = window.requestAnimationFrame(function () {
          var rect = hero.getBoundingClientRect();
          var px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          var py = ((event.clientY - rect.top) / rect.height) * 2 - 1;

          heroVisual.style.setProperty("--px", px.toFixed(3));
          heroVisual.style.setProperty("--py", py.toFixed(3));
          heroFrame = 0;
        });
      });

      hero.addEventListener("pointerleave", function () {
        heroVisual.style.setProperty("--px", "0");
        heroVisual.style.setProperty("--py", "0");
      });
    }

    var identityCard = $("#identityCard");

    if (identityCard) {
      identityCard.addEventListener("pointermove", function (event) {
        var rect = identityCard.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        var y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

        identityCard.style.setProperty("--rx", (x * 2.2).toFixed(2));
        identityCard.style.setProperty("--ry", (y * -1.8).toFixed(2));
      });

      identityCard.addEventListener("pointerleave", function () {
        identityCard.style.setProperty("--rx", "0");
        identityCard.style.setProperty("--ry", "0");
      });
    }

    $$(".project").forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        var tiltX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        var tiltY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

        card.style.setProperty("--mx", event.clientX - rect.left + "px");
        card.style.setProperty("--my", event.clientY - rect.top + "px");
        card.style.setProperty("--tilt-x", (tiltX * 1.6).toFixed(2));
        card.style.setProperty("--tilt-y", (tiltY * -1.1).toFixed(2));
      });

      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--tilt-x", "0");
        card.style.setProperty("--tilt-y", "0");
      });
    });

    $$(".btn").forEach(function (button) {
      button.addEventListener("pointermove", function (event) {
        var rect = button.getBoundingClientRect();
        var x = (event.clientX - rect.left - rect.width / 2) * 0.16;
        var y = (event.clientY - rect.top - rect.height / 2) * 0.24;

        x = Math.max(-5, Math.min(5, x));
        y = Math.max(-4, Math.min(4, y));

        button.style.setProperty("--mag-x", x.toFixed(2) + "px");
        button.style.setProperty("--mag-y", y.toFixed(2) + "px");
      });

      button.addEventListener("pointerleave", function () {
        button.style.setProperty("--mag-x", "0px");
        button.style.setProperty("--mag-y", "0px");
      });
    });

    var cursor = $("#cursor");
    var cursorRing = $("#cursorRing");
    var cursorDot = $("#cursorDot");
    var cursorLabel = $("#cursorLabel");

    if (cursor && cursorRing && cursorDot) {
      var pointerX = window.innerWidth / 2;
      var pointerY = window.innerHeight / 2;
      var ringX = pointerX;
      var ringY = pointerY;
      var cursorFrame = 0;

      document.addEventListener(
        "pointermove",
        function (event) {
          pointerX = event.clientX;
          pointerY = event.clientY;
          cursorDot.style.transform =
            "translate3d(" + pointerX + "px, " + pointerY + "px, 0)";

          var interactive = event.target.closest(
            'a, button, input, textarea, [role="button"], [data-tech]'
          );
          var label = "";
          var labelTarget = event.target.closest
            ? event.target.closest("[data-cursor]")
            : null;

          if (labelTarget) {
            label = labelTarget.getAttribute("data-cursor") || "";
          } else if (event.target.closest(".project[data-project]")) {
            label = "OPEN FILE";
          } else if (event.target.closest(".tech-node")) {
            label = "INSPECT";
          } else if (event.target.closest(".terminal__input")) {
            label = "TYPE";
          } else if (event.target.closest(".theme-toggle")) {
            label = "THEME";
          } else if (event.target.closest(".menu-toggle")) {
            label = "MENU";
          } else if (event.target.closest(".terminal-toggle, .terminal")) {
            label = "TERMINAL";
          } else if (event.target.closest(".nav__link")) {
            label = "GO";
          } else if (event.target.closest(".footer__back, .hero__scroll")) {
            label = "SCROLL";
          } else if (interactive) {
            label = "OPEN";
          }

          cursor.classList.toggle("is-hover", Boolean(interactive));

          if (cursorLabel) {
            if (label) {
              cursorLabel.textContent = label;
              cursor.classList.add("has-label");
            } else {
              cursor.classList.remove("has-label");
            }
          }
        },
        { passive: true }
      );

      document.addEventListener("pointerdown", function () {
        cursor.classList.add("is-down");
      });

      document.addEventListener("pointerup", function () {
        cursor.classList.remove("is-down");
      });

      document.addEventListener("pointerleave", function () {
        cursor.style.opacity = "0";
        cursor.classList.remove("has-label");
      });

      document.addEventListener("pointerenter", function () {
        cursor.style.opacity = "1";
      });

      var moveCursorRing = function () {
        ringX += (pointerX - ringX) * 0.16;
        ringY += (pointerY - ringY) * 0.16;
        cursorRing.style.transform =
          "translate3d(" + ringX.toFixed(2) + "px, " + ringY.toFixed(2) + "px, 0)";

        if (cursorLabel) {
          cursorLabel.style.transform =
            "translate3d(" +
            (ringX + 24).toFixed(2) +
            "px, " +
            (ringY + 24).toFixed(2) +
            "px, 0)";
        }

        cursorFrame = window.requestAnimationFrame(moveCursorRing);
      };

      cursorFrame = window.requestAnimationFrame(moveCursorRing);
    }
  }

  /* ── Project vault drawer ──────────────────────────────── */

  var PROJECTS = {
    "balik-layar": {
      file: "001",
      category: "GAME DEVELOPMENT",
      title: "BALIK LAYAR",
      desc:
        "Game berbasis cerita dan pilihan pemain dengan tema anti judi online. Fokusnya ada pada narasi dan keputusan pemain yang membentuk arah cerita.",
      type: "Game",
      engine: "Godot",
      tech: "Godot / GDScript",
      status: "Personal Project",
      tags: ["Game Development", "Godot", "GDScript", "Narrative"],
      note:
        "Repositori dan demo belum dipublikasikan. Arsip ini tidak memasang tautan palsu; detail akan ditambahkan saat tersedia."
    },
    "lembah-kristal": {
      file: "002",
      category: "GAME DEVELOPMENT",
      title: "PERTAHANAN LEMBAH KRISTAL",
      desc:
        "Game tower defense dengan sistem wave dan pertahanan crystal. Pemain menyiapkan pertahanan untuk menghadapi gelombang musuh dan menjaga crystal tetap aman.",
      type: "Game",
      engine: "Web-based",
      tech: "HTML / CSS / JavaScript",
      status: "Personal Project",
      tags: ["Game Development", "Tower Defense", "HTML", "CSS", "JavaScript"],
      note:
        "Repositori dan demo belum dipublikasikan. Arsip ini tidak memasang tautan palsu; detail akan ditambahkan saat tersedia."
    }
  };

  var projectDialog = $("#projectDialog");
  var dialogFile = $("#dialogFile");
  var dialogCat = $("#dialogCat");
  var dialogTitle = $("#dialogTitle");
  var dialogDesc = $("#dialogDesc");
  var dialogVisual = $("#dialogVisual");
  var specType = $("#specType");
  var specEngine = $("#specEngine");
  var specTech = $("#specTech");
  var specStatus = $("#specStatus");
  var dialogTags = $("#dialogTags");
  var dialogNote = $("#dialogNote");
  var dialogScroll = $(".project-dialog__scroll");
  var closeDialog = $("#closeDialog");
  var closeDialogBottom = $("#closeDialogBottom");
  var lastProjectTrigger = null;

  function openProject(id, trigger) {
    var project = PROJECTS[id];

    if (!project || !projectDialog) {
      return;
    }

    lastProjectTrigger = trigger || null;

    if (dialogFile) {
      dialogFile.textContent = project.file;
    }
    if (dialogCat) {
      dialogCat.textContent = project.category;
    }
    if (dialogTitle) {
      dialogTitle.textContent = project.title;
    }
    if (dialogDesc) {
      dialogDesc.textContent = project.desc;
    }
    if (specType) {
      specType.textContent = project.type;
    }
    if (specEngine) {
      specEngine.textContent = project.engine;
    }
    if (specTech) {
      specTech.textContent = project.tech;
    }
    if (specStatus) {
      specStatus.textContent = project.status;
    }
    if (dialogNote) {
      dialogNote.textContent = project.note;
    }

    if (dialogTags) {
      dialogTags.innerHTML = "";
      project.tags.forEach(function (tag) {
        var chip = document.createElement("span");
        chip.textContent = tag;
        dialogTags.appendChild(chip);
      });
    }

    if (dialogVisual) {
      var sourceSvg = trigger ? $(".project__svg", trigger) : null;
      dialogVisual.innerHTML = sourceSvg ? sourceSvg.outerHTML : "";
    }

    if (dialogScroll) {
      dialogScroll.scrollTop = 0;
    }

    if (lenis) {
      lenis.stop();
    }

    if (typeof projectDialog.showModal === "function") {
      if (!projectDialog.open) {
        projectDialog.showModal();
      }
    } else {
      projectDialog.setAttribute("open", "");
    }

    root.classList.add("dialog-open");

    if (closeDialog) {
      window.setTimeout(function () {
        closeDialog.focus({ preventScroll: true });
      }, 40);
    }
  }

  function closeProject() {
    if (!projectDialog) {
      return;
    }

    if (typeof projectDialog.close === "function" && projectDialog.open) {
      projectDialog.close();
    } else {
      projectDialog.removeAttribute("open");
      root.classList.remove("dialog-open");

      if (lenis) {
        lenis.start();
      }

      if (lastProjectTrigger) {
        lastProjectTrigger.focus({ preventScroll: true });
      }
    }
  }

  $$(".project[data-project]").forEach(function (card) {
    card.addEventListener("click", function () {
      openProject(card.dataset.project, card);
    });
  });

  if (closeDialog) {
    closeDialog.addEventListener("click", closeProject);
  }

  if (closeDialogBottom) {
    closeDialogBottom.addEventListener("click", closeProject);
  }

  if (projectDialog) {
    projectDialog.addEventListener("click", function (event) {
      if (event.target === projectDialog) {
        closeProject();
      }
    });

    projectDialog.addEventListener("close", function () {
      root.classList.remove("dialog-open");

      if (lenis) {
        lenis.start();
      }

      if (lastProjectTrigger) {
        lastProjectTrigger.focus({ preventScroll: true });
      }
    });
  }

  /* ── Technology matrix inspector ───────────────────────── */

  var TECH_DESCRIPTIONS = {
    PHP:
      "Bahasa server-side untuk membangun halaman web dinamis dan memproses data di sisi server.",
    Java:
      "Bahasa berorientasi objek yang digunakan untuk melatih struktur program dan logika.",
    "C++":
      "Bahasa yang membantu memahami dasar komputasi, struktur data, dan efisiensi program.",
    JavaScript:
      "Bahasa utama untuk menghadirkan interaksi, logika, dan pengalaman pada web.",
    HTML:
      "Fondasi struktur dan semantik sebuah halaman web.",
    CSS:
      "Mengatur tata letak, visual, dan responsivitas antarmuka.",
    MySQL:
      "Basis data relasional untuk menyimpan, mengelola, dan mengambil data.",
    MariaDB:
      "Basis data relasional turunan MySQL untuk latihan dan pengembangan.",
    SQL:
      "Bahasa query untuk membaca, menyusun, dan mengelola data relasional.",
    Git:
      "Version control untuk melacak perubahan kode dari waktu ke waktu.",
    GitHub:
      "Platform kolaborasi dan penyimpanan repositori kode.",
    "VS Code":
      "Editor kode untuk menulis, menavigasi, dan mengelola proyek.",
    Godot:
      "Game engine untuk membangun game 2D dan prototipe pengalaman interaktif."
  };

  var techNodes = $$(".tech-node");
  var techName = $("#techName");
  var techDesc = $("#techDesc");
  var techCategory = $("#techCategory");
  var techId = $("#techId");
  var techBody = $(".tech-readout__body");

  function inspectTech(node) {
    if (!node) {
      return;
    }

    var name = node.dataset.tech;
    var group = node.closest(".tech-group");
    var groupTitle = group ? $(".tech-group__head h3", group) : null;
    var groupCode = group ? $(".tech-group__index", group) : null;
    var nodeCode = $(".tech-node__index", node);

    if (techName) {
      techName.textContent = name || "UNKNOWN";
    }

    if (techDesc) {
      techDesc.textContent =
        TECH_DESCRIPTIONS[name] || "Detail untuk node ini belum tersedia.";
    }

    if (techCategory) {
      techCategory.textContent = groupTitle
        ? groupTitle.textContent.trim()
        : "TECHNOLOGY";
    }

    if (techId) {
      var sectionCode = groupCode
        ? groupCode.textContent.replace(/[^0-9]/g, "")
        : "00";
      var itemCode = nodeCode ? nodeCode.textContent.trim() : "00";
      techId.textContent = "NODE / M." + sectionCode + "." + itemCode;
    }

    techNodes.forEach(function (item) {
      item.classList.toggle("is-active", item === node);
    });

    if (techBody) {
      techBody.classList.remove("is-updating");
      void techBody.offsetWidth;
      techBody.classList.add("is-updating");
    }
  }

  techNodes.forEach(function (node) {
    node.addEventListener("mouseenter", function () {
      inspectTech(node);
    });

    node.addEventListener("focus", function () {
      inspectTech(node);
    });

    node.addEventListener("click", function () {
      inspectTech(node);
    });
  });

  /* ── Interactive terminal ──────────────────────────────── */

  var terminal = $("#terminal");
  var terminalForm = $("#terminalForm");
  var terminalInput = $("#terminalInput");
  var terminalOutput = $("#terminalOutput");
  var terminalClose = $("#terminalClose");
  var terminalText = terminalToggle ? $(".terminal-toggle__text", terminalToggle) : null;
  var terminalPrompt = terminalToggle
    ? $(".terminal-toggle__prompt", terminalToggle)
    : null;
  var terminalHistory = [];
  var terminalHistoryIndex = 0;

  function terminalPrint(text, modifier) {
    if (!terminalOutput) {
      return;
    }

    var line = document.createElement("p");
    line.className = "term-line" + (modifier ? " term-line--" + modifier : "");
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function terminalBlank() {
    terminalPrint("\u00a0");
  }

  function terminalEcho(command) {
    terminalPrint("ILHAM@ARCHIVE:~$ " + command, "cmd");
  }

  function terminalClear() {
    if (terminalOutput) {
      terminalOutput.innerHTML = "";
    }
  }

  var SECTION_LABELS = {
    home: "HOME",
    about: "ABOUT",
    skills: "SKILLS",
    projects: "PROJECTS",
    journey: "JOURNEY",
    contact: "CONTACT"
  };

  function terminalGoto(rawTarget) {
    var target = rawTarget.trim().replace(/^#/, "").toLowerCase();
    var element = target ? $("#" + target) : null;

    if (!element || !SECTION_LABELS[target]) {
      terminalPrint('unknown section: "' + target + '"', "error");
      terminalPrint(
        "sections: home · about · skills · projects · journey · contact",
        "muted"
      );
      return;
    }

    closeTerminal(false);
    window.setTimeout(function () {
      scrollToSection(element);
    }, 60);
  }

  function terminalOpenProject(rawTarget) {
    var key = rawTarget.trim().toLowerCase();
    var aliases = {
      "001": "balik-layar",
      balik: "balik-layar",
      "balik-layar": "balik-layar",
      "002": "lembah-kristal",
      kristal: "lembah-kristal",
      lembah: "lembah-kristal",
      "lembah-kristal": "lembah-kristal"
    };
    var id = aliases[key] || key;
    var project = PROJECTS[id];

    if (!project) {
      terminalPrint('unknown file: "' + key + '"', "error");
      terminalPrint("files: balik-layar · lembah-kristal", "muted");
      return;
    }

    closeTerminal(false);
    openProject(id, $('.project[data-project="' + id + '"]'));
  }

  function terminalTheme(rawArgs) {
    var mode = rawArgs.trim().toLowerCase();
    var next;

    if (!mode || mode === "toggle") {
      next = root.dataset.theme === "light" ? "dark" : "light";
    } else if (mode === "light" || mode === "dark") {
      next = mode;
    } else {
      terminalPrint("usage: theme [light|dark|toggle]", "muted");
      return;
    }

    switchTheme(next, null);
    terminalPrint("Theme set to " + next + ".", "accent");
  }

  function terminalList() {
    terminalPrint("ARCHIVE CONTENTS", "accent");
    terminalPrint("  home      identity & introduction");
    terminalPrint("  about     digital identity profile");
    terminalPrint("  skills    technology matrix");
    terminalPrint("  projects  project vault");
    terminalPrint("  journey   development log");
    terminalPrint("  contact   communication channels");
    terminalBlank();
    terminalPrint("VAULT FILES", "accent");
    terminalPrint("  001  balik-layar");
    terminalPrint("  002  lembah-kristal");
  }

  function runTerminalCommand(rawCommand) {
    var command = rawCommand.trim().toLowerCase();
    var match;

    if (!command) {
      return;
    }

    terminalEcho(rawCommand.trim());

    if ((match = command.match(/^(?:goto|go|cd)\s+(.+)$/))) {
      terminalGoto(match[1]);
      terminalBlank();
      return;
    }

    if ((match = command.match(/^(?:open|cat)\s+(.+)$/))) {
      terminalOpenProject(match[1]);
      terminalBlank();
      return;
    }

    if (/^theme(?:\s+.*)?$/.test(command)) {
      terminalTheme(command.replace(/^theme\s*/, ""));
      terminalBlank();
      return;
    }

    if (/^sudo(?:\s|$)/.test(command)) {
      terminalPrint(
        "PERMISSION DENIED. Curiosity is already enough.",
        "muted"
      );
      terminalBlank();
      return;
    }

    switch (command) {
      case "help":
        terminalPrint("AVAILABLE COMMANDS", "accent");
        terminalPrint("  about            identity & profile");
        terminalPrint("  skills           technology matrix");
        terminalPrint("  projects         project vault");
        terminalPrint("  contact          communication channels");
        terminalPrint("  goto <section>   jump to a section");
        terminalPrint("  open <file>      open a project file");
        terminalPrint("  theme [mode]     light / dark / toggle");
        terminalPrint("  ls               list archive contents");
        terminalPrint("  date             current local time");
        terminalPrint("  status           archive status");
        terminalPrint("  whoami           current identity");
        terminalPrint("  clear            clear this terminal");
        terminalPrint("  exit             close this terminal");
        break;

      case "about":
        terminalPrint("MUH. ILHAM AR.", "accent");
        terminalPrint("Informatics Engineering / UIN Alauddin Makassar");
        terminalPrint("Focus    : Programming / Web Development / Database / Game Development");
        terminalPrint("Hobbies  : Main game, membuat game");
        terminalPrint("Location : Indonesia");
        terminalPrint("Status   : Learning & Building");
        break;

      case "skills":
        terminalPrint("TECHNOLOGY MATRIX", "accent");
        terminalPrint("PROGRAMMING  PHP · Java · C++ · JavaScript");
        terminalPrint("WEB          HTML · CSS · JavaScript");
        terminalPrint("DATABASE     MySQL · MariaDB · SQL");
        terminalPrint("TOOLS        Git · GitHub · VS Code · Godot");
        terminalPrint("Note: ini area belajar, bukan skor kompetensi.", "muted");
        break;

      case "projects":
        terminalPrint("PROJECT VAULT / 02 ENTRIES", "accent");
        terminalPrint("FILE_001  BALIK LAYAR");
        terminalPrint("          GAME DEVELOPMENT / Godot · GDScript");
        terminalPrint(
          "          Game berbasis cerita dan pilihan pemain dengan tema anti judi online."
        );
        terminalBlank();
        terminalPrint("FILE_002  PERTAHANAN LEMBAH KRISTAL");
        terminalPrint("          GAME DEVELOPMENT / HTML · CSS · JavaScript");
        terminalPrint(
          "          Game tower defense dengan sistem wave dan pertahanan crystal."
        );
        terminalPrint("Repository & demo: belum dipublikasikan.", "muted");
        break;

      case "contact":
        terminalPrint("COMMUNICATION TERMINAL / CHANNEL STATUS", "accent");
        terminalPrint("EMAIL      muhilham1444@gmail.com");
        terminalPrint("GITHUB     github.com/Hint21");
        terminalPrint("INSTAGRAM  @ilham_ar_21");
        terminalPrint("LINKEDIN   [LINKEDIN URL]    PENDING");
        terminalPrint("Email, GitHub, dan Instagram aktif. LinkedIn menunggu pembaruan.", "muted");
        break;

      case "status":
        terminalPrint("ARCHIVE STATUS", "accent");
        terminalPrint("SYSTEM      : ONLINE");
        terminalPrint("IDENTITY    : FOUND");
        terminalPrint("MODE        : LEARNING & BUILDING");
        terminalPrint("THEME       : " + (root.dataset.theme || "dark").toUpperCase());
        terminalPrint("SESSION     : LOCAL / READ-ONLY");
        break;

      case "whoami":
        terminalPrint("muh-ilham-ar / informatics-student", "accent");
        terminalPrint("UIN Alauddin Makassar / Indonesia");
        break;

      case "ls":
      case "dir":
        terminalList();
        break;

      case "date":
      case "time":
        terminalPrint(
          "LOCAL TIME // " +
            new Date().toLocaleString("id-ID", {
              dateStyle: "full",
              timeStyle: "medium"
            }),
          "accent"
        );
        break;

      case "clear":
      case "cls":
        terminalClear();
        return;

      case "exit":
      case "close":
        closeTerminal();
        return;

      default:
        terminalPrint('command not found: "' + command + '"', "error");
        terminalPrint('type "help" for available commands.', "muted");
    }

    terminalBlank();
  }

  function openTerminal(command) {
    if (!terminal) {
      return;
    }

    if (menuOpen) {
      closeMenu(false);
    }

    terminal.hidden = false;

    if (lenis) {
      lenis.stop();
    }

    if (terminalToggle) {
      terminalToggle.setAttribute("aria-expanded", "true");
      terminalToggle.setAttribute("aria-label", "Tutup terminal interaktif");
      terminalToggle.classList.add("is-open");
    }

    if (terminalText) {
      terminalText.textContent = "CLOSE TERMINAL";
    }

    if (terminalPrompt) {
      terminalPrompt.textContent = "×";
    }

    window.requestAnimationFrame(function () {
      if (terminalInput) {
        terminalInput.focus({ preventScroll: true });
      }
      if (terminalOutput) {
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
      }
    });

    if (command) {
      window.setTimeout(function () {
        runTerminalCommand(command);
      }, 140);
    }
  }

  function closeTerminal(returnFocus) {
    if (!terminal || terminal.hidden) {
      return;
    }

    terminal.hidden = true;

    if (lenis) {
      lenis.start();
    }

    if (terminalToggle) {
      terminalToggle.setAttribute("aria-expanded", "false");
      terminalToggle.setAttribute("aria-label", "Buka terminal interaktif");
      terminalToggle.classList.remove("is-open");
    }

    if (terminalText) {
      terminalText.textContent = "OPEN TERMINAL";
    }

    if (terminalPrompt) {
      terminalPrompt.textContent = ">_";
    }

    if (returnFocus !== false && terminalToggle) {
      terminalToggle.focus({ preventScroll: true });
    }
  }

  if (terminalToggle) {
    terminalToggle.addEventListener("click", function () {
      if (terminal && terminal.hidden) {
        openTerminal();
      } else {
        closeTerminal();
      }
    });
  }

  if (terminalClose) {
    terminalClose.addEventListener("click", function () {
      closeTerminal();
    });
  }

  $$("[data-terminal-command]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openTerminal(trigger.dataset.terminalCommand);
    });
  });

  if (terminalForm) {
    terminalForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!terminalInput) {
        return;
      }

      var value = terminalInput.value.trim();

      if (!value) {
        return;
      }

      terminalHistory.push(value);
      terminalHistoryIndex = terminalHistory.length;
      runTerminalCommand(value);
      terminalInput.value = "";
      terminalInput.focus({ preventScroll: true });
    });
  }

  if (terminalInput) {
    terminalInput.addEventListener("keydown", function (event) {
      if (event.key === "ArrowUp") {        event.preventDefault();
        if (!terminalHistory.length) {
          return;
        }
        terminalHistoryIndex = Math.max(0, terminalHistoryIndex - 1);
        terminalInput.value = terminalHistory[terminalHistoryIndex] || "";
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!terminalHistory.length) {
          return;
        }
        terminalHistoryIndex = Math.min(
          terminalHistory.length,
          terminalHistoryIndex + 1
        );
        terminalInput.value =
          terminalHistoryIndex === terminalHistory.length
            ? ""
            : terminalHistory[terminalHistoryIndex] || "";
      }
    });
  }

  document.addEventListener("pointerdown", function (event) {
    if (!terminal || terminal.hidden) {
      return;
    }

    if (terminal.contains(event.target)) {
      return;
    }

    if (terminalToggle && terminalToggle.contains(event.target)) {
      return;
    }

    if (event.target.closest("[data-terminal-command]")) {
      return;
    }

    closeTerminal(false);
  });

  /* ── Footer year ───────────────────────────────────────── */

  var footerYear = $("#footerYear");

  if (footerYear) {
    footerYear.textContent = "© " + new Date().getFullYear();
  }

  /* ── Profile photo fallback ────────────────────────────── */

  var portraitPhoto = $(".portrait-photo");

  if (portraitPhoto) {
    var dropPortrait = function () {
      var portrait = portraitPhoto.closest(".id-card__portrait");

      if (portrait) {
        portrait.classList.remove("has-photo");
      }

      portraitPhoto.remove();
    };

    if (portraitPhoto.complete && portraitPhoto.naturalWidth === 0) {
      dropPortrait();
    } else {
      portraitPhoto.addEventListener("error", dropPortrait);
    }
  }

  /* ── Global keyboard shortcuts ─────────────────────────── */

  document.addEventListener("keydown", function (event) {
    var isTyping =
      event.target &&
      (event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable);

    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === "`" || event.key === "~") &&
      !isTyping &&
      !(projectDialog && projectDialog.open)
    ) {
      event.preventDefault();
      if (terminal && terminal.hidden) {
        openTerminal();
      } else {
        closeTerminal();
      }
      return;
    }

    if (event.key !== "Escape") {
      return;
    }

    if (projectDialog && projectDialog.open) {
      return;
    }

    if (terminal && !terminal.hidden) {
      closeTerminal();
      return;
    }

    if (menuOpen) {
      closeMenu();
    }
  });
})();
