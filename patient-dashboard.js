/* ═══════════════════════════════════════════════
   MediCare Hospital — patient-dashboard.js
   Handles: navigation, symptom checker,
            AI prediction, location, emergency
   ═══════════════════════════════════════════════ */

// patient-dashboard.js ke sabse upar add karo
const isLoggedIn = localStorage.getItem('patient_logged_in');
if (!isLoggedIn) {
  window.location.href = 'patient-login.html';
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
let locationSharing = true;
let lastPrediction  = null;

/* ════════════════════════════════════════════════
   SECTION NAVIGATION
   ════════════════════════════════════════════════ */
function showSection(name, linkEl) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
  });

  // Remove active from all nav items
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
  });

  // Show target section
  const target = document.getElementById('sec-' + name);
  if (target) target.classList.add('active');

  // Activate clicked nav item
  if (linkEl) linkEl.classList.add('active');

  // Update topbar title
  const titles = {
    overview:   'Overview',
    symptoms:   'Send Symptoms',
    'ai-result':'AI Results',
    reports:    'My Reports',
    location:   'Live Location',
    alerts:     'Alerts',
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[name] || name;

  // Close sidebar on mobile
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').style.transform = 'translateX(-100%)';
  }
}

/* ════════════════════════════════════════════════
   SIDEBAR TOGGLE (mobile)
   ════════════════════════════════════════════════ */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const isOpen = sb.style.transform !== 'translateX(-100%)';
  sb.style.transform = isOpen ? 'translateX(-100%)' : 'translateX(0)';
}

/* ════════════════════════════════════════════════
   SYMPTOM CHIP SELECTION
   ════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setupSymptomChips();
});

function setupSymptomChips() {
  document.querySelectorAll('.symptom-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      updateSelectedCount();
    });
  });
}

function updateSelectedCount() {
  const count = document.querySelectorAll('.symptom-chip.selected').length;
  const el = document.getElementById('selected-count');
  if (el) {
    el.textContent = count === 0
      ? '0 symptoms selected'
      : count + ' symptom' + (count > 1 ? 's' : '') + ' selected';
  }
}

function getSelectedSymptoms() {
  const selected = [];
  document.querySelectorAll('.symptom-chip.selected').forEach(chip => {
    const input = chip.querySelector('input');
    if (input) selected.push(input.value);
  });
  return selected;
}

/* ════════════════════════════════════════════════
   AI SYMPTOM ANALYSIS — calls Anthropic API
   ════════════════════════════════════════════════ */
