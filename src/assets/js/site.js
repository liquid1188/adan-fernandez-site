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

  // YouTube embeds are heavy and there can be thirty of them. Each one starts
  // as its own poster image and only becomes an iframe when someone asks for it.
  document.querySelectorAll("[data-yt]").forEach(function (box) {
    box.addEventListener("click", function () {
      if (box.dataset.loaded) return;
      box.dataset.loaded = "1";
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + box.dataset.yt + "?rel=0&autoplay=1";
      f.title = box.getAttribute("aria-label") || "Video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      box.innerHTML = "";
      box.appendChild(f);
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); box.click(); }
    });
  });
})();
