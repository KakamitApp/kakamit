import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist/fodmap');
const DATA = JSON.parse(readFileSync(resolve(__dirname, 'data.json'), 'utf-8'));
const FOOD_TEMPLATE = readFileSync(resolve(__dirname, 'templates/food.html'), 'utf-8');
const INDEX_TEMPLATE = readFileSync(resolve(__dirname, 'templates/index.html'), 'utf-8');

const { meta, categories, foods } = DATA;
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

function buildFromTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value ?? '');
  }
  return result;
}

function buildJsonLd(food, langData, lang, canonical, ui) {
  const h1 = buildFromTemplate(ui.h1Template, { name: langData.name });
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: h1,
    description: langData.description.slice(0, 160),
    author: { '@type': 'Organization', name: 'Kakamit', url: meta.siteUrl },
    publisher: { '@type': 'Organization', name: 'Kakamit', url: meta.siteUrl },
    datePublished: meta.lastUpdated,
    dateModified: meta.lastUpdated,
    mainEntityOfPage: canonical,
  });
}

function buildAlternativesHtml(alternatives, ui) {
  if (!alternatives || alternatives.length === 0) return '';
  const items = alternatives.map(a => `<li>${a}</li>`).join('');
  return `<div class="alternatives"><h2>${ui.alternativesLabel}</h2><ul>${items}</ul></div>`;
}

function buildCategoryLinksHtml(food, lang, ui) {
  const sameCat = foods.filter(f => f.category === food.category && f.id !== food.id && f[lang]);
  if (sameCat.length === 0) return '';
  const links = sameCat.map(f => {
    const d = f[lang];
    return `<li><a href="/fodmap/${lang}/${d.slug}/"><span class="dot dot-${f.status}"></span> ${d.name}</a></li>`;
  }).join('');
  return `<div class="category-links"><h2>${ui.categoryLabel}</h2><ul>${links}</ul></div>`;
}

function buildSourcesHtml() {
  return meta.sources.map(s => `<li>${s}</li>`).join('');
}

function buildHreflang(food) {
  const tags = [];
  for (const lang of LANGS) {
    if (food[lang]) {
      tags.push(`<link rel="alternate" hreflang="${lang}" href="${meta.siteUrl}/fodmap/${lang}/${food[lang].slug}/">`);
    }
  }
  const defaultLang = food.en ? 'en' : 'fi';
  const defaultSlug = food[defaultLang]?.slug;
  if (defaultSlug) {
    tags.push(`<link rel="alternate" hreflang="x-default" href="${meta.siteUrl}/fodmap/${defaultLang}/${defaultSlug}/">`);
  }
  return tags.join('\n');
}

function buildIndexHreflang(lang) {
  const tags = [];
  for (const l of LANGS) {
    const hasAny = foods.some(f => f[l]);
    if (hasAny) {
      tags.push(`<link rel="alternate" hreflang="${l}" href="${meta.siteUrl}/fodmap/${l}/">`);
    }
  }
  return tags.join('\n');
}

