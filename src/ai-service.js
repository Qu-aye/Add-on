/**
 * CiteFlow — AI Service (DeepSeek API)
 * Handles: Paraphraser, Grammar Checker, Summarizer, Co-Writer, AI Citation Parsing
 */

const DEEPSEEK_CONFIG = {
  apiKey: typeof DEEPSEEK_API_KEY !== 'undefined' ? DEEPSEEK_API_KEY : '',
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  maxTokens: 2048,
  temperature: 0.7,
};

/* ---------- Generic API Call ---------- */

async function callDeepSeek(systemPrompt, userText, options = {}) {
  const key = options.apiKey || DEEPSEEK_CONFIG.apiKey;
  if (!key) {
    throw new Error('DeepSeek API key not configured. Set DEEPSEEK_API_KEY in your environment.');
  }

  const body = {
    model: options.model || DEEPSEEK_CONFIG.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ],
    max_tokens: options.maxTokens || DEEPSEEK_CONFIG.maxTokens,
    temperature: options.temperature ?? DEEPSEEK_CONFIG.temperature,
    stream: false,
  };

  const resp = await fetch(DEEPSEEK_CONFIG.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`DeepSeek API error ${resp.status}: ${err.error?.message || resp.statusText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/* ================================================================
   1. PARAPHRASER
   ================================================================ */

const PARAPHRASE_MODES = {
  standard: 'Rewrite the following text to express the same ideas using different wording. Maintain the original meaning and tone.',
  fluency: 'Rewrite the following text to improve fluency and readability. Fix awkward phrasing, improve word choice, and make the text flow naturally. Keep the meaning identical.',
  formal: 'Rewrite the following text in a formal, professional tone suitable for academic or business contexts. Use precise vocabulary and avoid colloquialisms.',
  academic: 'Rewrite the following text in a scholarly academic tone. Use formal academic vocabulary, complex sentence structures where appropriate, and maintain rigorous precision.',
  simple: 'Rewrite the following text in simple, easy-to-understand language. Use short sentences, common words, and clear explanations. Make it accessible to a general audience.',
  creative: 'Rewrite the following text in a creative, engaging style. Use vivid language, varied sentence structures, and expressive vocabulary while preserving the core meaning.',
  custom: '', // User provides their own instruction
};

async function paraphraseText(text, mode, synonymLevel = 50, customInstruction = '') {
  let systemPrompt;

  if (mode === 'custom' && customInstruction) {
    systemPrompt = customInstruction;
  } else {
    systemPrompt = PARAPHRASE_MODES[mode] || PARAPHRASE_MODES.standard;
  }

  // Adjust based on synonym slider (0 = fewer changes, 100 = more changes)
  if (synonymLevel <= 30) {
    systemPrompt += ' Make minimal changes — only rephrase where absolutely necessary. Keep as close to the original wording as possible.';
  } else if (synonymLevel >= 70) {
    systemPrompt += ' Make substantial changes — use diverse synonyms, restructure sentences freely, and be highly creative with the rewrite.';
  } else {
    systemPrompt += ' Balance changes — rephrase naturally while keeping the core structure recognizable.';
  }

  systemPrompt += ' Return ONLY the rewritten text, no explanations or commentary.';

  return await callDeepSeek(systemPrompt, text, { temperature: 0.8 });
}

/* ================================================================
   2. GRAMMAR CHECKER
   ================================================================ */

async function checkGrammar(text) {
  const systemPrompt = `You are an expert proofreader and grammar checker. Analyze the following text for spelling, punctuation, grammar, and style errors.

Return your findings as a valid JSON array of error objects. Each object must have these fields:
- "original": the exact erroneous word or phrase from the text
- "correction": the corrected version
- "reason": a brief explanation of the error (one sentence)
- "type": one of "spelling", "grammar", "punctuation", "style"
- "startIndex": approximate character position in the original text (0-based)

If there are no errors, return an empty array: []

Return ONLY the JSON array, no other text.`;

  const response = await callDeepSeek(systemPrompt, text, { temperature: 0.1 });
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch {
    console.warn('Grammar check: could not parse JSON response:', response);
    return [];
  }
}

async function fixGrammarErrors(text, errors) {
  if (!errors.length) return text;

  // Sort errors by position (descending) to replace from end to start
  const sorted = [...errors].sort((a, b) => (b.startIndex || 0) - (a.startIndex || 0));
  let fixed = text;

  for (const err of sorted) {
    if (err.original && err.correction && fixed.includes(err.original)) {
      fixed = fixed.replace(err.original, err.correction);
    }
  }

  return fixed;
}

/* ================================================================
   3. SUMMARIZER
   ================================================================ */

async function summarizeText(text, length = 50, format = 'paragraph') {
  let systemPrompt = 'You are an expert summarizer. Summarize the following text.';

  // Length slider: 0 = very short, 100 = detailed
  if (length <= 25) {
    systemPrompt += ' Create a very concise summary — 2-3 sentences maximum.';
  } else if (length <= 50) {
    systemPrompt += ' Create a moderate-length summary — about 4-6 sentences.';
  } else if (length <= 75) {
    systemPrompt += ' Create a detailed summary — about 7-10 sentences covering all key points.';
  } else {
    systemPrompt += ' Create a comprehensive summary — cover all major points in detail.';
  }

  // Format
  if (format === 'bullets') {
    systemPrompt += ' Format the summary as bullet points (use • for each point). Each bullet should be one concise sentence.';
  } else if (format === 'key-sentences') {
    systemPrompt += ' Extract the 3-5 most important sentences directly from the original text. Present them as a numbered list. Do NOT rewrite them — quote them exactly.';
  } else {
    systemPrompt += ' Write the summary as a cohesive paragraph in your own words.';
  }

  systemPrompt += ' Return ONLY the summary, no other text.';

  return await callDeepSeek(systemPrompt, text, { temperature: 0.3, maxTokens: 1024 });
}

/* ================================================================
   4. CO-WRITER (Autocomplete)
   ================================================================ */

async function autocompleteText(contextText) {
  const systemPrompt = `You are an AI co-writer helping a user complete their writing. Given the text they are currently writing, predict and suggest the next 15-25 words that would naturally follow.

Rules:
- Match the tone, style, and vocabulary of the existing text
- The continuation should be fluid and natural
- Do NOT repeat what has already been written
- Return ONLY the suggested continuation text, nothing else
- If the text ends mid-sentence, complete the sentence first, then add one more sentence`;

  return await callDeepSeek(systemPrompt, contextText, { temperature: 0.7, maxTokens: 150 });
}

/* ================================================================
   5. AI CITATION PARSER
   ================================================================ */

async function parseCitationFromAI(source, style = 'apa') {
  const systemPrompt = `You are an expert citation formatter. Given a URL, book title, article title, or raw metadata, generate a perfectly formatted citation in ${style.toUpperCase()} style.

Rules:
- Extract all available metadata (authors, title, year, journal, volume, issue, pages, DOI, publisher)
- Format exactly according to ${style.toUpperCase()} guidelines
- If information is missing, omit that field gracefully
- Return ONLY the formatted citation string, nothing else
- If the source is a URL, try to infer what kind of resource it is (journal article, book, website, etc.)`;

  return await callDeepSeek(systemPrompt, source, { temperature: 0.2 });
}

/* ---------- Exports ---------- */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    callDeepSeek,
    paraphraseText,
    checkGrammar,
    fixGrammarErrors,
    summarizeText,
    autocompleteText,
    parseCitationFromAI,
    PARAPHRASE_MODES,
  };
}