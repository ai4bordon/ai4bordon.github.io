/* Bordon. Агенты, LLM и продакшен.
   Эффекты: интерактивное поле точек в первом экране, бегущая строка стека,
   фильтр кейсов через GSAP Flip, полоса прогресса чтения.
   Содержимое видно всегда: анимируется только декор и порядок блоков. */

(() => {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";

  /* ---------------------------------------------------------------- фильтр */

  function initFilter() {
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var cases = Array.prototype.slice.call(document.querySelectorAll(".case"));
    if (!chips.length || !cases.length) return;

    function apply(cat) {
      var state = null;
      if (hasGsap && window.Flip && !reduced)
        state = window.Flip.getState(cases);

      cases.forEach((item) => {
        var show = cat === "all" || item.dataset.cat === cat;
        item.classList.toggle("is-hidden", !show);
      });

      if (state) {
        window.Flip.from(state, {
          duration: 0.45,
          ease: "power2.out",
          absolute: true,
          stagger: 0.015,
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

  /* ------------------------------------------------------- бегущая строка */

  function initTicker() {
    var track = document.querySelector("#stack-track");
    if (!track || !hasGsap || reduced) return;

    var clone = track.cloneNode(true);
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    track.parentNode.appendChild(clone);

    var width = track.offsetWidth;
    if (!width) return;

    window.gsap.set([track, clone], { x: 0 });
    window.gsap.to([track, clone], {
      x: -width,
      duration: width / 42,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: window.gsap.utils.unitize((value) => parseFloat(value) % width),
      },
    });
  }

  /* ----------------------------------------------------- поле точек в hero */

  function initField() {
    var canvas = document.querySelector("#hero-canvas");
    var host = canvas && canvas.parentElement;
    if (!canvas || !host || reduced) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var step = 30;
    var radius = 150;
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

        var size = 1 + near * 2.2;
        if (near > 0.05) {
          ctx.fillStyle =
            "rgba(201, 242, 78, " + (0.18 + near * 0.72).toFixed(3) + ")";
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

    var resizeTimer = null;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    });

    measure();
    window.requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------- полоса и фон */

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
    var layer = document.querySelector(".hero__grid");
    if (layer) {
      window.gsap.to(layer, {
        yPercent: 18,
        opacity: 0.25,
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
    initFilter();
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
