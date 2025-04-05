// background.js (Service Worker)

// Listen for commands defined in manifest.json
chrome.commands.onCommand.addListener((command, tab) => {
    console.log(`Command received: ${command}`);
  
    // Check which command was triggered
    if (command === "simplify-text" || command === "read-aloud") {
      // Ensure we have a valid tab context
      if (tab && tab.id) {
          console.log(`Sending action "${command}" to tab ${tab.id}`);
          // Send a message to the content script in the active tab
          chrome.tabs.sendMessage(
              tab.id,
              { action: command }, // Send the command name as the action
              (response) => {
                  if (chrome.runtime.lastError) {
                      // Handle cases where the content script isn't ready or injected
                      console.warn(`Could not send message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                      // You might want to try injecting the script here if appropriate,
                      // but for shortcuts on selected text, the script should ideally already be there.
                  } else {
                      console.log(`Message sent to tab ${tab.id}, response:`, response);
                  }
              }
          );
      } else {
           console.warn("Command received but no active tab found.");
      }
    }
  });
  
  // Optional: Log when the extension is installed or updated
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Text Simplifier extension installed/updated.');
  });