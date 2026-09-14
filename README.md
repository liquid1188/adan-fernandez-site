# Adán Alejándro Fernández — official website

Artist site for Dr. Adán Alejándro Fernández: organist, harpsichordist,
conductor, composer, and writer.

Built with [Eleventy](https://www.11ty.dev/). Content lives in JSON, the
templates only arrange it, and Adán can edit the content himself without
touching either.

## Pages

| Page | Path | Source |
| --- | --- | --- |
| Home | `/` | `src/index.njk` |
| About | `/about/` | `src/about.njk` |
| Listen & watch | `/listen/` | `src/listen.njk` |
| Performing | `/performing/` | `src/performing.njk` |
| Teaching | `/teaching/` | `src/teaching.njk` |
| Writing & scholarship | `/writing/` | `src/writing.njk` |
| Calendar | `/upcoming/` | `src/upcoming.njk` |
| Press kit | `/press-kit/` | `src/press-kit.njk` |
| Contact | `/contact/` | `src/contact.njk` |

## Content

Everything editable is in `src/_data/`:

- `site.json` — name, contact details, management, links
- `bio.json` — biography at three lengths (one line, short, full)
- `positions.json` — the posts he holds
- `education.json` — degrees, fellowships and awards
- `performances.json` — dated performances, plus undated earlier highlights
- `videos.json` — YouTube IDs, grouped by instrument
- `writing.json` — publications and publishers
- `teaching.json` — what he teaches and what he offers on the road

### The calendar sorts itself

`performances.json` holds one flat list. A date in the future appears under
Upcoming; the day after it happens it moves to Past on its own, and the
deploy workflow re-runs every Monday morning so that happens without anyone
pushing a commit. Nobody has to maintain two lists.

## The editor

`/admin/` runs [Sveltia CMS](https://github.com/sveltia/sveltia-cms), a
form-based editor over the same JSON files. Adán signs in with GitHub, fills
in fields, and saves; the save is a commit, which triggers a rebuild. He
never sees code and cannot break the layout.

To give him access, add his GitHub account as a collaborator on this repo.

## Photography

`src/assets/img/` currently holds two press photographs from Seven Eight
Artists. The credit line is in `site.json` and appears in the footer and on
the press kit. More photographs can be dropped into the same folder.

## Local development

```
npm install
npm run serve      # http://localhost:8080
npm run build      # writes _site/
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with
Eleventy and publishes `_site` to GitHub Pages. The repository's Pages source
must be set to **GitHub Actions**, not a branch.

No custom domain yet. When there is one, add a `CNAME` file to `src/assets/`
(or a passthrough of your own) and update `url` in `src/_data/site.json` so
canonical URLs, the sitemap and the Open Graph tags all point at it.
