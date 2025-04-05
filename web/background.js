// background.js (Service Worker)

// Listen for commands defined in manifest.json
chrome.commands.onCommand.addListener((command, tab) => {
    console.log(`Background Script: Command received: ${command}`);
  
    // Check which command was triggered
    if (command === "simplify-text" || command === "read-aloud") {
      // Ensure we have a valid tab context where the content script might be running
      if (tab && tab.id) {
          console.log(`Background Script: Sending action "${command}" to tab ${tab.id}`);
          // Send a message to the content script in the active tab
          chrome.tabs.sendMessage(
              tab.id,
              { action: command }, // Send the command name as the action
              (response) => {
                  // The response callback allows the content script to confirm receipt or report status
                  if (chrome.runtime.lastError) {
                      // Common error: Content script not injected or not listening on that page/tab
                      console.warn(`Background Script: Could not send message to tab ${tab.id} for action "${command}". Receiving end does not exist? Error: ${chrome.runtime.lastError.message}`);
                  } else if (response) {
                      console.log(`Background Script: Response from content script for action "${command}":`, response.status);
                  } else {
                       console.log(`Background Script: Message sent for action "${command}", but no response received (might be okay).`);
                  }
              }
          );
      } else {
           console.warn(`Background Script: Command "${command}" received but no active tab found or tab ID missing.`);
      }
    }
  });
  
  // Optional: Log installation/update
  chrome.runtime.onInstalled.addListener((details) => {
    console.log(`Background Script: Extension ${details.reason}. Previous version: ${details.previousVersion}`);
  });