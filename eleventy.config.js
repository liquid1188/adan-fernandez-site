const fs = require("fs");
const path = require("path");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

// GitHub Pages serves this repo at /adan-fernandez-site/, not at the root, so
// every absolute path in the templates would 404. The templates stay written
// as if the site lived at the root and this plugin rewrites the output.
// When a custom domain is added: set this to "/" and update url in site.json.
const PATH_PREFIX = "/adan-fernandez-site/";

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // The editor is copied verbatim and never run through Nunjucks, or its
  // {{ }} template syntax would be eaten at build time.
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.ignores.add("src/admin/**");

  const opts = { timeZone: "America/Los_Angeles" };
  const d = (iso) => new Date(String(iso).slice(0, 10) + "T12:00:00Z");

  eleventyConfig.addFilter("longDate", (iso) =>
    d(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", ...opts }));
  eleventyConfig.addFilter("fullDate", (iso) =>
    d(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", ...opts }));
  eleventyConfig.addFilter("mon", (iso) =>
    d(iso).toLocaleDateString("en-US", { month: "short", ...opts }));
  eleventyConfig.addFilter("day", (iso) =>
    d(iso).toLocaleDateString("en-US", { day: "2-digit", ...opts }));
  eleventyConfig.addFilter("year", (iso) => String(iso).slice(0, 4));
  eleventyConfig.addFilter("isoDate", (x) => new Date(x).toISOString());

  // Today at midnight Pacific, so a recital stays listed as Upcoming through
  // the day it happens rather than disappearing at midnight UTC the night before.
  const today = () => {
    const now = new Date();
    const la = new Date(now.toLocaleString("en-US", opts));
    la.setHours(0, 0, 0, 0);
    return la;
  };

  eleventyConfig.addFilter("upcoming", (items) =>
    (items || []).filter((e) => d(e.date) >= today()).sort((a, b) => a.date.localeCompare(b.date)));
  eleventyConfig.addFilter("past", (items) =>
    (items || []).filter((e) => d(e.date) < today()).sort((a, b) => b.date.localeCompare(a.date)));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  eleventyConfig.addFilter("where", (arr, key, val) =>
    (arr || []).filter((x) => x[key] === val));

  // Group the video list by its `group` key, keeping the order the groups
  // first appear in the data file so the page order is editable there.
  eleventyConfig.addFilter("groupBy", (arr, key) => {
    const out = [];
    for (const item of arr || []) {
      let g = out.find((x) => x.name === item[key]);
      if (!g) { g = { name: item[key], items: [] }; out.push(g); }
      g.items.push(item);
    }
    return out;
  });

  // Read image dimensions from the file header at build time so every <img>
  // can carry width/height and the page stops reflowing as photos arrive.
  const dimCache = {};
  eleventyConfig.addFilter("dims", (rel) => {
    if (rel in dimCache) return dimCache[rel];
    let out = null;
    try {
      const buf = fs.readFileSync(path.join(__dirname, "src", rel.replace(/^\//, "")));
      if (buf[0] === 0x89 && buf[1] === 0x50) {
        out = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
      } else if (buf[0] === 0xff && buf[1] === 0xd8) {
        let i = 2;
        while (i < buf.length) {
          if (buf[i] !== 0xff) { i++; continue; }
          const m = buf[i + 1];
          if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
            out = { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
            break;
          }
          i += 2 + buf.readUInt16BE(i + 2);
        }
      }
    } catch (e) { out = null; }
    dimCache[rel] = out;
    return out;
  });

  return {
    pathPrefix: PATH_PREFIX,
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
