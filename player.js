/*
 * In-page video player: links marked data-yt="<YouTube id>" open in a
 * dialog on this page instead of sending visitors away to YouTube.
 * Without JS (or <dialog> support) the links still work as plain links.
 */
(function () {
  "use strict";
  var dlg = document.querySelector(".player");
  if (!dlg || typeof dlg.showModal !== "function") return;
  var frame = dlg.querySelector(".player-frame");

  function close() {
    frame.innerHTML = ""; // stops playback
    if (dlg.open) dlg.close();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-yt]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    var id = a.getAttribute("data-yt");
    dlg.classList.toggle("is-short", a.getAttribute("data-shape") === "short");
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&playsinline=1&rel=0";
    f.title = a.getAttribute("title") || (a.querySelector("img") || {}).alt || "영상";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.allowFullscreen = true;
    frame.innerHTML = "";
    frame.appendChild(f);
    dlg.showModal();
  });

  dlg.querySelector(".player-close").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); }); // backdrop
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });  // Esc
})();
