/**
 * CiteFlow — Citation Search Service
 * Queries free academic APIs: CrossRef, OpenAlex, Semantic Scholar, PubMed, DataCite, CORE
 */

const API_CONFIG = {
  crossref: {
    url: 'https://api.crossref.org/works',
    params: (q) => ({ query: q, rows: 10 }),
    map: mapCrossRef,
  },
  openalex: {
    url: 'https://api.openalex.org/works',
    params: (q) => ({ search: q, per_page: 10 }),
    map: mapOpenAlex,
  },
  semantic: {
    url: 'https://api.semanticscholar.org/graph/v1/paper/search',
    params: (q) => ({ query: q, limit: 10, fields: 'title,authors,year,externalIds,publicationVenue,abstract' }),
    map: mapSemantic,
  },
  pubmed: {
    url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
    params: (q) => ({ db: 'pubmed', term: q, retmax: 10, retmode: 'json' }),
    map: mapPubMed,
    twoStep: true,
  },
  datacite: {
    url: 'https://api.datacite.org/dois',
    params: (q) => ({ query: q, 'page[size]': 10 }),
    map: mapDataCite,
  },
  core: {
    url: 'https://api.core.ac.uk/v3/search/works',
    params: (q) => ({ q, limit: 10 }),
    map: mapCore,
    headers: { 'Authorization': 'Bearer ' + (typeof CORE_API_KEY !== 'undefined' ? CORE_API_KEY : '') },
  },
};

/* ---------- Mappers: normalize to CiteFlowResult ---------- */

function mapCrossRef(item) {
  const authors = (item.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean);
  return {
    id: item.DOI || `cr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: (item.title || ['Untitled'])[0],
    authors: authors.length ? authors : ['Unknown'],
    year: item['published-print']?.['date-parts']?.[0]?.[0]
      || item['created']?.['date-parts']?.[0]?.[0]
      || item['issued']?.['date-parts']?.[0]?.[0]
      || null,
    journal: item['container-title']?.[0] || null,
    volume: item.volume || null,
    issue: item.issue || null,
    pages: item.page || null,
    doi: item.DOI || null,
    publisher: item.publisher || null,
    source: 'crossref',
    raw: item,
  };
}

function mapOpenAlex(item) {
  const authors = (item.authorships || []).map(a => a.author?.display_name || '').filter(Boolean);
  return {
    id: item.doi || item.id || `oa-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: item.title || 'Untitled',
    authors: authors.length ? authors : ['Unknown'],
    year: item.publication_year || null,
    journal: item.primary_location?.source?.display_name || null,
    volume: item.biblio?.volume || null,
    issue: item.biblio?.issue || null,
    pages: `${item.biblio?.first_page || ''}${item.biblio?.last_page ? '-' + item.biblio.last_page : ''}` || null,
    doi: item.doi?.replace('https://doi.org/', '') || null,
    publisher: null,
    source: 'openalex',
    raw: item,
  };
}

function mapSemantic(item) {
  const authors = (item.authors || []).map(a => a.name || '').filter(Boolean);
  return {
    id: item.externalIds?.DOI || item.paperId || `ss-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: item.title || 'Untitled',
    authors: authors.length ? authors : ['Unknown'],
    year: item.year || null,
    journal: item.publicationVenue?.name || null,
    volume: null,
    issue: null,
    pages: null,
    doi: item.externalIds?.DOI || null,
    publisher: null,
    source: 'semantic',
    raw: item,
  };
}

async function mapPubMed(raw) {
  const idList = raw?.esearchresult?.idlist || [];
  if (!idList.length) return [];
  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
  const resp = await fetch(summaryUrl);
  const data = await resp.json();
  const results = data?.result || {};
  return idList.map(id => {
    const r = results[id] || {};
    const authors = (r.authors || []).map(a => a.name || '').filter(Boolean);
    return {
      id: `pmid:${id}`,
      title: r.title || 'Untitled',
      authors: authors.length ? authors : ['Unknown'],
      year: r.pubdate ? parseInt(r.pubdate.match(/\d{4}/)?.[0]) || null : null,
      journal: r.source || r.fulljournalname || null,
      volume: r.volume || null,
      issue: r.issue || null,
      pages: r.pages || null,
      doi: r.elocationid?.replace('doi: ', '') || null,
      publisher: null,
      source: 'pubmed',
      raw: r,
    };
  });
}

function mapDataCite(item) {
  const attrs = item.attributes || {};
  const authors = (attrs.creators || []).map(c => c.name || '').filter(Boolean);
  return {
    id: item.id || `dc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: attrs.titles?.[0]?.title || 'Untitled',
    authors: authors.length ? authors : ['Unknown'],
    year: attrs.publicationYear || null,
    journal: attrs.publisher || null,
    volume: null,
    issue: null,
    pages: null,
    doi: item.id?.replace('https://doi.org/', '') || null,
    publisher: attrs.publisher || null,
    source: 'datacite',
    raw: item,
  };
}

function mapCore(item) {
  const authors = (item.authors || []).map(a => a.name || '').filter(Boolean);
  return {
    id: item.doi || item.id || `core-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: item.title || 'Untitled',
    authors: authors.length ? authors : ['Unknown'],
    year: item.yearPublished || null,
    journal: item.publisher || null,
    volume: null,
    issue: null,
    pages: null,
    doi: item.doi || null,
    publisher: item.publisher || null,
    source: 'core',
    raw: item,
  };
}

/* ---------- Fetch ---------- */

async function fetchFromSource(source, query) {
  const cfg = API_CONFIG[source];
  if (!cfg) return [];
  try {
    const params = cfg.params(query);
    const qs = new URLSearchParams(params).toString();
    const url = `${cfg.url}?${qs}`;
    const opts = { headers: { 'User-Agent': 'CiteFlow/1.0 (mailto:citeflow@example.com)' } };
    if (cfg.headers) Object.assign(opts.headers, cfg.headers);
    const resp = await fetch(url, opts);
    if (!resp.ok) return [];
    const data = await resp.json();
    if (cfg.twoStep) return await cfg.map(data);
    const items = extractItems(source, data);
    return items.map(cfg.map).filter(r => r.title !== 'Untitled' || r.doi);
  } catch (e) {
    console.warn(`CiteFlow: ${source} fetch failed`, e);
    return [];
  }
}

function extractItems(source, data) {
  switch (source) {
    case 'crossref': return data?.message?.items || [];
    case 'openalex': return data?.results || [];
    case 'semantic': return data?.data || [];
    case 'datacite': return data?.data || [];
    case 'core': return data?.results || [];
    default: return [];
  }
}

/* ---------- Public API ---------- */

async function searchCitations(query, sources = ['crossref', 'openalex', 'semantic']) {
  const promises = sources.map(src => fetchFromSource(src, query));
  const results = await Promise.allSettled(promises);
  const all = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      r.value.forEach(item => { item._sourceDb = sources[i]; });
      all.push(...r.value);
    }
  });
  // Deduplicate by DOI
  const seen = new Set();
  return all.filter(r => {
    const key = r.doi || r.title?.toLowerCase()?.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

// Export for use in taskpane.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchCitations, API_CONFIG };
}