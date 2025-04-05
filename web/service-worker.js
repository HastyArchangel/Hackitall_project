// service-worker.js (Background Script)

// Listen for commands defined in manifest.json
chrome.commands.onCommand.addListener((command, tab) => {
  console.log(`Service Worker: Command received: ${command}`);

  // Check which command was triggered
  if (command === "simplify-text" || command === "read-aloud") {
    // Ensure we have a valid tab context where the content script might be running
    if (tab && tab.id) {
        console.log(`Service Worker: Sending action "${command}" to tab ${tab.id}`);
        // Send a message to the content script in the active tab
        chrome.tabs.sendMessage(
            tab.id,
            { action: command }, // Send the command name as the action
            (response) => {
                // The response callback allows the content script to confirm receipt or report status
                if (chrome.runtime.lastError) {
                    // Common error: Content script not injected or not listening on that page/tab
                    console.warn(`Service Worker: Could not send message to tab ${tab.id} for action "${command}". Receiving end does not exist? Error: ${chrome.runtime.lastError.message}`);
                } else if (response) {
                    console.log(`Service Worker: Response from content script for action "${command}":`, response.status);
                } else {
                     console.log(`Service Worker: Message sent for action "${command}", but no response received (might be okay).`);
                }
            }
        );
    } else {
         console.warn(`Service Worker: Command "${command}" received but no active tab found or tab ID missing.`);
    }
  }
});

// Optional: Log installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`Service Worker: Extension ${details.reason}. Previous version: ${details.previousVersion}`);
});

// Optional: Keep alive slightly for message passing if needed, though usually not required for commands
// chrome.runtime.onConnect.addListener(port => {
//   console.log("Service Worker: Connection established", port);
// });