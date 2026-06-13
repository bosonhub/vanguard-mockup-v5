/**
 * Vanguard Realty Group — Dynamic Listings Filter
 * Usage: include this script, then call initListings(category, jsonPath, gridId, crexiUrl)
 * category: string matching listings.json category array values (e.g. 'industrial', 'retail', 'office', 'multi-family', 'land')
 *
 * Image handling:
 *   - If listing.image is a valid URL: renders a clickable photo with hover-zoom
 *   - If listing.image is missing/empty or the img fails to load: renders the branded
 *     Vanguard placeholder (listing-placeholder.svg) as a clickable link to the Crexi listing
 */

// Resolve the path to the placeholder SVG relative to this script's location
var PLACEHOLDER_SVG = (function() {
  var scripts = document.querySelectorAll('script[src]');
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute('src');
    if (src && src.indexOf('listings-filter') !== -1) {
      return src.replace('listings-filter.js', 'listing-placeholder.svg');
    }
  }
  return '../assets/listing-placeholder.svg'; // fallback
})();

function renderListingImage(l) {
  var placeholderHtml =
    '<a href="' + (l.url || '#') + '" target="_blank" ' +
    'class="listing-img listing-img-placeholder" ' +
    'style="display:block;overflow:hidden;padding:0;" ' +
    'title="View photos on Crexi">' +
    '<img src="' + PLACEHOLDER_SVG + '" alt="View photos on Crexi" ' +
    'style="width:100%;height:100%;object-fit:cover;display:block;" />' +
    '</a>';

  if (!l.image) return placeholderHtml;

  return '<a href="' + l.url + '" target="_blank" class="listing-img listing-img-link" ' +
    'style="display:block;overflow:hidden;padding:0;">' +
    '<img src="' + l.image + '" alt="' + (l.name || 'Property photo') + '" ' +
    'style="width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.4s;" ' +
    'onerror="this.parentElement.outerHTML=\'' + placeholderHtml.replace(/'/g, "\\'") + '\'" />' +
    '</a>';
}

function initListings(category, jsonPath, gridId, crexiUrl) {
  var grid = document.getElementById(gridId);
  if (!grid) return;

  function render(listings) {
    var filtered = listings.filter(function(l) { return l.category && l.category.includes(category); });
    if (!filtered.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-soft);">' +
        'No ' + category + ' listings currently active. ' +
        '<a href="' + (crexiUrl || '#') + '" target="_blank" style="color:var(--gold);">View all on Crexi</a> or ' +
        '<a href="../../contact/index.html" style="color:var(--gold);">contact us</a> to discuss off-market opportunities.' +
        '</div>';
      return;
    }
    grid.innerHTML = filtered.map(function(l) {
      var sc = l.type === 'For Sale' ? 'status-sale' : 'status-lease';
      return '<div class="listing-card">' +
        renderListingImage(l) +
        '<div class="listing-body">' +
          '<span class="listing-status ' + sc + '">' + l.type + '</span>' +
          '<div class="listing-name">' + l.name + '</div>' +
          '<div class="listing-addr">' + l.address + '</div>' +
          '<div class="listing-price">' + (l.price || 'Price Upon Request') + '</div>' +
          '<div class="listing-meta">' +
            (l.propertyType ? '<span>' + l.propertyType + '</span>' : '') +
            (l.sqft ? '<span>' + l.sqft + '</span>' : '') +
            (l.leaseType ? '<span>' + l.leaseType + '</span>' : '') +
          '</div>' +
          (l.description ? '<p style="font-size:13px;color:var(--ink-soft);line-height:1.6;margin:10px 0 14px;">' + l.description + '</p>' : '') +
          '<a href="' + l.url + '" target="_blank" class="btn-outline" style="font-size:12px;padding:8px 16px;">View on Crexi \u2192</a>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  fetch(jsonPath + '?t=' + Date.now())
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(data) {
      if (data && data.listings && data.listings.length > 0) {
        render(data.listings);
      } else {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-soft);">' +
          'No listings currently available. ' +
          '<a href="' + (crexiUrl || 'https://www.crexi.com') + '" target="_blank" style="color:var(--gold);">View all on Crexi \u2192</a>' +
          '</div>';
      }
    })
    .catch(function() {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--ink-soft);">' +
        'Unable to load listings. ' +
        '<a href="' + (crexiUrl || 'https://www.crexi.com') + '" target="_blank" style="color:var(--gold);">View on Crexi \u2192</a>' +
        '</div>';
    });
}
