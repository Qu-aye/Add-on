# CiteFlow — Citation Search & Bibliography Add-in for Microsoft Word

A vibrant, easy-to-use Word Add-in that lets you search academic databases, insert formatted citations, and auto-generate bibliographies — all from within your document.

## Features

- 🔍 **Auto-detect selected text** — Highlight text in your document and it appears in the search box automatically
- 📚 **Multi-database search** — CrossRef, OpenAlex, Semantic Scholar, PubMed, DataCite, CORE
- ✍️ **30+ citation styles** — APA, MLA, Chicago, Harvard, Vancouver, IEEE, AMA, ACS, Bluebook, OSCOLA, BibTeX, RIS, and more
- 📝 **One-click insert** — Insert inline citations directly into your Word document
- 📋 **Auto bibliography** — Builds a bibliography as you cite; insert it at the end of your document with one click
- 🎨 **Vibrant, clean UI** — Modern design with smooth animations

## Prerequisites

- **Node.js** 18+
- **Microsoft Word** (desktop) with Office Add-in support
- A **localhost HTTPS** development environment (the add-in dev certs handle this)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate dev certificates (first time only)
npx office-addin-dev-certs install

# 3. Build the add-in
npm run build

# 4. Start the dev server + sideload into Word
npm start
```

This will:
- Build the webpack bundle to `dist/`
- Start a local HTTPS server on port 3000
- Sideload the add-in into Word

## Project Structure

```
CiteFlow/
├── manifest.xml           # Office Add-in manifest
├── package.json           # Dependencies & scripts
├── webpack.config.js      # Build configuration
├── src/
│   ├── taskpane.html      # Task pane UI
│   ├── taskpane.js        # Main app logic (Word API integration)
│   ├── search-service.js  # Multi-database search (free APIs)
│   ├── formatter.js       # Citation formatting (30+ styles)
│   ├── styles.css         # Vibrant, clean styles
│   └── commands.html      # Function file stub
├── assets/                # Icons (16, 32, 80 px)
└── dist/                  # Build output
```

## Citation Styles Supported

| Category | Styles |
|----------|--------|
| **Popular** | APA 7th, MLA 9th, Chicago (Author-Date), Harvard, Vancouver, IEEE |
| **Scientific & Medical** | AMA, ACS, CSE, Nature, Science, Cell Press |
| **Humanities & Social Sciences** | Chicago (Notes & Bib), Turabian, AAA, APA 6th, MLA 8th, ASA |
| **Law & Government** | Bluebook, OSCOLA, AGLC, McGill Guide |
| **Engineering & Technology** | ACM, ASCE, ASME |
| **Regional & Special** | ABNT (Brazilian), GOST (Russian), ISO 690, BibTeX, RIS |

## Free APIs Used

| Database | API | Rate Limits |
|----------|-----|-------------|
| CrossRef | `api.crossref.org` | Polite pool (~50/s) |
| OpenAlex | `api.openalex.org` | 100k/day free |
| Semantic Scholar | `api.semanticscholar.org` | 100/s free |
| PubMed | `eutils.ncbi.nlm.nih.gov` | 3/s (no key) |
| DataCite | `api.datacite.org` | Open access |
| CORE | `api.core.ac.uk` | Requires API key |

## Development

```bash
npm run dev     # Build in watch mode
npm run build   # Production build
npm run validate # Validate manifest
```

## License

MIT
