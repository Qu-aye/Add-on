/**
 * CiteFlow — Citation Formatter
 * Formats citations in all major referencing styles.
 */

function formatCitation(result, style) {
  const authors = formatAuthors(result.authors, style);
  const year = result.year || 'n.d.';
  const title = result.title || 'Untitled';
  const journal = result.journal || '';
  const volume = result.volume || '';
  const issue = result.issue || '';
  const pages = result.pages || '';
  const doi = result.doi || '';
  const publisher = result.publisher || '';

  switch (style) {
    /* ---------- Popular ---------- */
    case 'apa':
      return `${authors} (${year}). ${title}.${journal ? ` *${journal}*` : ''}${volume ? `, *${volume}*` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;

    case 'mla':
      return `${authors}. "${title}."${journal ? ` *${journal}*` : ''}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? `, ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    case 'chicago':
      return `${authors}. ${year}. "${title}."${journal ? ` *${journal}*` : ''}${volume ? ` ${volume}` : ''}${issue ? ` (${issue})` : ''}${pages ? `: ${pages}` : ''}.${doi ? ` https://doi.org/${doi}.` : ''}`;

    case 'harvard':
      return `${authors} (${year}) '${title}',${journal ? ` *${journal}*` : ''}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    case 'vancouver':
      return `${authors}. ${title}.${journal ? ` ${journal}` : ''}${year ? `. ${year}` : ''}${volume ? `;${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}.${doi ? ` DOI: ${doi}.` : ''}`;

    case 'ieee':
      return `${authors}, "${title},"${journal ? ` *${journal}*` : ''}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${pages ? `, pp. ${pages}` : ''}${year ? `, ${year}` : ''}.${doi ? ` doi: ${doi}.` : ''}`;

    /* ---------- Scientific & Medical ---------- */
    case 'ama':
      return `${authors}. ${title}.${journal ? ` ${journal}` : ''}${year ? `. ${year}` : ''}${volume ? `;${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}.${doi ? ` doi:${doi}` : ''}`;

    case 'acs':
      return `${authors} ${title}.${journal ? ` *${journal}*` : ''}${year ? ` **${year}**` : ''}${volume ? `, *${volume}*` : ''}${issue ? `, ${issue}` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` DOI: ${doi}.` : ''}`;

    case 'cse':
      return `${authors}. ${year}. ${title}.${journal ? ` ${journal}` : ''}${volume ? ` ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    case 'nature':
      return `${authors}. ${title}.${journal ? ` *${journal}*` : ''}${volume ? ` **${volume}**` : ''}${pages ? `, ${pages}` : ''}${year ? ` (${year})` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;

    case 'science':
      return `${authors} (${year}). ${title}.${journal ? ` *${journal}*` : ''}${volume ? ` ${volume}` : ''}${issue ? `, ${issue}` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` doi:${doi}` : ''}`;

    case 'cell':
      return `${authors} (${year}). ${title}.${journal ? ` *${journal}*` : ''}${volume ? ` *${volume}*` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;

    /* ---------- Humanities & Social Sciences ---------- */
    case 'chicago-note':
      return `${authors}, "${title},"${journal ? ` *${journal}*` : ''}${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? ` (${year})` : ''}${pages ? `: ${pages}` : ''}.${doi ? ` https://doi.org/${doi}.` : ''}`;

    case 'turabian':
      return `${authors}. ${year}. "${title}."${journal ? ` *${journal}*` : ''}${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${pages ? `: ${pages}` : ''}.${doi ? ` https://doi.org/${doi}.` : ''}`;

    case 'aaa':
      return `${authors} ${year} ${title}.${journal ? ` *${journal}*` : ''}${volume ? ` ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    case 'apa-6':
      return `${authors} (${year}). ${title}.${journal ? ` *${journal}*` : ''}${volume ? `, *${volume}*` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` doi:${doi}` : ''}`;

    case 'mla-8':
      return `${authors}. "${title}."${journal ? ` *${journal}*` : ''}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${year ? `, ${year}` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    case 'asa':
      return `${authors}. ${year}. "${title}."${journal ? ` *${journal}*` : ''}${volume ? ` ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `:${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    /* ---------- Law & Government ---------- */
    case 'bluebook':
      return `${authors}, ${title},${journal ? ` ${journal}` : ''}${volume ? ` ${volume}` : ''}${issue ? `, no. ${issue}` : ''}${pages ? `, ${pages}` : ''}${year ? ` (${year})` : ''}.${doi ? ` https://doi.org/${doi}.` : ''}`;

    case 'oscola':
      return `${authors}, '${title}'${year ? ` (${year})` : ''}${journal ? ` ${journal}` : ''}${volume ? ` ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? ` ${pages}` : ''}.${doi ? ` <https://doi.org/${doi}>` : ''}`;

    case 'aglc':
      return `${authors}, '${title}'${year ? ` (${year})` : ''}${journal ? ` ${journal}` : ''}${volume ? ` ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? ` ${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    case 'mcgill':
      return `${authors}, "${title}"${year ? ` (${year})` : ''}${journal ? ` ${journal}` : ''}${volume ? ` ${volume}` : ''}${issue ? `:${issue}` : ''}${pages ? ` ${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    /* ---------- Engineering & Technology ---------- */
    case 'acm':
      return `${authors}. ${year}. ${title}.${journal ? ` *${journal}*` : ''}${volume ? ` ${volume}` : ''}${issue ? `, ${issue}` : ''}${pages ? ` (${pages})` : ''}.${doi ? ` DOI:https://doi.org/${doi}` : ''}`;

    case 'asce':
      return `${authors} (${year}). "${title}."${journal ? ` *${journal}*` : ''}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `: ${pages}` : ''}.${doi ? ` https://doi.org/${doi}.` : ''}`;

    case 'asme':
      return `${authors}, ${year}, "${title},"${journal ? ` *${journal}*` : ''}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` doi:${doi}.` : ''}`;

    /* ---------- Regional & Discipline-Specific ---------- */
    case 'abnt':
      return `${authors} ${title}.${journal ? ` ${journal}` : ''}${volume ? `, ${volume}` : ''}${issue ? `, n. ${issue}` : ''}${pages ? `, p. ${pages}` : ''}${year ? `, ${year}` : ''}.${doi ? ` DOI: ${doi}.` : ''}`;

    case 'gost':
      return `${authors} ${title}${journal ? ` // ${journal}` : ''}${year ? `. – ${year}` : ''}${volume ? `. – T. ${volume}` : ''}${issue ? `, № ${issue}` : ''}${pages ? `. – C. ${pages}` : ''}.${doi ? ` DOI: ${doi}.` : ''}`;

    case 'iso690':
      return `${authors} (${year}). ${title}.${journal ? ` ${journal}` : ''}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, pp. ${pages}` : ''}.${doi ? ` DOI: ${doi}.` : ''}`;

    case 'bibtex':
      return formatBibTeX(result);

    case 'ris':
      return formatRIS(result);

    default:
      return `${authors} (${year}). ${title}.${journal ? ` ${journal}` : ''}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
  }
}

/* ---------- Author Formatting ---------- */

function formatAuthors(authors, style) {
  if (!authors || !authors.length) return 'Anonymous';
  const count = authors.length;

  // Styles that use numbered references
  const numberedStyles = ['vancouver', 'ieee', 'ama', 'nature'];
  if (numberedStyles.includes(style)) {
    if (count <= 6) return authors.join(', ');
    return authors.slice(0, 6).join(', ') + ', et al.';
  }

  // APA-like
  if (['apa', 'apa-6', 'harvard', 'cse', 'science', 'cell', 'turabian', 'aaa', 'asa', 'iso690'].includes(style)) {
    if (count === 1) return authors[0];
    if (count === 2) return `${authors[0]} & ${authors[1]}`;
    if (count <= 7) return authors.slice(0, -1).join(', ') + ', & ' + authors[count - 1];
    if (count <= 20) return authors.slice(0, 19).join(', ') + ', ... ' + authors[count - 1];
    return authors.slice(0, 19).join(', ') + ', ... ' + authors[count - 1];
  }

  // MLA-like
  if (['mla', 'mla-8'].includes(style)) {
    if (count === 1) return authors[0];
    if (count === 2) return `${authors[0]} and ${authors[1]}`;
    return `${authors[0]}, et al.`;
  }

  // Chicago-like
  if (['chicago', 'chicago-note'].includes(style)) {
    if (count === 1) return authors[0];
    if (count <= 3) return authors.join(', ');
    return authors.slice(0, 3).join(', ') + ', et al.';
  }

  // Default
  if (count <= 3) return authors.join(', ');
  return authors.slice(0, 3).join(', ') + ', et al.';
}

/* ---------- BibTeX ---------- */

function formatBibTeX(result) {
  const key = `${(result.authors[0] || 'anon').split(' ').pop().toLowerCase()}${result.year || 'nd'}`;
  const type = result.journal ? 'article' : 'misc';
  let bib = `@${type}{${key},\n`;
  bib += `  title = {${result.title}},\n`;
  bib += `  author = {${(result.authors || ['Anonymous']).join(' and ')}},\n`;
  if (result.year) bib += `  year = {${result.year}},\n`;
  if (result.journal) bib += `  journal = {${result.journal}},\n`;
  if (result.volume) bib += `  volume = {${result.volume}},\n`;
  if (result.issue) bib += `  number = {${result.issue}},\n`;
  if (result.pages) bib += `  pages = {${result.pages}},\n`;
  if (result.doi) bib += `  doi = {${result.doi}},\n`;
  if (result.publisher) bib += `  publisher = {${result.publisher}},\n`;
  bib += '}';
  return bib;
}

/* ---------- RIS ---------- */

function formatRIS(result) {
  const type = result.journal ? 'JOUR' : 'GEN';
  let ris = `TY  - ${type}\n`;
  ris += `TI  - ${result.title}\n`;
  (result.authors || ['Anonymous']).forEach(a => { ris += `AU  - ${a}\n`; });
  if (result.year) ris += `PY  - ${result.year}\n`;
  if (result.journal) ris += `JF  - ${result.journal}\n`;
  if (result.volume) ris += `VL  - ${result.volume}\n`;
  if (result.issue) ris += `IS  - ${result.issue}\n`;
  if (result.pages) ris += `SP  - ${result.pages}\n`;
  if (result.doi) ris += `DO  - ${result.doi}\n`;
  if (result.publisher) ris += `PB  - ${result.publisher}\n`;
  ris += 'ER  - ';
  return ris;
}

/* ---------- Inline citation ---------- */

function formatInlineCitation(result, style) {
  const authors = result.authors || ['Anonymous'];
  const year = result.year || 'n.d.';
  const lastNames = authors.map(a => a.split(' ').pop());

  switch (style) {
    case 'apa': case 'apa-6': case 'harvard': case 'cse': case 'science':
    case 'cell': case 'turabian': case 'aaa': case 'asa': case 'iso690':
    case 'chicago': case 'chicago-note':
      if (lastNames.length === 1) return `(${lastNames[0]}, ${year})`;
      if (lastNames.length === 2) return `(${lastNames[0]} & ${lastNames[1]}, ${year})`;
      return `(${lastNames[0]} et al., ${year})`;

    case 'mla': case 'mla-8':
      if (lastNames.length === 1) return `(${lastNames[0]} ${year})`;
      if (lastNames.length === 2) return `(${lastNames[0]} and ${lastNames[1]} ${year})`;
      return `(${lastNames[0]} et al. ${year})`;

    case 'vancouver': case 'ieee': case 'ama': case 'nature':
      return `[#]`; // Placeholder — numbered in order

    case 'acs':
      return `(${lastNames[0]} et al., ${year})`;

    case 'bluebook': case 'oscola': case 'aglc': case 'mcgill':
      return `(${lastNames[0]}, ${year})`;

    case 'acm': case 'asce': case 'asme':
      return `[${lastNames[0]} ${year}]`;

    case 'abnt': case 'gost':
      return `(${lastNames[0]}, ${year})`;

    default:
      return `(${lastNames[0]}, ${year})`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatCitation, formatInlineCitation, formatAuthors };
}