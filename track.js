/* =============================================
   MediCare – Track Patient JS
   track-patient.js
   
   Dependencies (load in HTML before this file):
     <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
   ============================================= */

/* ─────────────────────────────────────────
   STATE VARIABLES
───────────────────────────────────────── */
let map           = null;   // Leaflet map instance
let marker        = null;   // Patient location marker
let accuracyCircle = null;  // Blue dashed accuracy circle on map
let watchId       = null;   // navigator.geolocation.watchPosition ID
let updateCount   = 0;      // How many GPS fixes received
let isSatellite   = false;  // Current tile layer mode
let tileLayer     = null;   // Active Leaflet tile layer
let currentLat    = null;   // Latest latitude
let currentLng    = null;   // Latest longitude

/* Tile layer URLs */
const TILE_STREET = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_SAT    = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';


/* ─────────────────────────────────────────
   UI HELPER FUNCTIONS
───────────────────────────────────────── */

/**
 * Update the status card appearance and text
 * @param {'success'|'error'|'loading'} type
 * @param {string} label  - Bold uppercase label
 * @param {string} value  - Description text
 */
function setStatus(type, label, value) {
  const card = document.getElementById('statusCard');
  card.className = `status-card visible ${type}`;
  document.getElementById('statusLabel').textContent = label;
  document.getElementById('statusValue').textContent = value;
}

/**
 * Show an element by adding 'visible' class
 * @param {string} id - Element ID
 */
function show(id) {
  document.getElementById(id).classList.add('visible');
}

/**
 * Hide an element by removing 'visible' class
 * @param {string} id - Element ID
 */
function hide(id) {
  document.getElementById(id).classList.remove('visible');
}

/**
 * Add a new entry to the location log in the sidebar
 * @param {string} iconHTML  - SVG or emoji string for icon
 * @param {string} title     - Bold title text
 * @param {string} subtitle  - Smaller grey subtitle text
 */
