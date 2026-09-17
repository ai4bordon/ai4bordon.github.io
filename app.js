/* Bordon. ИИ-агенты, LLM и продукты под ключ.
   Интерактив: вкладки направлений, фильтр кейсов, карусель с автопрокруткой,
   бургер-меню, кнопка наверх, анимированный сетевой фон.
   Содержимое видно всегда: анимируются только фон и микродвижения в блоках. */

(() => {
  /* На GitHub Pages бэкенда нет, поэтому форма идёт на сервер по адресу.
     На самом сервере используется относительный путь. */
  var API_BASE = "";
  if (location.hostname.endsWith("github.io")) {
    API_BASE = "https://bordon.digitai.icu";
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = window.gsap !== undefined;
  var hasFlip = window.Flip !== undefined;

  /* --------------------------------------------------------- вкладки */

  function initTabs() {
    var list = document.querySelector(".tabs__list");
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll(".tabs__tab"));
    var panelsBox = document.querySelector(".tabs__panels");

    /* панели разной высоты: переводим высоту плавно, иначе нижний блок скачет */
    function softenHeight(before) {
      if (!panelsBox || reduced || !panelsBox.animate) return;
      var after = panelsBox.getBoundingClientRect().height;
      if (!before || Math.abs(before - after) < 2) return;
      panelsBox.animate(
        [{ height: before + "px" }, { height: after + "px" }],
        { duration: 260, easing: "ease-out" },
      );
    }

    function select(index) {
      var before =
        panelsBox && panelsBox.getBoundingClientRect
          ? panelsBox.getBoundingClientRect().height
          : 0;
      tabs.forEach((tab, i) => {
        var on = i === index;
        tab.classList.toggle("is-on", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        var panelId = tab.getAttribute("aria-controls");
        var panel = panelId ? document.querySelector("#" + panelId) : null;
        if (!panel) return;
        panel.classList.toggle("is-on", on);
        if (on) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      });
      softenHeight(before);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        select(i);
      });
      tab.addEventListener("keydown", (event) => {
        var step = 0;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") step = 1;
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
          step = -1;
        else if (event.key === "Home") step = -99;
        else if (event.key === "End") step = 99;
        else return;
        event.preventDefault();
        var next = (i + step + tabs.length) % tabs.length;
        if (step === -99) next = 0;
        else if (step === 99) next = tabs.length - 1;
        select(next);
        tabs[next].focus();
      });
    });
  }

  /* ------------------------------------------------- фильтр кейсов */

  function initFilter() {
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var cases = Array.prototype.slice.call(document.querySelectorAll(".case"));
    if (!chips.length || !cases.length) return;

    function apply(cat) {
      var state =
        hasGsap && hasFlip && !reduced ? window.Flip.getState(cases) : null;

      cases.forEach((item) => {
        var show = cat === "all" || item.dataset.cat === cat;
        if (show) item.removeAttribute("hidden");
        else item.setAttribute("hidden", "");
        if (!show) item.removeAttribute("open");
      });

      if (state) {
        window.Flip.from(state, {
          duration: 0.4,
          ease: "power2.out",
          absolute: true,
          stagger: 0.012,
        });
      }
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        for (const other of chips) {
          const on = other === chip;
          other.classList.toggle("is-on", on);
          other.setAttribute("aria-pressed", on ? "true" : "false");
        }
        apply(chip.dataset.filter);
      });
    });
  }

  /* --------------------------------------------- карусель с автопрокруткой */

  function initCarousel() {
    var track = document.querySelector("#carousel-track");
    var prev = document.querySelector("#prev");
    var next = document.querySelector("#next");
    var dotsBox = document.querySelector("#dots");
    if (!track || !prev || !next || !dotsBox) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    if (!slides.length) return;

    var AUTOPLAY_MS = 4200;
    var timer = null;
    var paused = false;

    var dots = slides.map((_, i) => {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("aria-label", "Экран " + (i + 1));
      dot.addEventListener("click", () => {
        go(i);
        hold();
      });
      dotsBox.append(dot);
      return dot;
    });

    function step() {
      var first = slides[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      return first + gap;
    }

    function current() {
      var s = step();
      return s > 0 ? Math.round(track.scrollLeft / s) : 0;
    }

    function go(index) {
      var last = slides.length - 1;
      var target = index;
      if (index > last) target = 0;
      else if (index < 0) target = last;
      track.scrollTo({
        left: target * step(),
        behavior: reduced ? "auto" : "smooth",
      });
    }

    function sync() {
      var i = current();
      dots.forEach((dot, k) => {
        dot.classList.toggle("is-on", k === i);
        if (k === i) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      prev.disabled = track.scrollLeft <= 2;
      next.disabled =
        track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }

    function advance() {
      if (!paused) go(current() + 1);
    }

    function start() {
      if (reduced || timer) return;
      timer = window.setInterval(advance, AUTOPLAY_MS);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    /* пауза на время взаимодействия и ещё немного после него */
    function hold() {
      paused = true;
      stop();
      window.clearTimeout(hold.timer);
      hold.timer = window.setTimeout(() => {
        paused = false;
        start();
      }, AUTOPLAY_MS * 2);
    }

    prev.addEventListener("click", () => {
      go(current() - 1);
      hold();
    });
    next.addEventListener("click", () => {
      go(current() + 1);
      hold();
    });

    track.addEventListener(
      "scroll",
      () => {
        window.requestAnimationFrame(sync);
      },
      { passive: true },
    );
    /* наведение мыши ленту не останавливает: она должна ехать всегда */

    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(current() + 1);
        hold();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(current() - 1);
        hold();
      }
    });

    window.addEventListener("resize", sync);

    sync();
    start();
  }

  /* -------------------------------------------------------- бургер */

  function initBurger() {
    var button = document.querySelector("#burger");
    var nav = document.querySelector("#nav");
    if (!button || !nav) return;

    function setOpen(open) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      nav.classList.toggle("is-open", open);
    }

    button.addEventListener("click", () => {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        button.getAttribute("aria-expanded") === "true"
      ) {
        setOpen(false);
        button.focus();
      }
    });
  }

  /* ----------------------------------------------------- кнопка вверх */

  function initTop() {
    var button = document.querySelector("#totop");
    if (!button) return;

    function paint() {
      var show = window.scrollY > 700;
      if (show) button.removeAttribute("hidden");
      else button.setAttribute("hidden", "");
    }

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      var brand = document.querySelector(".brand");
      if (brand) brand.focus();
    });

    window.addEventListener("scroll", paint, { passive: true });
    paint();
  }

  /* ------------------------------------- сетевой фон на всю страницу */

  function initNetwork() {
    var canvas = document.querySelector("#net-canvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var width = 0;
    var height = 0;
    var nodes = [];
    var running = true;
    var LINK = 150;

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      seed();
    }

    function seed() {
      var count = Math.round((width * height) / 42000);
      count = Math.max(18, Math.min(count, 70));
      nodes = [];
      for (var i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() < 0.16 ? 1.7 : 1,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < nodes.length; i += 1) {
        var a = nodes[i];
        if (running) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > width) a.vx *= -1;
          if (a.y < 0 || a.y > height) a.vy *= -1;
        }

        for (var j = i + 1; j < nodes.length; j += 1) {
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK) {
            const alpha = (1 - dist / LINK) * 0.14;
            ctx.strokeStyle = `rgba(233, 231, 224, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (var k = 0; k < nodes.length; k += 1) {
        var n = nodes[k];
        ctx.fillStyle =
          n.r > 1.4 ? "rgba(201, 242, 78, 0.34)" : "rgba(233, 231, 224, 0.16)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame() {
      if (!running && !reduced) {
        window.requestAnimationFrame(frame);
        return;
      }
      draw();
      if (reduced) return;
      window.requestAnimationFrame(frame);
    }

    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
    });

    var resizeTimer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 200);
    });

    resize();
    if (reduced) draw();
    else window.requestAnimationFrame(frame);
  }

  /* ------------------------------------------------- бегущая строка */

  function initTicker() {
    var track = document.querySelector("#stack-track");
    if (!track || !hasGsap || reduced) return;

    var clone = track.cloneNode(true);
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    track.parentNode.append(clone);

    var width = track.offsetWidth;
    if (!width) return;

    window.gsap.set([track, clone], { x: 0 });
    window.gsap.to([track, clone], {
      x: -width,
      duration: width / 46,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: window.gsap.utils.unitize((value) => parseFloat(value) % width),
      },
    });
  }

  /* ---------------------------------------------------- прогресс и скролл */

  function initScroll() {
    var fill = document.querySelector("#rail-fill");
    if (fill) {
      var paint = () => {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var ratio = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
        fill.style.height = (ratio * 100).toFixed(2) + "%";
      };
      window.addEventListener("scroll", paint, { passive: true });
      window.addEventListener("resize", paint);
      paint();
    }

    if (!hasGsap || !window.ScrollTrigger || reduced) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    /* схема конвейера слегка ведёт за прокруткой */
    var map = document.querySelector(".flowmap");
    if (map) {
      window.gsap.to(map, {
        y: -14,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }

  /* --------------------------------------------- заявка на разбор */

  function initBrief() {
    var form = document.querySelector("#brief-form");
    if (!form) return;

    var err = document.querySelector("#b-err");
    var fallback = document.querySelector("#b-fallback");
    var out = document.querySelector("#b-text");
    var sent = document.querySelector("#b-sent");
    var ok = document.querySelector("#b-ok");

    function fail(message, field) {
      if (err) {
        err.textContent = message;
        err.removeAttribute("hidden");
      }
      if (field) field.focus();
    }

    function showText(value) {
      if (!fallback || !out) return;
      out.value = value;
      fallback.removeAttribute("hidden");
      out.focus();
      out.select();
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const trap = form.elements.trap ? form.elements.trap.value.trim() : "";
      const who = form.elements.name.value.trim();
      const contact = form.elements.contact.value.trim();
      const task = form.elements.task.value.trim();
      const pain = form.elements.pain.value.trim();
      const limits = form.elements.limits.value.trim();

      if (err) err.setAttribute("hidden", "");
      if (fallback) fallback.setAttribute("hidden", "");
      if (sent) sent.setAttribute("hidden", "");

      if (!who) {
        fail("Напишите, как к вам обращаться.", form.elements.name);
        return;
      }
      if (!contact) {
        fail("Напишите, как с вами связаться.", form.elements.contact);
        return;
      }
      if (!task) {
        fail("Опишите задачу хотя бы одним предложением.", form.elements.task);
        return;
      }

      const lines = [
        "Заявка на разбор",
        "Имя: " + who,
        "Контакт: " + contact,
        "Задача: " + task,
      ];
      if (pain) lines.push("Что не работает: " + pain);
      if (limits) lines.push("Сроки и бюджет: " + limits);
      const text = lines.join(String.fromCharCode(10));

      const button = form.querySelector("button[type=submit]");
      const label = button ? button.textContent : "";
      if (button) {
        button.disabled = true;
        button.textContent = "Отправляю";
      }

      const restore = () => {
        if (!button) return;
        button.disabled = false;
        button.textContent = label;
      };

      fetch(API_BASE + "/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: who, contact, task, pain, limits, trap }),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok)
            throw new Error(data.error || "Не получилось отправить.");
          return data;
        })
        .then(() => {
          if (sent) sent.removeAttribute("hidden");
          form.reset();
          if (ok && ok.showModal) ok.showModal();
        })
        .catch(() => {
          /* сервер недоступен: отдаём текст, чтобы человек отправил сам */
          showText(text);
        })
        .finally(restore);
    });
  }

  function boot() {
    initTabs();
    initFilter();
    initCarousel();
    initBurger();
    initTop();
    initNetwork();
    initTicker();
    initScroll();
    initBrief();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
