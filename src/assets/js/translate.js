// Spanish via Google Translate. Google's script only loads after a visitor
// asks for Spanish; the choice is kept in Google's own "googtrans" cookie, so
// it carries across pages until they switch back to English.
(function () {
  var host = location.hostname;
  function current() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-z-]+)/i);
    return m ? m[1] : "en";
  }
  function setLang(lang) {
    var gone = ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
    var val = lang === "es" ? "/en/es" : "";
    [";path=/", ";path=/;domain=" + host, ";path=/;domain=." + host].forEach(function (scope) {
      document.cookie = "googtrans=" + val + scope + (lang === "es" ? "" : gone);
    });
  }
  var lang = current();

  document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
    btn.textContent = lang === "es" ? "English" : "Español";
    btn.setAttribute("lang", lang === "es" ? "en" : "es");
    btn.setAttribute("aria-label", lang === "es" ? "View this site in English" : "Ver este sitio en español");
    btn.addEventListener("click", function () {
      setLang(lang === "es" ? "en" : "es");
      location.reload();
    });
  });

  if (lang !== "es") return;

  // Hand-written Spanish for menus, taglines, and headings Google gets wrong
  // (it turned "Performing" into "Amaestrado" and "pipes" into bagpipes).
  // Keys are the exact English text; values may include markup.
  var ES = {
    "About": "Biografía", "Listen": "Escuchar", "Performing": "Conciertos", "Teaching": "Docencia",
    "Writing": "Escritos", "Gallery": "Galería", "Calendar": "Agenda", "Contact": "Contacto",
    "Press kit": "Prensa", "Curriculum vitae": "Currículum",
    "Organist · Harpsichordist · Conductor": "Organista · Clavecinista · Director",
    "Hear him play": "Escúchelo tocar", "Book a recital": "Contrate un recital",
    "Now you play the pipes.": "Ahora le toca a usted tocar el <em>órgano.</em>",
    "Director of Music and Liturgy, Holy Family Catholic Church, Glendale": "<strong>Director de Música y Liturgia</strong>, Iglesia Católica de la Sagrada Familia, Glendale",
    "University Organist, California Lutheran University": "<strong>Organista de la Universidad</strong>, California Lutheran University"
  };
  document.querySelectorAll("a, h2, .eyebrow, .brand-tag, .hero-sub .line").forEach(function (el) {
    var key = el.textContent.replace(/\s+/g, " ").trim();
    if (ES[key]) { el.innerHTML = ES[key]; el.classList.add("notranslate"); }
  });

  // Names and titles stay as written: his name, titles of works and
  // publications, composers, and anything already in Spanish.
  ["brand-name", "piece", "composer", "bib-title", "patron-quote", "hero-name"].forEach(function (c) {
    document.querySelectorAll("." + c).forEach(function (el) { el.classList.add("notranslate"); });
  });
  document.querySelectorAll("h1").forEach(function (h) {
    if (/Fern[aá]ndez/.test(h.textContent)) h.classList.add("notranslate");
  });
  document.querySelectorAll(".gt-note").forEach(function (n) { n.hidden = false; });

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "es", autoDisplay: false }, "gt-el");
  };
  var s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(s);
})();
