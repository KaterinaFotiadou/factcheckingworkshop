function renderResult(entry, notFoundText) {
  const banner = document.getElementById('verdictBanner');
  const sourcesList = document.getElementById('sourcesList');
  sourcesList.innerHTML = '';

  if (!entry) {
    banner.className = 'verdict-banner verdict-mixed';
    banner.innerHTML = `<span>No example data for "${notFoundText}". Try one of the examples above.</span>`;
    document.getElementById('result').style.display = 'block';
    return;
  }

  const verdictConfig = {
    agree: { cls: 'verdict-agree', text: '✓ Sources confirm this claim' },
    disagree: { cls: 'verdict-disagree', text: '⚠ Sources contradict this claim' },
    mixed: { cls: 'verdict-mixed', text: '? Sources disagree with each other' }
  };
  const v = verdictConfig[entry.verdict];
  banner.className = 'verdict-banner ' + v.cls;
  banner.innerHTML = `<span>${v.text}</span>`;

  const stanceLabels = { confirms: 'Confirms', refutes: 'Refutes', partial: 'Partial' };
  const stanceClass = { confirms: 'stance-confirms', refutes: 'stance-refutes', partial: 'stance-partial' };

  entry.sources.forEach(s => {
    const card = document.createElement('div');
    card.className = 'source-card';
    const nameHtml = s.url
      ? `<a href="${s.url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">${s.name}</a>`
      : s.name;
    card.innerHTML = `
      <div class="name">${nameHtml}</div>
      <div class="stance ${stanceClass[s.stance] || 'stance-partial'}">${stanceLabels[s.stance] || 'Partial'}</div>
      <div class="snippet">${s.snippet}</div>
    `;
    sourcesList.appendChild(card);
  });

  document.getElementById('result').style.display = 'block';
}

function checkClaim(text) {
  document.getElementById('result').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  document.getElementById('loading').textContent = 'Searching sources…';

  chrome.runtime.sendMessage({ type: 'CHECK_CLAIM_LIVE', claim: text }, (response) => {
    document.getElementById('loading').style.display = 'none';

    if (response && response.success && response.data && response.data.sources) {
      // Real result received from the backend
      renderResult(response.data, text);
    } else {
      // Backend unreachable (no internet, not deployed yet, etc.)
      // fall back to the local demo data
      const fallback = findClaim(text);
      renderResult(fallback, text);
    }
  });
}

document.getElementById('checkBtn').addEventListener('click', () => {
  const text = document.getElementById('claimInput').value.trim();
  if (text) checkClaim(text);
});

document.getElementById('claimInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('checkBtn').click();
});

document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    const claim = btn.dataset.claim;
    document.getElementById('claimInput').value = claim;
    // Demo buttons always show the prepared, clean example data —
    // not the live search, so the demo stays predictable.
    document.getElementById('loading').style.display = 'none';
    renderResult(findClaim(claim), claim);
  });
});

// If the popup was opened via the right-click context menu (selected text),
// the text is waiting in chrome.storage.local pick it up automatically.
chrome.storage.local.get('pendingClaim', (data) => {
  if (data.pendingClaim) {
    document.getElementById('claimInput').value = data.pendingClaim;
    checkClaim(data.pendingClaim);
    chrome.storage.local.remove('pendingClaim');
    chrome.action.setBadgeText({ text: '' });
  }
});