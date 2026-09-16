/* Bordon. ИИ-агенты, LLM и продукты под ключ.
   Интерактив: вкладки направлений, фильтр кейсов, карусель экранов,
   бургер-меню, кнопка наверх, анимация агентного конвейера.
   Содержимое видно всегда: анимируются только декор и порядок блоков. */

(() => {
  

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = window.gsap !== undefined;
  var hasFlip = window.Flip !== undefined;

  /* --------------------------------------------------------- вкладки */

  function initTabs() {
    var list = document.querySelector(".tabs__list");
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll(".tabs__tab"));

    function select(index) {
      tabs.forEach((tab, i) => {
        var on = i === index;
        tab.classList.toggle("is-on", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        var panelId = tab.getAttribute("aria-controls");
        var panel = panelId ? document.querySelector("#" + panelId) : null;
        if (panel) {
          panel.classList.toggle("is-on", on);
          if (on) panel.removeAttribute("hidden");
          else panel.setAttribute("hidden", "");
        }
      });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        select(i);
      });
      tab.addEventListener("keydown", (event) => {
        var step = 0;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") step = 1;
        else if (event.key === "ArrowUp" || event.key === "ArrowLeft") step = -1;
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
      var state = hasGsap && hasFlip && !reduced ? window.Flip.getState(cases) : null;

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
        chips.forEach((other) => {
          var on = other === chip;
          other.classList.toggle("is-on", on);
          other.setAttribute("aria-pressed", on ? "true" : "false");
        });
        apply(chip.dataset.filter);
      });
    });
  }

  /* ------------------------------------------------------- карусель */

  function initCarousel() {
    var track = document.querySelector("#carousel-track");
    var prev = document.querySelector("#prev");
    var next = document.querySelector("#next");
    var dotsBox = document.querySelector("#dots");
    if (!track || !prev || !next || !dotsBox) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    if (!slides.length) return;

    var dots = slides.map((_, i) => {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("aria-label", "Экран " + (i + 1));
      dot.addEventListener("click", () => {
        go(i);
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
      var target = Math.max(0, Math.min(index, slides.length - 1));
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
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }

    prev.addEventListener("click", () => {
      go(current() - 1);
    });
    next.addEventListener("click", () => {
      go(current() + 1);
    });

    track.addEventListener("scroll", () => {
      window.requestAnimationFrame(sync);
    }, { passive: true });
    window.addEventListener("resize", sync);

    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(current() + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(current() - 1);
      }
    });

    sync();
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
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
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

  /* --------------------------------------------- конвейер в первом экране */

  function initFlow() {
    var flow = document.querySelector(".flow");
    var stages = Array.prototype.slice.call(document.querySelectorAll(".flow__stage"));
    var packet = document.querySelector(".flow__packet");
    if (!flow || !stages.length || !packet) return;

    if (reduced || !hasGsap) {
      stages.forEach((stage) => {
        stage.classList.add("is-on");
      });
      packet.style.display = "none";
      return;
    }

    var timeline = null;

    function build() {
      if (timeline) {
        timeline.kill();
        timeline = null;
      }

      var flowBox = flow.getBoundingClientRect();
      var size = packet.offsetHeight || 9;
      var ys = stages.map((stage) => {
        var box = stage.getBoundingClientRect();
        return box.top - flowBox.top + box.height / 2 - size / 2;
      });

      window.gsap.set(packet, { y: ys[0], opacity: 1 });

      timeline = window.gsap.timeline({ repeat: -1, repeatDelay: 0.7 });

      ys.forEach((y, index) => {
        timeline.to(
          packet,
          {
            y: y,
            duration: 0.6,
            ease: "power2.inOut",
            onStart: () => {
              stages.forEach((stage, k) => {
                stage.classList.toggle("is-on", k <= index);
              });
            },
          },
          index === 0 ? 0 : "+=0.18",
        );
      });

      timeline
        .to(packet, { opacity: 0, duration: 0.35 }, "+=0.6")
        .add(() => {
          stages.forEach((stage) => {
            stage.classList.remove("is-on");
          });
          window.gsap.set(packet, { y: ys[0] });
        })
        .to(packet, { opacity: 1, duration: 0.25 });
    }

    build();

    var timer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(build, 200);
    });
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
      duration: width / 44,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: window.gsap.utils.unitize((value) => parseFloat(value) % width),
      },
    });
  }

  /* ------------------------------------------- поле точек и прокрутка */

  function initField() {
    var canvas = document.querySelector("#hero-canvas");
    var host = canvas && canvas.parentElement;
    if (!canvas || !host || reduced) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var step = 32;
    var radius = 160;
    var points = [];
    var width = 0;
    var height = 0;
    var pointer = { x: -999, y: -999 };
    var smooth = { x: -999, y: -999 };

    function measure() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      points = [];
      for (var y = step / 2; y < height; y += step) {
        for (var x = step / 2; x < width; x += step) {
          points.push(x, y);
        }
      }
    }

    function frame() {
      smooth.x += (pointer.x - smooth.x) * 0.12;
      smooth.y += (pointer.y - smooth.y) * 0.12;
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < points.length; i += 2) {
        var px = points[i];
        var py = points[i + 1];
        var dx = px - smooth.x;
        var dy = py - smooth.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var near = dist < radius ? 1 - dist / radius : 0;
        var size = 1 + near * 2.1;

        if (near > 0.05) {
          ctx.fillStyle = "rgba(201, 242, 78, " + (0.16 + near * 0.7).toFixed(3) + ")";
        } else {
          ctx.fillStyle = "rgba(233, 231, 224, 0.07)";
        }
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      }
      window.requestAnimationFrame(frame);
    }

    host.addEventListener("pointermove", (event) => {
      var box = host.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    });
    host.addEventListener("pointerleave", () => {
      pointer.x = -999;
      pointer.y = -999;
    });

    var timer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 150);
    });

    measure();
    window.requestAnimationFrame(frame);
  }

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
    var layer = document.querySelector(".hero__bg");
    if (layer) {
      window.gsap.to(layer, {
        yPercent: 16,
        opacity: 0.3,
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

  function boot() {
    initTabs();
    initFilter();
    initCarousel();
    initBurger();
    initTop();
    initFlow();
    initTicker();
    initField();
    initScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