function addLog(iconHTML, title, subtitle) {
  const log  = document.getElementById('historyLog');
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <div class="history-icon">${iconHTML}</div>
    <div>
      <p>${title}</p>
      <span>${subtitle}</span>
    </div>`;
  log.prepend(item);                                  // newest on top
  while (log.children.length > 10) log.removeChild(log.lastChild); // max 10 entries
}


/* ─────────────────────────────────────────
   MAP INITIALIZATION
───────────────────────────────────────── */

/**
 * Create the Leaflet map on first GPS fix, hide the placeholder.
 * Called only once; subsequent updates call updateMap().
 * @param {number} lat
 * @param {number} lng
 */
function initMap(lat, lng) {
  // Hide the "Map will appear here" placeholder
  document.getElementById('mapPlaceholder').classList.add('hidden');

  if (!map) {
    // Create Leaflet map (no default zoom control — we add it bottom-right)
    map = L.map('map', { zoomControl: false }).setView([lat, lng], 16);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Default street tile layer
    tileLayer = L.tileLayer(TILE_STREET, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Show the custom map controls panel
    document.getElementById('mapControls').style.display = 'flex';
  }

  // ── Custom pulsing blue marker ──
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width:18px; height:18px;
        background:#1a56db;
        border:3px solid #fff;
        border-radius:50%;
        box-shadow:0 0 0 4px rgba(26,86,219,.3), 0 2px 8px rgba(0,0,0,.3);
        animation: markerPulse 2s infinite;
      "></div>
      <style>
        @keyframes markerPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(26,86,219,.3), 0 2px 8px rgba(0,0,0,.3); }
          50%      { box-shadow: 0 0 0 10px rgba(26,86,219,.1), 0 2px 8px rgba(0,0,0,.3); }
        }
      </style>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });

  if (!marker) {
    marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(
        `<b>📍 Patient Location</b><br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`,
        { closeButton: false }
      );
  } else {
    marker.setLatLng([lat, lng]);
    marker.getPopup().setContent(
      `<b>📍 Patient Location</b><br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`
    );
  }
}


/* ─────────────────────────────────────────
   MAP UPDATE (called on every GPS fix)
───────────────────────────────────────── */

/**
 * Move the marker and redraw accuracy circle.
 * @param {number} lat
 * @param {number} lng
 * @param {number} accuracy - in metres
 */
function updateMap(lat, lng, accuracy) {
  currentLat = lat;
  currentLng = lng;

  // First run: create the map
  if (!map) { initMap(lat, lng); }

  // Move marker
  marker.setLatLng([lat, lng]);
  marker.getPopup().setContent(
    `<b>📍 Patient Location</b><br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`
  );

  // Redraw accuracy circle
  if (accuracyCircle) map.removeLayer(accuracyCircle);
  accuracyCircle = L.circle([lat, lng], {
    radius:      accuracy,
    color:       '#1a56db',
    fillColor:   '#1a56db',
    fillOpacity: 0.08,
    weight:      1.5,
    dashArray:   '4 4'
  }).addTo(map);
}


/* ─────────────────────────────────────────
   START TRACKING  (called by "Fetch My Location" button)
───────────────────────────────────────── */
function startTracking() {
  if (!navigator.geolocation) {
    setStatus('error', '❌ Not Supported', 'Geolocation is not supported in this browser.');
    return;
  }

  // Disable button and show spinner
  const btn = document.getElementById('locBtn');
  btn.disabled = true;
  btn.innerHTML = `
    <svg class="spin" width="18" height="18" fill="none" stroke="currentColor"
         stroke-width="2.2" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
    Fetching Location...`;

  setStatus('loading', '🔍 Locating', 'Accessing GPS signal, please wait...');
  show('statusCard');

  // Clear any previous watch
  if (watchId) navigator.geolocation.clearWatch(watchId);

  // Start live GPS watch
  watchId = navigator.geolocation.watchPosition(
    onSuccess,
    onError,
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}


/* ─────────────────────────────────────────
   GPS SUCCESS CALLBACK
───────────────────────────────────────── */

/**
 * Fired each time the browser gets a new GPS position.
 * @param {GeolocationPosition} pos
 */
function onSuccess(pos) {
  const lat   = pos.coords.latitude;
  const lng   = pos.coords.longitude;
  const acc   = Math.round(pos.coords.accuracy);
  const speed = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : 0;
  const time  = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  updateCount++;

  // ── Update sidebar UI ──
  setStatus('success', '✅ Location Found', `Updated at ${time}`);

  document.getElementById('latVal').textContent        = lat.toFixed(6);
  document.getElementById('lngVal').textContent        = lng.toFixed(6);
  document.getElementById('accVal').textContent        = `±${acc} meters`;
  document.getElementById('updateCount').textContent   = `Update #${updateCount} · ${time}`;

  show('coordsGrid');
  show('accuracyRow');
  show('liveInfo');
  show('actionBtns');

  // Show speed badge only if moving
  if (speed > 0) {
    document.getElementById('speedVal').textContent = `${speed} km/h`;
    document.getElementById('speedBadge').classList.add('visible');
  }

  // Reset button to "Refresh" state
  const btn = document.getElementById('locBtn');
  btn.disabled = false;
  btn.innerHTML = `
    <svg width="18" height="18" fill="none" stroke="currentColor"
         stroke-width="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/>
    </svg>
    Refresh Location`;

  // ── Update map ──
  updateMap(lat, lng, acc);

  // Auto-centre and open popup on first fix only
  if (updateCount === 1) {
    map.setView([lat, lng], 16, { animate: true });
    marker.openPopup();
  }

  // ── Add to log ──
  addLog(
    `<svg width="14" height="14" fill="none" stroke="#1a56db" stroke-width="2"
          viewBox="0 0 24 24">
       <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
       <circle cx="12" cy="10" r="3"/>
     </svg>`,
    `Fix #${updateCount} — ±${acc}m accuracy`,
    `${lat.toFixed(4)}, ${lng.toFixed(4)} · ${time}`
  );
}