// --- Generate food pages ---
for (const lang of LANGS) {
  const foodsForLang = foods.filter(f => f[lang]);
  if (foodsForLang.length === 0) continue;

  const ui = meta.ui[lang];
  const statusLabels = meta.statusLabels[lang];
  const disclaimer = meta.disclaimer[lang];

  for (const food of foodsForLang) {
    const langData = food[lang];
    const slug = langData.slug;
    const canonical = `${meta.siteUrl}/fodmap/${lang}/${slug}/`;

    // Build dynamic title, meta description, h1 from templates
    const templateVars = {
      name: langData.name,
      statusLabelLower: statusLabels[food.status].toLowerCase(),
      fodmapType: langData.fodmapType,
    };
    const pageTitle = buildFromTemplate(ui.titleTemplate, templateVars);
    const metaDesc = buildFromTemplate(ui.metaDescTemplate, templateVars);
    const h1 = buildFromTemplate(ui.h1Template, templateVars);

    const html = replace(FOOD_TEMPLATE, {
      lang,
      pageTitle,
      metaDesc,
      h1,
      name: langData.name,
      status: food.status,
      statusLabel: statusLabels[food.status],
      statusLabelLower: statusLabels[food.status].toLowerCase(),
      fodmapType: langData.fodmapType,
      portion: langData.portion,
      description: langData.description,
      canonical,
      hreflang: buildHreflang(food),
      jsonLd: buildJsonLd(food, langData, lang, canonical, ui),
      alternativesHtml: buildAlternativesHtml(langData.alternatives, ui),
      categoryLinksHtml: buildCategoryLinksHtml(food, lang, ui),
      sourcesHtml: buildSourcesHtml(),
      disclaimer,
      'ui.backToSearch': ui.backToSearch,
      'ui.fodmapTypeLabel': ui.fodmapTypeLabel,
      'ui.portionLabel': ui.portionLabel,
      'ui.ctaTitle': ui.ctaTitle,
      'ui.ctaText': ui.ctaText,
      'ui.ctaButton': ui.ctaButton,
      'ui.sourcesTitle': ui.sourcesTitle,
      'ui.allFoods': ui.allFoods,
    });

    const dir = resolve(DIST, lang, slug);
    ensureDir(dir);
    writeFileSync(resolve(dir, 'index.html'), html);
  }

  // --- Generate index/search page ---
  const byCategory = {};
  for (const food of foodsForLang) {
    const cat = food.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(food);
  }

  let categoriesHtml = '';
  for (const [catId, catFoods] of Object.entries(byCategory)) {
    const catName = categories[catId]?.[lang] || catId;
    const items = catFoods.map(f => {
      const d = f[lang];
      return `<li data-food="${d.name.toLowerCase()}"><a href="/fodmap/${lang}/${d.slug}/"><span class="dot dot-${f.status}"></span><span class="food-name">${d.name}</span><span class="food-portion">${d.portion}</span></a></li>`;
    }).join('\n');
    categoriesHtml += `<section data-category="${catId}"><h2>${catName}</h2><ul class="food-list">${items}</ul></section>`;
  }

  const indexCanonical = `${meta.siteUrl}/fodmap/${lang}/`;
  const foodCountText = buildFromTemplate(ui.foodCountText, { count: String(foodsForLang.length) });

  // Build index meta description per language
  const indexMetaDesc = lang === 'fi'
    ? `Hae ruoka-aineita ja selvitä niiden FODMAP-pitoisuus. ${foodsForLang.length} ruoka-ainetta luokiteltu liikennevalomallilla.`
    : `Search foods and check their FODMAP content. ${foodsForLang.length} foods classified with a traffic-light system.`;

  const indexHtml = replace(INDEX_TEMPLATE, {
    lang,
    canonical: indexCanonical,
    hreflang: buildIndexHreflang(lang),
    categoriesHtml,
    foodCountText,
    indexMetaDesc,
    sourcesHtml: buildSourcesHtml(),
    disclaimer,
    'ui.searchTitle': ui.searchTitle,
    'ui.searchPlaceholder': ui.searchPlaceholder,
    'ui.ctaTitle': ui.ctaTitle,
    'ui.ctaText': ui.ctaText,
    'ui.ctaButton': ui.ctaButton,
    'ui.sourcesTitle': ui.sourcesTitle,
  });

  const indexDir = resolve(DIST, lang);
  ensureDir(indexDir);
  writeFileSync(resolve(indexDir, 'index.html'), indexHtml);
}

// --- Generate /fodmap/index.html redirect ---
const redirectHtml = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=/fodmap/fi/">
<link rel="canonical" href="${meta.siteUrl}/fodmap/fi/">
<title>Redirecting...</title>
</head><body>
<p>Redirecting to <a href="/fodmap/fi/">FODMAP-pikahaku</a>...</p>
<script>location.replace('/fodmap/fi/');</script>
</body></html>`;
ensureDir(DIST);
writeFileSync(resolve(DIST, 'index.html'), redirectHtml);

// --- Copy styles.css ---
cpSync(resolve(__dirname, 'styles.css'), resolve(DIST, 'styles.css'));

// --- Generate sitemap.xml ---
const sitemapEntries = [`  <url><loc>${meta.siteUrl}/</loc></url>`];

for (const lang of LANGS) {
  const foodsForLang = foods.filter(f => f[lang]);
  if (foodsForLang.length === 0) continue;

  sitemapEntries.push(`  <url><loc>${meta.siteUrl}/fodmap/${lang}/</loc></url>`);

  for (const food of foodsForLang) {
    const slug = food[lang].slug;
    const loc = `${meta.siteUrl}/fodmap/${lang}/${slug}/`;

    const otherLangs = LANGS.filter(l => l !== lang && food[l]);
    if (otherLangs.length > 0) {
      let links = `    <xhtml:link rel="alternate" hreflang="${lang}" href="${loc}"/>`;
      for (const ol of otherLangs) {
        links += `\n    <xhtml:link rel="alternate" hreflang="${ol}" href="${meta.siteUrl}/fodmap/${ol}/${food[ol].slug}/"/>`;
      }
      sitemapEntries.push(`  <url>\n    <loc>${loc}</loc>\n${links}\n  </url>`);
    } else {
      sitemapEntries.push(`  <url><loc>${loc}</loc></url>`);
    }
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapEntries.join('\n')}
</urlset>`;

writeFileSync(resolve(__dirname, '../dist/sitemap.xml'), sitemap);

// --- Summary ---
const totalPages = LANGS.reduce((sum, l) => sum + foods.filter(f => f[l]).length, 0);
console.log(`FODMAP: Generated ${totalPages} food pages + index pages + sitemap.xml`);
