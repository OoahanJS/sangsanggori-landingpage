/* Thread progress + section nodes + gentle reveals. The page reads fine without it. */
(function () {
  "use strict";
  var main = document.querySelector("main");
  var fill = document.querySelector(".thread span");
  var sections = [].slice.call(document.querySelectorAll("main section"));

  // Mark what should fade up: headings, ledes and list rows inside each section.
  sections.forEach(function (s) {
    [].forEach.call(s.querySelectorAll("h2, .lede, .faces li, .does-list li, .maksabal, .nums > div, .index li, .cv > div, .card, .why li, .promise li"), function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i * 60, 420) + "ms";
    });
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -18% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  } else {
    sections.forEach(function (s) { s.classList.add("on"); });
  }

  if (!main || !fill) return;
  var ticking = false;
  function update() {
    ticking = false;
    var r = main.getBoundingClientRect();
    var p = (window.innerHeight * 0.6 - r.top) / r.height;
    fill.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();
