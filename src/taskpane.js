/**
 * CiteFlow — Main Task Pane Application
 * Microsoft Word Add-in for citation search & bibliography management
 */

require("./search-service.js");
require("./formatter.js");
require("./ai-service.js");
/* globals Office, Word */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById('app').classList.add('word-ready');
    initApp();
  }
});

/* ---------- State ---------- */

const state = {
  selectedText: '',
  results: [],
  bibliography: [],
  activeDb: 'crossref',
  activeStyle: 'apa',
  bibCounter: 0,
};

/* ---------- DOM refs ---------- */

const $ = (sel) => document.getElementById(sel);
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const searchHint = $('searchHint');
const resultsList = $('resultsList');
const resultsTitle = $('resultsTitle');
const resultsCount = $('resultsCount');
const emptyState = $('emptyState');
const loadingSpinner = $('loadingSpinner');
const styleSelect = $('styleSelect');
const bibList = $('bibList');
const insertBibBtn = $('insertBibBtn');
const toast = $('toast');

// AI feature wiring
const paraphraseBtn = document.getElementById('paraphraseBtn');
const paraphraseMode = document.getElementById('paraphraseMode');
const paraphraseInput = document.getElementById('paraphraseInput');
const paraphraseResult = document.getElementById('paraphraseResult');
const checkGrammarBtn = document.getElementById('grammarCheckBtn');
const fixGrammarBtn = document.getElementById('grammarFixBtn');
const grammarInput = document.getElementById('grammarInput');
const grammarResult = document.getElementById('grammarResult');
const summarizeBtn = document.getElementById('summarizeBtn');
const summarizeInput = document.getElementById('summarizeInput');
const summarizeResult = document.getElementById('summarizeResult');
const autocompleteBtn = document.getElementById('autocompleteBtn');
const autocompleteInput = document.getElementById('autocompleteInput');
const autocompleteResult = document.getElementById('autocompleteResult');
const parseCitationBtn = document.getElementById('parseBtn');
const citationInput = document.getElementById('parseInput');
const citationStyle = document.getElementById('parseStyle');
const citationResult = document.getElementById('parseResult');

// Slider value displays
const synonymLevel = document.getElementById('synonymLevel');
const synonymLevelVal = document.getElementById('synonymLevelVal');
const summaryLength = document.getElementById('summaryLength');
const summaryLengthVal = document.getElementById('summaryLengthVal');

synonymLevel.addEventListener('input', () => {
  synonymLevelVal.textContent = synonymLevel.value;
});

summaryLength.addEventListener('input', () => {
  summaryLengthVal.textContent = summaryLength.value;
});

/* ---------- Init ---------- */

async function initApp() {
  // Detect selected text on load
  await detectSelection();

  // Event listeners
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSearch(); });
  searchInput.addEventListener('input', () => {
    if (!searchInput.value.trim()) {
      searchHint.textContent = '';
    }
  });
  styleSelect.addEventListener('change', () => {
    state.activeStyle = styleSelect.value;
    reRenderBibliography();
  });

  // Database chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeDb = chip.dataset.db;
      if (searchInput.value.trim()) handleSearch();
    });
  });

  // Insert bibliography button
  insertBibBtn.addEventListener('click', insertBibliographyAtEnd);

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab + '-tab');
      if (target) target.classList.add('active');
    });
  });

  // Listen for selection changes in Word
  await Word.run(async (context) => {
    const doc = context.document;
    doc.onSelectionChanged.add(detectSelection);
    await context.sync();
  }).catch(() => {});

  // Periodic selection check (fallback)
  setInterval(detectSelection, 2000);
}

/* ---------- Selection Detection ---------- */

async function detectSelection() {
  try {
    await Word.run(async (context) => {
      const range = context.document.getSelection();
      range.load('text');
      await context.sync();
      const text = range.text.trim();
      if (text && text !== state.selectedText) {
        state.selectedText = text;
        searchInput.value = text;
        searchHint.textContent = `📄 Detected: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`;
        searchHint.style.color = 'var(--cf-accent-dark)';
      }
    });
  } catch (e) {
    console.warn('detectSelection: Office.js may not be ready', e);
  }
}

/* ---------- Search ---------- */

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showToast('Please enter a search term or select text in your document.', 'error');
    return;
  }

  // Show loading
  resultsList.innerHTML = '';
  emptyState.style.display = 'none';
  loadingSpinner.style.display = 'flex';
  resultsTitle.textContent = 'Searching...';
  resultsCount.textContent = '';
  searchBtn.disabled = true;

  try {
    const sources = [state.activeDb];
    const results = await searchCitations(query, sources);
    state.results = results;
    renderResults(results);
  } catch (e) {
    console.error('Search error:', e);
    showToast('Search failed. Please try again.', 'error');
    loadingSpinner.style.display = 'none';
    emptyState.style.display = 'flex';
    resultsTitle.textContent = 'Results';
  } finally {
    searchBtn.disabled = false;
  }
}

