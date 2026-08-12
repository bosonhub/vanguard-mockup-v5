/*
  Commercial Exchange Prototype
  -------------------------------------------------------------------------
  This page reads only two local JSON sources:
  1) ../listings.json — existing Vanguard-controlled inventory data
  2) assets/partner-demo.json — clearly labeled illustrative partner records

  It does NOT scrape, crawl, frame, or republish third-party marketplace data.
  Future source adapters must be activated only after a signed data/display
  agreement or an approved IDX/API credential is in place.
*/

const state = {
  allListings: [],
  filteredListings: [],
  activeType: 'All',
  activeSource: 'all',
  selectedId: null,
  map: null,
  markers: new Map(),
  layer: null
};

const cityCenters = {
  corvallis: [44.5646, -123.2620],
  albany: [44.6365, -123.1059],
  roseburg: [43.2165, -123.3417],
  sutherlin: [43.3901, -123.3126],
  lebanon: [44.5365, -122.9070]
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function stableOffset(value, modifier = 1) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash) + value.charCodeAt(i);
  return (((Math.abs(hash * modifier) % 1000) / 1000) - .5) * .035;
}

function locationForListing(listing) {
  if (Number.isFinite(listing.lat) && Number.isFinite(listing.lng)) return [listing.lat, listing.lng];
  const raw = `${listing.address || ''} ${listing.name || ''}`.toLowerCase();
  const cityKey = Object.keys(cityCenters).find(city => raw.includes(city)) || 'corvallis';
  const [lat, lng] = cityCenters[cityKey];
  return [lat + stableOffset(raw, 5), lng + stableOffset(raw, 11)];
}

function normalizeVanguardListing(listing, index) {
  const sourceName = 'Vanguard Inventory Feed';
  const type = listing.type || 'For Sale';
  const categories = Array.isArray(listing.category) ? listing.category : [];
  const isFeatured = /kammerer|pacific|520 sw 3rd/i.test(`${listing.name} ${listing.address}`);
  const coordinates = locationForListing(listing);
  return {
    id: `vanguard-${index}-${String(listing.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: listing.name || 'Commercial Opportunity',
    type,
    propertyType: listing.propertyType || categories.map(category => category[0]?.toUpperCase() + category.slice(1)).join(', ') || 'Commercial',
    category: categories,
    price: listing.price || 'Contact for pricing',
    sqft: listing.sqft || 'Size available on request',
    address: listing.address || 'Address available on request',
    city: (listing.address || '').match(/,\s*([^,]+),\s*OR/i)?.[1] || 'Oregon',
    description: listing.description || 'Contact Vanguard Realty Group for property information.',
    source: sourceName,
    sourceMode: 'vanguard',
    sourceNote: 'Vanguard-controlled inventory source. Prototype display only; no new live crawl is performed on this page.',
    url: listing.url || '',
    featured: isFeatured,
    image: listing.image || '',
    lat: coordinates[0],
    lng: coordinates[1]
  };
}

function normalizePartnerListing(listing) {
  const coordinates = locationForListing(listing);
  return { ...listing, category: listing.category || [], lat: coordinates[0], lng: coordinates[1] };
}

async function loadSourceAdapter(name, url, transform) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${name} source returned ${response.status}`);
    const payload = await response.json();
    const records = Array.isArray(payload) ? payload : (Array.isArray(payload.listings) ? payload.listings : []);
    return records.map(transform);
  } catch (error) {
    console.warn(`Unable to load ${name}:`, error);
    return [];
  }
}

async function initializeData() {
  const [vanguardRecords, partnerRecords] = await Promise.all([
    loadSourceAdapter('Vanguard inventory', '../listings.json', normalizeVanguardListing),
    loadSourceAdapter('Illustrative partner feed', 'assets/partner-demo.json', normalizePartnerListing)
  ]);
  state.allListings = [...vanguardRecords, ...partnerRecords];
  applyFilters();
}

function getFilters() {
  return {
    query: document.querySelector('#keyword-search').value.trim().toLowerCase(),
    city: document.querySelector('#city-filter').value,
    deal: document.querySelector('#deal-filter').value,
    propertyType: document.querySelector('#property-filter').value,
    activeType: state.activeType,
    activeSource: state.activeSource
  };
}

function listingMatches(listing, filters) {
  const haystack = `${listing.name} ${listing.address} ${listing.city} ${listing.propertyType} ${listing.description}`.toLowerCase();
  const typeMatch = filters.activeType === 'All' || listing.type === filters.activeType;
  const sourceMatch = filters.activeSource === 'all' || listing.sourceMode === filters.activeSource;
  const cityMatch = filters.city === 'All Markets' || listing.city === filters.city;
  const dealMatch = filters.deal === 'All Opportunities' || listing.type === filters.deal;
  const propertyMatch = filters.propertyType === 'All Types' || listing.propertyType.toLowerCase().includes(filters.propertyType.toLowerCase());
  return (!filters.query || haystack.includes(filters.query)) && typeMatch && sourceMatch && cityMatch && dealMatch && propertyMatch;
}

