// popup/popup.js

const simplifyToggle = document.getElementById('simplify-toggle');
const ttsToggle = document.getElementById('tts-toggle');

// --- Load saved state when popup opens ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("Popup DOM loaded. Loading toggle states...");
  // Load Simplify toggle state
  chrome.storage.sync.get(['simplifyEnabled'], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading simplify state:", chrome.runtime.lastError);
    } else {
      console.log("Loaded simplifyEnabled:", result.simplifyEnabled);
      simplifyToggle.checked = !!result.simplifyEnabled; // Ensure boolean, default false
    }
  });

  // Load TTS toggle state
  chrome.storage.sync.get(['ttsEnabled'], (result) => {
     if (chrome.runtime.lastError) {
      console.error("Error loading TTS state:", chrome.runtime.lastError);
    } else {
      console.log("Loaded ttsEnabled:", result.ttsEnabled);
      ttsToggle.checked = !!result.ttsEnabled; // Ensure boolean, default false
    }
  });
});


// --- Event Listeners for Toggles ---

simplifyToggle.addEventListener('change', (event) => {
  const isEnabled = event.target.checked;
  console.log('Simplify Toggled:', isEnabled);
  // Save the state
  chrome.storage.sync.set({ simplifyEnabled: isEnabled }, () => {
     if (chrome.runtime.lastError) {
        console.error("Error saving simplify state:", chrome.runtime.lastError);
     } else {
        console.log('Simplify state saved.');
     }
  });
  // Send message to background/service worker
  chrome.runtime.sendMessage({ type: 'TOGGLE_SIMPLIFY', enabled: isEnabled });
});

ttsToggle.addEventListener('change', (event) => {
  const isEnabled = event.target.checked;
  console.log('TTS Toggled:', isEnabled);
  // Save the state
  chrome.storage.sync.set({ ttsEnabled: isEnabled }, () => {
     if (chrome.runtime.lastError) {
        console.error("Error saving TTS state:", chrome.runtime.lastError);
     } else {
        console.log('TTS state saved.');
     }
  });
  // Send message to background/service worker
  chrome.runtime.sendMessage({ type: 'TOGGLE_TTS', enabled: isEnabled });
});