/* ---------- Render Results ---------- */

function renderResults(results) {
  loadingSpinner.style.display = 'none';

  if (!results.length) {
    emptyState.style.display = 'flex';
    resultsTitle.textContent = 'Results';
    resultsCount.textContent = '';
    resultsList.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  resultsTitle.textContent = 'Results';
  resultsCount.textContent = `(${results.length} found)`;

  resultsList.innerHTML = results.map((r, i) => {
    const authors = (r.authors || ['Unknown']).slice(0, 3).join(', ') + (r.authors?.length > 3 ? ' et al.' : '');
    const sourceClass = `source-${r.source || r._sourceDb || 'crossref'}`;
    const sourceLabel = (r.source || r._sourceDb || 'crossref').toUpperCase();

    return `
      <div class="result-card" data-index="${i}">
        <span class="result-source ${sourceClass}">${sourceLabel}</span>
        <div class="result-title">${escapeHtml(r.title)}</div>
        <div class="result-authors">${escapeHtml(authors)}</div>
        <div class="result-meta">
          ${r.year ? `<span>📅 ${r.year}</span>` : ''}
          ${r.journal ? `<span>📰 ${escapeHtml(r.journal)}</span>` : ''}
          ${r.doi ? `<span>🔗 ${escapeHtml(r.doi)}</span>` : ''}
        </div>
        <div class="result-actions">
          <button class="btn-insert-cite" onclick="insertCitation(${i})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Insert Citation
          </button>
          <button class="btn-copy-cite" onclick="copyFormatted(${i})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
        </div>
      </div>`;
  }).join('');
}

/* ---------- Insert Citation ---------- */

async function insertCitation(index) {
  const result = state.results[index];
  if (!result) return;

  const style = state.activeStyle;
  const inlineCite = formatInlineCitation(result, style);

  // Add to bibliography
  state.bibCounter++;
  const bibEntry = { ...result, _bibNum: state.bibCounter, _style: style };
  state.bibliography.push(bibEntry);
  renderBibliography();

  // Insert inline citation into Word document
  try {
    await Word.run(async (context) => {
      const range = context.document.getSelection();
      // If nothing selected, insert at cursor
      range.insertText(inlineCite, Word.InsertLocation.replace);
      await context.sync();
    });
    showToast(`Citation inserted! (${inlineCite})`, 'success');
  } catch (e) {
    console.error('Insert error:', e);
    showToast('Could not insert into document. Make sure Word is active.', 'error');
  }
}

/* ---------- Copy Formatted ---------- */

function copyFormatted(index) {
  const result = state.results[index];
  if (!result) return;
  const formatted = formatCitation(result, state.activeStyle);
  navigator.clipboard.writeText(formatted).then(() => {
    showToast('Citation copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy.', 'error');
  });
}

/* ---------- Bibliography ---------- */

function renderBibliography() {
  if (!state.bibliography.length) {
    bibList.innerHTML = '<div class="empty-state small"><p>No references added yet. Search and insert citations to build your bibliography.</p></div>';
    insertBibBtn.disabled = true;
    return;
  }

  insertBibBtn.disabled = false;

  bibList.innerHTML = state.bibliography.map((entry, i) => {
    const formatted = formatCitation(entry, entry._style || state.activeStyle);
    return `
      <div class="bib-item">
        <span class="bib-number">[${entry._bibNum}]</span>
        <span class="bib-text">${escapeHtml(formatted)}</span>
        <button class="btn-remove-bib" onclick="removeBibEntry(${i})" title="Remove">✕</button>
      </div>`;
  }).join('');
}

function reRenderBibliography() {
  state.bibliography.forEach(entry => {
    entry._style = state.activeStyle;
  });
  renderBibliography();
}

function removeBibEntry(index) {
  state.bibliography.splice(index, 1);
  renderBibliography();
  showToast('Reference removed from bibliography.', 'success');
}

/* ---------- Insert Bibliography at End of Document ---------- */

async function insertBibliographyAtEnd() {
  if (!state.bibliography.length) {
    showToast('Add references first!', 'error');
    return;
  }

  try {
    await Word.run(async (context) => {
      const doc = context.document;
      const body = doc.body;

      // Go to end of document
      const endRange = body.getRange(Word.RangeLocation.end);
      endRange.select();

      // Insert bibliography heading
      const headingRange = endRange.insertParagraph('', Word.InsertLocation.after);
      headingRange.insertText('References', Word.InsertLocation.replace);
      headingRange.font.bold = true;
      headingRange.font.size = 14;
      headingRange.font.color = 'auto';

      // Insert each reference
      for (const entry of state.bibliography) {
        const formatted = formatCitation(entry, entry._style || state.activeStyle);
        const refRange = body.getRange(Word.RangeLocation.end);
        refRange.insertParagraph(`[${entry._bibNum}] ${formatted}`, Word.InsertLocation.after);
        refRange.font.size = 11;
        await context.sync();
      }
    });
    showToast('Bibliography inserted at end of document!', 'success');
  } catch (e) {
    console.error('Bibliography insert error:', e);
    showToast('Failed to insert bibliography.', 'error');
  }
}

/* ---------- Toast ---------- */

let toastTimer;

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/* ---------- Helpers ---------- */


function showAiResult(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove("error", "success");
  el.classList.add(isError ? "error" : "success");
  el.classList.add("show");
}
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Expose functions to inline onclick handlers
window.insertCitation = insertCitation;
window.copyFormatted = copyFormatted;
window.removeBibEntry = removeBibEntry;

// AI feature wiring
if (paraphraseBtn && paraphraseInput && paraphraseResult) {
  paraphraseBtn.addEventListener('click', async () => {
    const text = paraphraseInput.value.trim();
    if (!text) return;
    paraphraseBtn.disabled = true;
    paraphraseBtn.textContent = 'Processing...';
    try {
      const result = await paraphraseText(text, paraphraseMode ? paraphraseMode.value : 'standard');
      showAiResult(paraphraseResult, result);
    } catch (err) {
      showAiResult(paraphraseResult, 'Error: ' + err.message, true);
    } finally {
      paraphraseBtn.disabled = false;
      paraphraseBtn.textContent = 'Paraphrase';
    }
  });
}

if (checkGrammarBtn && grammarInput && grammarResult) {
  checkGrammarBtn.addEventListener('click', async () => {
    const text = grammarInput.value.trim();
    if (!text) return;
    checkGrammarBtn.disabled = true;
    checkGrammarBtn.textContent = 'Checking...';
    try {
      const result = await checkGrammar(text);
      showAiResult(grammarResult, result);
    } catch (err) {
      showAiResult(grammarResult, 'Error: ' + err.message, true);
    } finally {
      checkGrammarBtn.disabled = false;
      checkGrammarBtn.textContent = 'Check Grammar';
    }
  });
}

if (fixGrammarBtn && grammarInput && grammarResult) {
  fixGrammarBtn.addEventListener('click', async () => {
    const text = grammarInput.value.trim();
    if (!text) return;
    fixGrammarBtn.disabled = true;
    fixGrammarBtn.textContent = 'Fixing...';
    try {
      const result = await fixGrammarErrors(text);
      showAiResult(grammarResult, result);
    } catch (err) {
      showAiResult(grammarResult, 'Error: ' + err.message, true);
    } finally {
      fixGrammarBtn.disabled = false;
      fixGrammarBtn.textContent = 'Fix Grammar';
    }
  });
}

if (summarizeBtn && summarizeInput && summarizeResult) {
  summarizeBtn.addEventListener('click', async () => {
    const text = summarizeInput.value.trim();
    if (!text) return;
    summarizeBtn.disabled = true;
    summarizeBtn.textContent = 'Summarizing...';
    try {
      const length = document.getElementById('summaryLength').value;
      const format = document.getElementById('summaryFormat').value;
      const result = await summarizeText(text, length, format);
      showAiResult(summarizeResult, result);
    } catch (err) {
      showAiResult(summarizeResult, 'Error: ' + err.message, true);
    } finally {
      summarizeBtn.disabled = false;
      summarizeBtn.textContent = 'Summarize';
    }
  });
}

if (autocompleteBtn && autocompleteInput && autocompleteResult) {
  autocompleteBtn.addEventListener('click', async () => {
    const text = autocompleteInput.value.trim();
    if (!text) return;
    autocompleteBtn.disabled = true;
    autocompleteBtn.textContent = 'Generating...';
    try {
      const result = await autocompleteText(text);
      showAiResult(autocompleteResult, result);
    } catch (err) {
      showAiResult(autocompleteResult, 'Error: ' + err.message, true);
    } finally {
      autocompleteBtn.disabled = false;
      autocompleteBtn.textContent = 'Autocomplete';
    }
  });
}

if (parseCitationBtn && citationInput && citationResult) {
  parseCitationBtn.addEventListener('click', async () => {
    const text = citationInput.value.trim();
    if (!text) return;
    parseCitationBtn.disabled = true;
    parseCitationBtn.textContent = 'Parsing...';
    try {
      const style = citationStyle ? citationStyle.value : 'apa';
      const result = await parseCitationFromAI(text, style);
      showAiResult(citationResult, result);
    } catch (err) {
      showAiResult(citationResult, 'Error: ' + err.message, true);
    } finally {
      parseCitationBtn.disabled = false;
      parseCitationBtn.textContent = 'Parse Citation';
    }
  });
}

// Listen for selection changes in Word