function applyFilters() {
  const filters = getFilters();
  state.filteredListings = state.allListings
    .filter(listing => listingMatches(listing, filters))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  if (!state.filteredListings.some(listing => listing.id === state.selectedId)) state.selectedId = state.filteredListings[0]?.id || null;
  renderResults();
  renderMap();
}

function cardTemplate(listing) {
  const dealClass = listing.type === 'For Lease' ? 'lease' : '';
  const visual = listing.image
    ? `<img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.name)}" onerror="this.parentElement.classList.add('fallback'); this.remove();">`
    : '<span>Commercial<br>Opportunity</span>';
  return `
    <article class="listing-card ${listing.id === state.selectedId ? 'selected' : ''}" data-listing-id="${escapeHtml(listing.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(listing.name)}">
      <div class="listing-visual ${listing.image ? '' : 'fallback'}">
        ${listing.featured ? '<span class="featured-badge">Featured by Vanguard</span>' : ''}
        ${visual}
      </div>
      <div class="card-body">
        <div class="card-topline"><span class="${dealClass}">${escapeHtml(listing.type)}</span><span>•</span><span>${escapeHtml(listing.propertyType)}</span></div>
        <h3>${escapeHtml(listing.name)}</h3>
        <p class="card-address">${escapeHtml(listing.address)}</p>
        <div class="card-details"><span><strong>${escapeHtml(listing.price)}</strong></span><span>${escapeHtml(listing.sqft)}</span></div>
        <div class="source-tag"><span class="source-dot"></span>${escapeHtml(listing.source)}${listing.sourceMode === 'demo' ? ' · DEMO' : ''}</div>
      </div>
    </article>`;
}