async function analyzeSymptoms() {
  const symptoms = getSelectedSymptoms();

  if (symptoms.length === 0) {
    alert('Please select at least one symptom before analyzing.');
    return;
  }

  // Show loading state
  const btn     = document.getElementById('analyze-btn');
  const btnText = document.getElementById('analyze-text');
  const spin    = document.getElementById('analyze-spin');

  btn.disabled        = true;
  btnText.textContent = 'Analyzing...';
  spin.classList.remove('hidden');

  const prompt = `You are a clinical AI assistant in a hospital dashboard. A patient named Ravi Kumar presents with these symptoms: ${symptoms.join(', ')}.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "severity_score": <number 0-100>,
  "severity_level": "<Low|Moderate|High|Critical>",
  "primary_diagnosis": "<disease name>",
  "summary": "<1-2 sentence clinical summary>",
  "doctor_type": "<specialist type>",
  "conditions": [
    {"name":"<condition>","probability":<0-100>},
    {"name":"<condition>","probability":<0-100>},
    {"name":"<condition>","probability":<0-100>}
  ],
  "recommendation": "<clear 2-sentence recommendation for the doctor>"
}`;

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data   = await res.json();
    const raw    = data.content.map(c => c.text || '').join('');
    const clean  = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    lastPrediction = result;
    displayAIResult(result, symptoms);

    // Auto navigate to AI Results section
    showSection('ai-result', document.querySelector('[onclick*="ai-result"]'));

  } catch (err) {
    console.error('AI Error:', err);
    document.getElementById('ai-result-body').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-text">Analysis failed. Please check your connection and try again.</div>
      </div>`;
    showSection('ai-result', document.querySelector('[onclick*="ai-result"]'));
  } finally {
    btn.disabled        = false;
    btnText.textContent = '⚡ Analyze with AI';
    spin.classList.add('hidden');
  }
}

/* ════════════════════════════════════════════════
   DISPLAY AI RESULT
   ════════════════════════════════════════════════ */
function displayAIResult(r, symptoms) {
  const score     = Math.min(100, Math.max(0, r.severity_score || 0));
  const level     = (r.severity_level || 'Low').toLowerCase();

  // Severity colour map
  const colorMap = {
    low:      '#4ade80',
    moderate: '#f59e0b',
    high:     '#f97316',
    critical: '#f87171',
  };
  const sevColor = colorMap[level] || '#4ade80';

  // Conditions HTML
  const condHTML = (r.conditions || []).map((c, i) => `
    <div class="condition-row ${i === 0 ? 'top' : ''}">
      <span class="condition-name">${c.name}</span>
      <div class="prob-bar"><div class="prob-fill" style="width:${c.probability}%"></div></div>
      <span class="prob-pct">${c.probability}%</span>
    </div>`).join('');

  document.getElementById('ai-result-body').innerHTML = `
    <div class="ai-result-card">
      <div class="ai-result-disease">${r.primary_diagnosis || 'Unknown'}</div>
      <div class="ai-result-sub">Recommended specialist: <strong style="color:#38bdf8">${r.doctor_type || 'General Physician'}</strong></div>

      <div class="sev-bar-wrap">
        <div class="sev-bar-label">
          <span>Severity Index</span>
          <span style="color:${sevColor};font-weight:600">${r.severity_level} — ${score}/100</span>
        </div>
        <div class="sev-track">
          <div class="sev-fill" style="width:${score}%;background:${sevColor}"></div>
        </div>
        <div class="sev-ticks">
          <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
        </div>
      </div>

      <div class="card-title">Possible Conditions</div>
      <div class="conditions-list" style="margin-bottom:16px">${condHTML}</div>

      <div class="ai-rec">
        <strong>AI Recommendation:</strong> ${r.recommendation || ''}
      </div>

      <div style="margin-top:16px;font-size:12px;color:var(--muted)">
        Symptoms analyzed: ${symptoms.join(', ')}
      </div>
    </div>`;

  // Also update overview card
  updateOverviewCard(r, score, level, sevColor);
}

/* ════════════════════════════════════════════════
   UPDATE OVERVIEW AFTER NEW PREDICTION
   ════════════════════════════════════════════════ */
function updateOverviewCard(r, score, level, sevColor) {
  // Update stat cards
  const statCards = document.querySelectorAll('.stat-card');
  if (statCards[0]) {
    statCards[0].querySelector('.stat-value').textContent = r.primary_diagnosis;
    statCards[0].querySelector('.stat-meta').textContent  = 'Just now';
  }
  if (statCards[1]) {
    const valEl = statCards[1].querySelector('.stat-value');
    valEl.textContent  = r.severity_level;
    valEl.style.color  = sevColor;
    statCards[1].querySelector('.stat-meta').textContent = `Score: ${score} / 100`;
  }

  // Update diagnosis in overview
  const diagEl = document.querySelector('.diagnosis-name');
  if (diagEl) diagEl.textContent = r.primary_diagnosis;

  const diagSub = document.querySelector('.diagnosis-sub');
  if (diagSub) diagSub.textContent = `Recommended: ${r.doctor_type}`;

  // Update severity bar in overview
  const sevFill = document.querySelector('.sev-fill');
  if (sevFill) {
    sevFill.style.width      = score + '%';
    sevFill.style.background = sevColor;
    sevFill.className        = 'sev-fill';
  }

  const sevText = document.querySelector('.sev-text');
  if (sevText) {
    sevText.textContent  = `${r.severity_level} — ${score}`;
    sevText.style.color  = sevColor;
  }
}

/* ════════════════════════════════════════════════
   LIVE LOCATION TOGGLE
   ════════════════════════════════════════════════ */
function toggleLocation() {
  locationSharing = !locationSharing;

  const dot  = document.querySelector('.loc-dot');
  const text = document.getElementById('loc-text');
  const btn  = document.querySelector('.location-btns .qbtn.teal');

  if (locationSharing) {
    dot.className        = 'loc-dot sharing';
    text.textContent     = 'Location sharing — Active';
    if (btn) btn.textContent = '📍 Stop Sharing';
  } else {
    dot.className        = 'loc-dot stopped';
    text.textContent     = 'Location sharing — Stopped';
    text.style.color     = 'var(--red-l)';
    if (btn) btn.textContent = '📍 Start Sharing';
  }
}

function updateLocation() {
  const coordEl = document.querySelector('.map-coords');
  // Simulate slight GPS movement
  const lat = (23.2599 + (Math.random() - 0.5) * 0.001).toFixed(4);
  const lng = (77.4126 + (Math.random() - 0.5) * 0.001).toFixed(4);
  if (coordEl) coordEl.textContent = `${lat}° N, ${lng}° E`;

  const accEl = document.querySelector('.map-accuracy');
  if (accEl) accEl.textContent = `Accuracy: ±${Math.floor(Math.random() * 8 + 5)} meters`;
}

/* ════════════════════════════════════════════════
   EMERGENCY ALERT
   ════════════════════════════════════════════════ */
function triggerEmergency() {
  document.getElementById('emergency-modal').classList.remove('hidden');

  // Auto-close after 6 seconds
  setTimeout(closeModal, 6000);
}

function closeModal() {
  document.getElementById('emergency-modal').classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('emergency-modal');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  }
});