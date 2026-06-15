/* =========================================================
   Page interactions: staggered reveal on load, and wiring the
   hero Mandelbrot figure (HUD readout + zoom controls).
   ========================================================= */
(function () {
  "use strict";

  /* ---- reveal: hero on load, sections on scroll ---- */
  const reveals = () => document.querySelectorAll(".reveal:not(.in)");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
    window.addEventListener("DOMContentLoaded", () => reveals().forEach((el) => io.observe(el)));
  } else {
    window.addEventListener("DOMContentLoaded", () => reveals().forEach((el) => el.classList.add("in")));
  }

  /* ---- hero Mandelbrot figure ---- */
  const el = document.getElementById("calc");
  if (!el || !window.MandelbrotGraph) return;

  const hud = {
    re: document.getElementById("hud-re"),
    im: document.getElementById("hud-im"),
    zoom: document.getElementById("hud-zoom"),
  };
  const fmt = (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(4);
  const setHud = (re, im) => {
    if (hud.re) hud.re.textContent = fmt(re);
    if (hud.im) hud.im.textContent = fmt(im);
  };

  const graph = window.MandelbrotGraph.mount({
    el,
    onHover: setHud,
    onView: (cx, cy, zoom) => {
      setHud(cx, cy);
      if (hud.zoom) hud.zoom.textContent = (zoom >= 100 ? zoom.toFixed(0) : zoom.toFixed(1)) + "×";
    },
  });
  if (!graph) return;

  document.getElementById("zoom-in") ?.addEventListener("click", () => graph.zoomIn());
  document.getElementById("zoom-out")?.addEventListener("click", () => graph.zoomOut());
  document.getElementById("zoom-rst")?.addEventListener("click", () => graph.reset());
})();
