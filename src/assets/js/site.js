(function () {
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  // The header sits over a dark hero on the home page and over paper
  // everywhere else, so it needs a background from the first pixel on
  // interior pages but not on the home page until you scroll.
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      nav.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName !== "A") return;
      links.classList.remove("open");
      nav.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !links.classList.contains("open")) return;
      toggle.click();
      toggle.focus();
    });
  }

  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // YouTube embeds are heavy and there can be thirty of them. Each one stays a
  // poster image; clicking opens the video in a large player over the page,
  // where YouTube's full control bar (with the volume slider) fits. In a
  // 300px tile the player hides most of its controls.
  var modal = document.createElement("div");
  modal.className = "vmodal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = '<div class="vmodal-box"><button class="vmodal-close" type="button" aria-label="Close">&times;</button><div class="vmodal-frame"></div><p class="vmodal-cap"></p></div>';
  document.body.appendChild(modal);
  var frameHost = modal.querySelector(".vmodal-frame");
  var cap = modal.querySelector(".vmodal-cap");
  var lastFocus = null;
  function closeModal() {
    modal.classList.remove("open");
    frameHost.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  function openModal(id, label) {
    lastFocus = document.activeElement;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&autoplay=1";
    f.title = label || "Video";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    frameHost.innerHTML = "";
    frameHost.appendChild(f);
    cap.textContent = label ? label.replace(/^Play /, "") : "";
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".vmodal-close").focus();
  }
  modal.addEventListener("click", function (e) {
    if (e.target === modal || e.target.classList.contains("vmodal-close")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });
  document.querySelectorAll("[data-yt]").forEach(function (box) {
    box.addEventListener("click", function () {
      openModal(box.dataset.yt, box.getAttribute("aria-label"));
    });
  });
})();

// "View desktop version" on phones: widens the viewport to 1280px and
// remembers the choice; the same button then switches back.
(function () {
  var btn = document.getElementById("viewToggle");
  if (!btn) return;
  var on = document.documentElement.classList.contains("view-desktop");
  btn.textContent = on ? "View mobile version" : "View desktop version";
  btn.addEventListener("click", function () {
    try { on ? localStorage.removeItem("viewDesktop") : localStorage.setItem("viewDesktop", "1"); } catch (e) {}
    location.reload();
  });
})();
