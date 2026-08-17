import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist/faq');
const DATA = JSON.parse(readFileSync(resolve(__dirname, 'data.json'), 'utf-8'));
const TEMPLATE = readFileSync(resolve(__dirname, 'templates/index.html'), 'utf-8');

const SITE_URL = 'https://kakamit.com';
const LANGS = ['fi', 'en'];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function replace(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value ?? '');
  }
  return result;
}

function buildJsonLd(questions, lang) {
  const faqEntities = questions.map(q => ({
    '@type': 'Question',
    name: q[lang].q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: q[lang].a,
    },
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntities,
  });
}

function buildSectionsHtml(questions, lang, ui) {
  const categories = {
    app: { label: ui.categoryApp, emoji: '💩' },
    gut: { label: ui.categoryGut, emoji: '🩺' },
    usage: { label: ui.categoryUsage, emoji: '📱' },
    other: { label: ui.categoryOther, emoji: '💬' },
  };

  // Group questions by category
  const grouped = {};
  for (const cat of Object.keys(categories)) {
    grouped[cat] = [];
  }
  for (const q of questions) {
    if (!q[lang]) continue;
    const cat = q.category;
    if (grouped[cat]) {
      grouped[cat].push(q);
    }
  }

  let html = '';
  for (const [catId, catMeta] of Object.entries(categories)) {
    const items = grouped[catId];
    if (!items || items.length === 0) continue;
    html += `<section class="faq-section"><h2>${catMeta.emoji} ${catMeta.label}</h2>\n`;
    for (const q of items) {
      html += `<details class="faq-item">
<summary>${q[lang].q}</summary>
<div class="faq-answer"><p>${q[lang].a}</p></div>
</details>\n`;
    }
    html += `</section>\n`;
  }
  return html;
}

function buildHreflang(lang) {
  const tags = [];
  for (const l of LANGS) {
    tags.push(`<link rel="alternate" hreflang="${l}" href="${SITE_URL}/faq/${l}/">`);
  }
  tags.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}/faq/en/">`);
  return tags.join('\n');
}

// --- Generate FAQ pages ---
for (const lang of LANGS) {
  const ui = DATA.meta.ui[lang];
  const questions = DATA.questions.filter(q => q[lang]);

  const ctaText = lang === 'fi'
    ? 'Seuraa suolistosi hyvinvointia yksityisesti ja helposti.'
    : 'Track your gut health privately and easily.';

  const html = replace(TEMPLATE, {
    lang,
    title: ui.title,
    metaDesc: ui.metaDesc,
    canonical: `${SITE_URL}/faq/${lang}/`,
    hreflang: buildHreflang(lang),
    jsonLd: buildJsonLd(questions, lang),
    sectionsHtml: buildSectionsHtml(questions, lang, ui),
    backToApp: ui.backToApp,
    ctaText,
    disclaimer: ui.disclaimer,
  });

  const dir = resolve(DIST, lang);
  ensureDir(dir);
  writeFileSync(resolve(dir, 'index.html'), html);
}

// --- Generate /faq/index.html redirect ---
const redirectHtml = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=/faq/fi/">
<link rel="canonical" href="${SITE_URL}/faq/fi/">
<title>Redirecting...</title>
</head><body>
<p>Redirecting to <a href="/faq/fi/">FAQ</a>...</p>
<script>location.replace('/faq/fi/');</script>
</body></html>`;
ensureDir(DIST);
writeFileSync(resolve(DIST, 'index.html'), redirectHtml);

// --- Append FAQ URLs to existing sitemap.xml ---
const sitemapPath = resolve(__dirname, '../dist/sitemap.xml');
let sitemap = readFileSync(sitemapPath, 'utf-8');

const faqUrls = [];
for (const lang of LANGS) {
  let entry = `  <url>\n    <loc>${SITE_URL}/faq/${lang}/</loc>`;
  for (const l of LANGS) {
    entry += `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/faq/${l}/"/>`;
  }
  entry += `\n  </url>`;
  faqUrls.push(entry);
}

sitemap = sitemap.replace('</urlset>', faqUrls.join('\n') + '\n</urlset>');
writeFileSync(sitemapPath, sitemap);

// --- Summary ---
const totalQuestions = DATA.questions.length;
console.log(`FAQ: Generated ${LANGS.length} pages (${totalQuestions} questions each) + sitemap updated`);
