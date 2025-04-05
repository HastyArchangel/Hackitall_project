// service-worker.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Service Worker received message:", message);
  
    switch (message.type) {
      case 'TOGGLE_SIMPLIFY':
        console.log(`Simplify feature ${message.enabled ? 'enabled' : 'disabled'}`);
        // --- Add your actual logic here ---
        // Example: Store the value again or trigger actions based on the toggle
        // Maybe inject/remove content scripts, enable/disable listeners, etc.
        chrome.storage.local.set({ isSimplifyActive: message.enabled }); // Example using local storage
        // Respond to popup (optional)
        sendResponse({ success: true, feature: 'simplify', state: message.enabled });
        break; // <- Important!
  
      case 'TOGGLE_TTS':
        console.log(`Text to Speech feature ${message.enabled ? 'enabled' : 'disabled'}`);
        // --- Add your actual logic here ---
        // Example: enable/disable TTS listeners or functionality
         chrome.storage.local.set({ isTTSActive: message.enabled }); // Example
        // Respond to popup (optional)
         sendResponse({ success: true, feature: 'tts', state: message.enabled });
         break; // <- Important!
  
      // Keep other message handlers if you have them
      // case 'POPUP_ACTION': ...
  
      default:
        console.log("Unknown message type received:", message.type);
        // Handle unknown messages or ignore
         sendResponse({ success: false, error: "Unknown message type" });
        break;
    }
  
    // Return true if you intend to send a response asynchronously
    // In this basic example, responses are synchronous, so it's not strictly needed
    // but good practice if any branch might become async later.
    // return true;
  });
  
  
  // Optional: Listen for storage changes if background logic depends on it directly
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
       console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
       );
  
       if (namespace === 'sync') { // Check if it's the sync storage we used
          if (key === 'simplifyEnabled') {
              console.log(`Background detected Simplify toggle changed to: ${newValue}`);
              // Update internal state or behavior based on the new value
          } else if (key === 'ttsEnabled') {
              console.log(`Background detected TTS toggle changed to: ${newValue}`);
               // Update internal state or behavior based on the new value
          }
       }
    }
  });
  
  
  console.log("Service worker started.");