function renderResults() {
  const target = document.querySelector('#results-list');
  const count = state.filteredListings.length;
  const liveCount = state.filteredListings.filter(listing => listing.sourceMode === 'vanguard').length;
  const demoCount = count - liveCount;
  document.querySelector('#results-count').innerHTML = `<strong>${count}</strong> prototype ${count === 1 ? 'opportunity' : 'opportunities'} <span>· ${liveCount} Vanguard source${liveCount === 1 ? '' : 's'}${demoCount ? ` · ${demoCount} illustrative partner records` : ''}</span>`;
  if (!count) {
    target.innerHTML = `<div class="empty-state"><h3>No matching opportunities</h3><p>Try widening the market, property type, or sale/lease filters. This prototype only displays local, approved demo data.</p></div>`;
    return;
  }
  target.innerHTML = state.filteredListings.map(cardTemplate).join('');
  target.querySelectorAll('.listing-card').forEach(card => {
    const open = () => selectListing(card.dataset.listingId, true);
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
}

function markerIcon(listing) {
  const featured = listing.featured ? ' featured' : '';
  const partner = listing.sourceMode === 'demo' ? ' partner' : '';
  return L.divIcon({
    className: 'custom-marker',
    html: `<span class="marker-dot${featured}${partner}">${listing.featured ? '★' : '•'}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -13]
  });
}

function ensureMap() {
  if (state.map) return;
  state.map = L.map('exchange-map', { zoomControl: false, scrollWheelZoom: false }).setView([44.574, -123.20], 11);
  L.control.zoom({ position: 'bottomright' }).addTo(state.map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);
}

function renderMap() {
  ensureMap();
  if (state.layer) state.layer.remove();
  state.markers = new Map();
  state.layer = L.layerGroup().addTo(state.map);
  const bounds = [];
  state.filteredListings.forEach(listing => {
    const marker = L.marker([listing.lat, listing.lng], { icon: markerIcon(listing) });
    marker.bindPopup(`
      <div class="map-popup-kind">${escapeHtml(listing.type)} · ${escapeHtml(listing.propertyType)}</div>
      <div class="map-popup-name">${escapeHtml(listing.name)}</div>
      <div class="map-popup-price">${escapeHtml(listing.price)} · ${escapeHtml(listing.sqft)}</div>
      <button class="map-popup-button" data-popup-id="${escapeHtml(listing.id)}">View opportunity</button>
    `, { closeButton: false });
    marker.on('click', () => { state.selectedId = listing.id; renderResults(); });
    marker.addTo(state.layer);
    state.markers.set(listing.id, marker);
    bounds.push([listing.lat, listing.lng]);
  });
  if (bounds.length === 1) state.map.setView(bounds[0], 13);
  if (bounds.length > 1) state.map.fitBounds(bounds, { padding: [38, 38], maxZoom: 11 });
  setTimeout(() => state.map.invalidateSize(), 50);
}

function selectListing(id, openModal) {
  const listing = state.allListings.find(item => item.id === id);
  if (!listing) return;
  state.selectedId = id;
  renderResults();
  const marker = state.markers.get(id);
  if (marker) {
    state.map.setView([listing.lat, listing.lng], Math.max(state.map.getZoom(), 13), { animate: true });
    marker.openPopup();
  }
  if (openModal) openDetailModal(listing);
}

function openDetailModal(listing) {
  const modal = document.querySelector('#detail-modal');
  const content = document.querySelector('#modal-content');
  const image = listing.image ? `<div class="modal-visual"><img src="${escapeHtml(listing.image)}" alt="${escapeHtml(listing.name)}"></div>` : '';
  const sourceStatus = listing.sourceMode === 'demo'
    ? '<p><strong>Prototype-only data:</strong> This record demonstrates how an authorized partner feed could appear once a written listing-display agreement is in place.</p>'
    : '<p><strong>Vanguard inventory source:</strong> This record comes from the existing Vanguard listing dataset used only for this prototype.</p>';
  const external = listing.url ? `<a class="btn outline" href="${escapeHtml(listing.url)}" target="_blank" rel="noopener">Open original listing</a>` : '';
  content.innerHTML = `
    <button class="modal-close" type="button" aria-label="Close details">×</button>
    ${image}
    <div class="modal-body">
      <div class="card-topline"><span class="${listing.type === 'For Lease' ? 'lease' : ''}">${escapeHtml(listing.type)}</span><span>•</span><span>${escapeHtml(listing.propertyType)}</span>${listing.featured ? '<span>•</span><span>Featured</span>' : ''}</div>
      <h2>${escapeHtml(listing.name)}</h2>
      <p class="price">${escapeHtml(listing.price)}</p>
      <p>${escapeHtml(listing.address)}</p>
      <div class="modal-meta"><div><small>Size</small><strong>${escapeHtml(listing.sqft)}</strong></div><div><small>Market</small><strong>${escapeHtml(listing.city)}</strong></div><div><small>Source</small><strong>${escapeHtml(listing.source)}</strong></div></div>
      <p>${escapeHtml(listing.description)}</p>
      ${sourceStatus}
      <div class="modal-actions"><a class="btn gold" href="#property-inquiry" data-inquiry-listing="${escapeHtml(listing.name)}">Ask Vanguard about this opportunity</a>${external}</div>
    </div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  content.querySelector('.modal-close').addEventListener('click', closeDetailModal);
  content.querySelector('[data-inquiry-listing]')?.addEventListener('click', () => {
    document.querySelector('#property-interest').value = listing.name;
    closeDetailModal();
  });
}

function closeDetailModal() {
  const modal = document.querySelector('#detail-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function bindControls() {
  document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
  ['#keyword-search', '#city-filter', '#deal-filter', '#property-filter'].forEach(selector => {
    document.querySelector(selector).addEventListener('change', applyFilters);
  });
  document.querySelector('#keyword-search').addEventListener('input', event => {
    window.clearTimeout(window.prototypeSearchTimer);
    window.prototypeSearchTimer = window.setTimeout(applyFilters, 220);
  });
  document.querySelectorAll('[data-type-filter]').forEach(button => {
    button.addEventListener('click', () => {
      state.activeType = button.dataset.typeFilter;
      document.querySelectorAll('[data-type-filter]').forEach(item => item.classList.toggle('active', item === button));
      applyFilters();
    });
  });
  document.querySelectorAll('[data-source-filter]').forEach(button => {
    button.addEventListener('click', () => {
      state.activeSource = button.dataset.sourceFilter;
      document.querySelectorAll('[data-source-filter]').forEach(item => item.classList.toggle('active', item === button));
      applyFilters();
    });
  });
  document.querySelector('#reset-filters').addEventListener('click', () => {
    document.querySelector('#keyword-search').value = '';
    document.querySelector('#city-filter').value = 'All Markets';
    document.querySelector('#deal-filter').value = 'All Opportunities';
    document.querySelector('#property-filter').value = 'All Types';
    state.activeType = 'All'; state.activeSource = 'all';
    document.querySelectorAll('[data-type-filter]').forEach(item => item.classList.toggle('active', item.dataset.typeFilter === 'All'));
    document.querySelectorAll('[data-source-filter]').forEach(item => item.classList.toggle('active', item.dataset.sourceFilter === 'all'));
    applyFilters();
  });
  document.querySelector('#detail-modal').addEventListener('click', event => { if (event.target.id === 'detail-modal') closeDetailModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDetailModal(); });
  document.addEventListener('click', event => {
    const popupButton = event.target.closest('[data-popup-id]');
    if (popupButton) selectListing(popupButton.dataset.popupId, true);
  });
  document.querySelector('#inquiry-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.querySelector('#lead-name').value.trim() || 'there';
    const message = document.querySelector('#form-message');
    message.textContent = `Thanks, ${name}. This prototype has captured the request for review; the production form will route it to Vanguard.`;
    event.currentTarget.reset();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  bindControls();
  await initializeData();
});