/* ─────────────────────────────────────────
   GPS ERROR CALLBACK
───────────────────────────────────────── */

/**
 * Fired when geolocation fails.
 * @param {GeolocationPositionError} err
 */
function onError(err) {
  let msg = 'Unable to retrieve location.';
  if (err.code === 1) msg = 'Permission denied. Please allow location access.';
  if (err.code === 2) msg = 'Position unavailable. Check GPS signal.';
  if (err.code === 3) msg = 'Request timed out. Try again.';

  setStatus('error', '❌ Error', msg);

  // Re-enable button
  const btn = document.getElementById('locBtn');
  btn.disabled = false;
  btn.innerHTML = `
    <svg width="18" height="18" fill="none" stroke="currentColor"
         stroke-width="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    </svg>
    Retry Location`;

  addLog('❌', 'GPS Error', msg + ' · ' + new Date().toLocaleTimeString());
}


/* ─────────────────────────────────────────
   STOP TRACKING  (called by "Stop" button)
───────────────────────────────────────── */
function stopTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  hide('liveInfo');
  document.getElementById('speedBadge').classList.remove('visible');
  setStatus('loading', 'ℹ️ Stopped', 'Live tracking has been stopped.');

  addLog('⏹️', 'Tracking stopped by user', new Date().toLocaleTimeString());

  // Reset button label
  document.getElementById('locBtn').innerHTML = `
    <svg width="18" height="18" fill="none" stroke="currentColor"
         stroke-width="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    </svg>
    Fetch My Location`;
}


/* ─────────────────────────────────────────
   CENTER MAP  (called by "Center" button)
───────────────────────────────────────── */
function centerMap() {
  if (map && marker) {
    map.flyTo(marker.getLatLng(), 16, { animate: true, duration: 1 });
  }
}


/* ─────────────────────────────────────────
   SHARE LOCATION  (called by "Share" button)
───────────────────────────────────────── */
function shareLocation() {
  if (!currentLat) {
    alert('Please fetch location first.');
    return;
  }

  const url = `https://www.google.com/maps?q=${currentLat},${currentLng}`;

  // Use native share sheet on mobile, else copy to clipboard
  if (navigator.share) {
    navigator.share({ title: 'MediCare Patient Location', url });
  } else {
    navigator.clipboard.writeText(url)
      .then(()  => alert('📍 Location link copied to clipboard!'))
      .catch(()  => prompt('Copy this link:', url));
  }
}


/* ─────────────────────────────────────────
   TOGGLE SATELLITE / STREET VIEW
───────────────────────────────────────── */
function toggleSatellite() {
  if (!map) return;

  isSatellite = !isSatellite;
  if (tileLayer) map.removeLayer(tileLayer);

  tileLayer = L.tileLayer(isSatellite ? TILE_SAT : TILE_STREET, {
    attribution: isSatellite ? 'Tiles © Esri' : '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Highlight the satellite button when active
  const satBtn = document.getElementById('satBtn');
  satBtn.style.background   = isSatellite ? '#1a56db' : '';
  satBtn.style.color        = isSatellite ? '#fff'    : '';
  satBtn.style.borderColor  = isSatellite ? '#1a56db' : '';
}


/* ─────────────────────────────────────────
   EMERGENCY CALL  (108)
───────────────────────────────────────── */
function callEmergency() {
  if (confirm('🚨 Call Emergency Helpline 108 now?')) {
    window.location.href = 'tel:108';
  }
}


/* ─────────────────────────────────────────
   NAVIGATE TO OTHER PAGES
───────────────────────────────────────── */
function goTo(page) {
  // Replace these with your actual page URLs
  const routes = {
    symptoms:  'symptoms.html',
    dashboard: 'dashboard.html'
  };
  if (routes[page]) window.location.href = routes[page];
}