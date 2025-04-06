// --- Global Variables ---
let apiPopup = null;            // Reference to the simplification result popup
let actionButtonContainer = null; // Reference to the container holding the action buttons
let currentPreloadPromise = null;// Promise for the preloaded API call
let currentSelectedText = null; // Currently selected text to avoid re-triggering
let currentReformulatedText = null; // Store reformulated text for feedback
let utterance = null;           // To hold the current speech utterance
const greenColor = '#28a745';

// <<< Variables to hold toggle states >>>
let simplifyFeatureEnabled = true; // Default state
let ttsFeatureEnabled = true;      // Default state


// --- Initial State Loading & Listener ---

// Function to load initial states from storage
function loadInitialToggleStates() {
    // Check if chrome.storage is available (it might not be on certain pages)
    if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['simplifyEnabled', 'ttsEnabled'], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Content Script: Error loading toggle states:", chrome.runtime.lastError.message);
                // Keep defaults if error occurs
            } else {
                // Use saved value if it exists (and is boolean), otherwise keep the default
                simplifyFeatureEnabled = (typeof result.simplifyEnabled === 'boolean') ? result.simplifyEnabled : simplifyFeatureEnabled;
                ttsFeatureEnabled      = (typeof result.ttsEnabled      === 'boolean') ? result.ttsEnabled      : ttsFeatureEnabled;
                console.log(`Content Script: Initial states loaded - Simplify: ${simplifyFeatureEnabled}, TTS: ${ttsFeatureEnabled}`);
            }
        });
    } else {
        console.warn("Content Script: chrome.storage.sync not available on this page. Using default toggle states.");
    }
}

// Listen for changes made via the popup
if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
            let updated = false;
            if (changes.simplifyEnabled) {
                simplifyFeatureEnabled = !!changes.simplifyEnabled.newValue; // Ensure boolean
                console.log(`Content Script: Simplify toggle changed to: ${simplifyFeatureEnabled}`);
                updated = true;
            }
            if (changes.ttsEnabled) {
                ttsFeatureEnabled = !!changes.ttsEnabled.newValue; // Ensure boolean
                console.log(`Content Script: TTS toggle changed to: ${ttsFeatureEnabled}`);
                updated = true;
            }
            // Optionally remove buttons immediately if state changes while they are visible
            // if (updated && actionButtonContainer) { removeButtonContainer(); }
        }
    });
}

// Load the initial states when the script loads
loadInitialToggleStates();


// --- Cleanup Functions ---

// Remove the result popup if it exists
function removePopup() {
    if (apiPopup && apiPopup.parentNode) {
        apiPopup.parentNode.removeChild(apiPopup);
        apiPopup = null;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
}

// Remove the action button container if it exists
function removeButtonContainer() {
    if (actionButtonContainer && actionButtonContainer.parentNode) {
        actionButtonContainer.parentNode.removeChild(actionButtonContainer);
        actionButtonContainer = null;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
}

// --- UI Creation Functions ---

// Show popup with the simplification result
function showPopup(textDataPromise, selectionCenterX, bottomY) {
    console.log("🚀 showPopup called");
    removePopup();

    apiPopup = document.createElement('div');
    apiPopup.id = 'local-api-response-popup';
    currentReformulatedText = null;

    const popupWidth = 500;
    const leftX = selectionCenterX - popupWidth / 2;
    const topY = bottomY + 20;

    // Styles... (assuming no change)
    Object.assign(apiPopup.style, {
        position: 'absolute', left: `${leftX}px`, top: `${topY}px`, zIndex: 9999,
        maxWidth: `${popupWidth}px`, backgroundColor: '#f5f5f5', border: '2px solid #28a745',
        borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', fontSize: '16px',
        lineHeight: '1.6', color: '#212529', overflowWrap: 'break-word',
        fontFamily: 'sans-serif', userSelect: 'none'
    });

    // Header bar... (assuming no change)
    const headerBar = document.createElement('div');
    Object.assign(headerBar.style, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px',
        borderBottom: '1px solid #ddd', fontSize: '14px', backgroundColor: '#e9fbe9',
        borderTopLeftRadius: '10px', borderTopRightRadius: '10px'
    });
    const copyButton = document.createElement('span'); copyButton.textContent = '📋'; copyButton.title = 'Copy simplified text';
    Object.assign(copyButton.style, { cursor: 'pointer', userSelect: 'auto' });
    const infoButton = document.createElement('span'); infoButton.textContent = 'ℹ️'; infoButton.title = 'Simplification Info';
    Object.assign(infoButton.style, { marginRight: '8px', cursor: 'pointer', position: 'relative', userSelect: 'auto' });
    const tooltip = document.createElement('div'); tooltip.textContent = '';
    Object.assign(tooltip.style, { visibility: 'hidden', backgroundColor: '#333', color: '#fff', textAlign: 'center', borderRadius: '4px', padding: '4px 8px', position: 'absolute', bottom: '125%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', zIndex: '99999', fontSize: '12px', opacity: 0, transition: 'opacity 0.3s' });
    infoButton.appendChild(tooltip);
    infoButton.addEventListener('mouseenter', () => { tooltip.style.visibility = 'visible'; tooltip.style.opacity = '1'; });
    infoButton.addEventListener('mouseleave', () => { tooltip.style.visibility = 'hidden'; tooltip.style.opacity = '0'; });
    const closeButton = document.createElement('span'); closeButton.textContent = '✖'; closeButton.title = 'Close';
    Object.assign(closeButton.style, { cursor: 'pointer', fontWeight: 'bold', userSelect: 'auto' });
    closeButton.onclick = removePopup;
    const leftWrapper = document.createElement('div'); leftWrapper.appendChild(copyButton);
    const rightWrapper = document.createElement('div'); rightWrapper.style.display = 'flex'; rightWrapper.style.gap = '8px';
    rightWrapper.appendChild(infoButton); rightWrapper.appendChild(closeButton);
    headerBar.appendChild(leftWrapper); headerBar.appendChild(rightWrapper);

    // Content area... (assuming no change)
    const content = document.createElement('div');
    content.textContent = 'Loading...';
    Object.assign(content.style, { padding: '14px 18px' });

    // Footer Bar... (assuming no change)
    const footerBar = document.createElement('div');
    Object.assign(footerBar.style, { display: 'flex', justifyContent: 'flex-start', padding: '8px 18px', borderTop: '1px solid #ddd', marginTop: '5px' });

    // Assemble popup
    apiPopup.appendChild(headerBar);
    apiPopup.appendChild(content);
    apiPopup.appendChild(footerBar);
    document.body.appendChild(apiPopup);

    // Load API data... (assuming no change)
    textDataPromise
        .then(function(data) {
            if (!apiPopup) return;
            if (data && data.status === "SUCCESS") {
                currentReformulatedText = data.reformulated_text || 'No reformulated text received.';
                let original_score = parseFloat(data.original_score) || 0;
                let simplified_score = parseFloat(data.simplified_score) || 0;
                let difficultyDrop = 'N/A';
                 if (!isNaN(original_score) && !isNaN(simplified_score) && original_score !== 0) {
                     difficultyDrop = ((1 - simplified_score / original_score) * 100).toFixed(1);
                 }
                content.textContent = currentReformulatedText;
                tooltip.textContent = `Reading difficulty decreased by ${difficultyDrop}%`;
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(currentReformulatedText).then(() => { copyButton.textContent = '✅'; setTimeout(() => { copyButton.textContent = '📋'; }, 1000); }).catch(err => console.error('Copy failed:', err));
                };
                addFeedbackButtons(footerBar);
            } else {
                const failureMsg = data?.message || 'Simplification failed or returned unexpected status.';
                content.textContent = `Info: ${failureMsg}`;
                content.style.backgroundColor = '#fff3cd';
                tooltip.textContent = `Simplification unsuccessful`;
            }
        })
        .catch(function(error) {
             if (!apiPopup) return;
             if (content) { content.textContent = `Error loading simplification: ${error.message}`; content.style.backgroundColor = '#ffdddd'; }
             tooltip.textContent = `Error loading data`;
        });
}

// Function to add feedback buttons to the footer
function addFeedbackButtons(footerElement) {
    footerElement.innerHTML = '';
    const feedbackInstructions = document.createElement('span');
    feedbackInstructions.textContent = 'Rate this simplification:';
    Object.assign(feedbackInstructions.style, { marginRight: '10px', fontSize: '13px', color: '#6c757d', alignSelf: 'center' });
    const likeButton = document.createElement('button');
    likeButton.textContent = '👍'; likeButton.title = 'Good simplification';
    Object.assign(likeButton.style, { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 5px', marginRight: '5px' });
    const dislikeButton = document.createElement('button');
    dislikeButton.textContent = '👎'; dislikeButton.title = 'Bad simplification';
    Object.assign(dislikeButton.style, { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 5px' });
    const feedbackHandler = (feedbackType) => {
        handleFeedback(feedbackType);
        likeButton.disabled = true; dislikeButton.disabled = true;
        likeButton.style.opacity = '0.5'; dislikeButton.style.opacity = '0.5';
        likeButton.style.cursor = 'default'; dislikeButton.style.cursor = 'default';
        if (feedbackType === 'like') { likeButton.style.opacity = '1'; likeButton.style.transform = 'scale(1.1)'; }
        else { dislikeButton.style.opacity = '1'; dislikeButton.style.transform = 'scale(1.1)'; }
        feedbackInstructions.textContent = 'Thanks for feedback!';
    };
    likeButton.onclick = () => feedbackHandler('like');
    dislikeButton.onclick = () => feedbackHandler('dislike');
    footerElement.appendChild(feedbackInstructions);
    footerElement.appendChild(likeButton);
    footerElement.appendChild(dislikeButton);
}

// Placeholder function to handle the feedback
function handleFeedback(feedbackType) {
    console.log(`Feedback Received: ${feedbackType}`);
    console.log("Original Text:", currentSelectedText);
    console.log("Reformulated Text:", currentReformulatedText);
    // TODO: Send feedback to backend
}

// Call your Flask API (preloading)
// *** Make sure this endpoint ('/simplify' or '/process') matches your Flask app! ***
async function callLocalApi(selectedText) {
    // Check if the feature is enabled *before* making the call
    if (!simplifyFeatureEnabled) {
        console.log("API call skipped: Simplify feature is disabled.");
        // Return a promise that resolves to a failure-like state
        // so the .then() block in showPopup can handle it gracefully
        return Promise.resolve({ status: "DISABLED", message: "Simplification feature is currently disabled." });
    }

    const apiUrl = 'http://localhost:5000/simplify'; // CHECK THIS ENDPOINT NAME

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: selectedText })
        });
        const responseData = await response.json(); // Try parsing JSON regardless of status
        if (!response.ok) {
            const errorMessage = responseData?.message || responseData?.error || JSON.stringify(responseData) || response.statusText;
            console.error(`API Error Response (${response.status}):`, responseData);
            // Return status failure so popup shows info, not generic error
            return { status: "FAILURE", message: `API Error (${response.status}): ${errorMessage}` };
            // throw new Error(`API Error (${response.status}): ${errorMessage}`); // Old way
        }
        console.log(`✅ API Success Response (${response.status})`);
        return responseData; // Return the parsed JSON { status, reformulated_text, ... }

    } catch (error) {
        console.error("API Fetch/Processing Error:", error);
        let userMessage = `An unexpected error occurred: ${error.message}`;
        if (error.message.includes("Failed to fetch")) {
             userMessage = "Network error: Could not connect to API. Is server running & CORS ok?";
        } else if (error instanceof SyntaxError) {
             userMessage = "API response format error: Expected JSON.";
        }
         // Return status failure so popup shows info, not generic error
        return { status: "FAILURE", message: userMessage };
        // throw new Error(userMessage); // Old way
    }
}

// Function to speak text using Web Speech API
function speakText(textToSpeak) {
    // Check if TTS feature is enabled
    if (!ttsFeatureEnabled) {
        console.log("Speak text skipped: TTS feature is disabled.");
        alert("Text-to-Speech feature is currently disabled in the extension settings.");
        return;
    }

    if (!textToSpeak) { console.warn("No text provided to speak."); return; }
    if (!('speechSynthesis' in window)) { alert("Sorry, your browser doesn't support Text-to-Speech."); return; }

    if (window.speechSynthesis.speaking) {
        console.log("Cancelling previous speech...");
        window.speechSynthesis.cancel();
        setTimeout(() => { proceedWithSpeech(textToSpeak); }, 50);
    } else {
        proceedWithSpeech(textToSpeak);
    }
}

// Helper for speakText
function proceedWithSpeech(textToSpeak) {
    console.log("🗣️ Speaking:", textToSpeak.substring(0, 50) + "...");
    utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onerror = (event) => { console.error("Speech synthesis error:", event.error); utterance = null; };
    utterance.onend = () => { console.log("Speech finished."); utterance = null; };
    window.speechSynthesis.speak(utterance);
}

// Show the floating action buttons based on toggle state
function showActionButtons(buttonX, buttonY, selectedText, selectionCenterX, selectionBottomY) {
    removePopup();
    removeButtonContainer();

    if (!selectedText) { console.warn("⚠️ No selected text provided to showActionButtons."); return; }
    if (!simplifyFeatureEnabled && !ttsFeatureEnabled) { console.log("📌 Both features disabled. Not showing buttons."); return; }

    console.log(`📌 Showing action buttons container (Simplify: ${simplifyFeatureEnabled}, TTS: ${ttsFeatureEnabled})`);

    actionButtonContainer = document.createElement('div');
    Object.assign(actionButtonContainer.style, { position: 'absolute', left: `${buttonX}px`, top: `${buttonY}px`, zIndex: 9998, display: 'flex', gap: '5px' });

    let buttonsAdded = 0;

    if (simplifyFeatureEnabled) {
        const simplifyButton = document.createElement('button');
        simplifyButton.textContent = "Simplify"; simplifyButton.title = "Simplify selected text";
        Object.assign(simplifyButton.style, { padding: '6px 10px', backgroundColor: greenColor, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)', fontSize: '14px', fontFamily: 'sans-serif', lineHeight: '1' });
        simplifyButton.addEventListener('click', (e) => {
            e.stopPropagation(); console.log("🟢 Simplify button clicked");
            // Use the preloaded promise (will be null if simplify was off during mouseup)
            // If it's null, callLocalApi again here? Or rely on preload check?
            // Let's re-call if promise is null, ensures it works even if toggle changed between mouseup/click
            const promiseToUse = currentPreloadPromise || callLocalApi(currentSelectedText);
            showPopup(promiseToUse, selectionCenterX, selectionBottomY);
            removeButtonContainer();
        });
        actionButtonContainer.appendChild(simplifyButton);
        buttonsAdded++;
    }

    if (ttsFeatureEnabled) {
        const readAloudButton = document.createElement('button');
        readAloudButton.textContent = "🔊"; readAloudButton.title = "Read selected text aloud";
        Object.assign(readAloudButton.style, { padding: '6px 8px', fontSize: '18px', backgroundColor: greenColor, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)', fontSize: '14px', fontFamily: 'sans-serif', lineHeight: '1' });
        readAloudButton.addEventListener('click', (e) => {
            e.stopPropagation(); console.log("🔊 Read Aloud button clicked");
            speakText(currentSelectedText); // speakText already checks ttsFeatureEnabled
        });
        actionButtonContainer.appendChild(readAloudButton);
        buttonsAdded++;
    }

    if (buttonsAdded > 0) { document.body.appendChild(actionButtonContainer); }
    else { actionButtonContainer = null; }
}


// --- Event Listeners ---

// Main listener for text selection (mouseup)
document.addEventListener('mouseup', (event) => {
    if ((actionButtonContainer && actionButtonContainer.contains(event.target)) || (apiPopup && apiPopup.contains(event.target))) { return; }

    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0 && selectedText !== currentSelectedText) {
             if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }

            const range = selection.getRangeAt(0);
            const startRange = range.cloneRange(); startRange.collapse(true);
            const startRect = startRange.getBoundingClientRect();
            const fullRect = range.getBoundingClientRect();
            const buttonContainerX = window.scrollX + startRect.left - 2;
            const buttonContainerY = window.scrollY + startRect.top - 35;
            const centerX = window.scrollX + (fullRect.left + fullRect.right) / 2;
            const bottomY = window.scrollY + fullRect.bottom;

            console.log("🖱️ Selected:", selectedText.substring(0, 50) + "...");
            currentSelectedText = selectedText;

            // Preload API only if simplify is enabled
            if (simplifyFeatureEnabled) {
                 currentPreloadPromise = callLocalApi(selectedText);
                 currentPreloadPromise.catch(err => console.warn("Preload API call failed:", err.message));
            } else {
                currentPreloadPromise = null;
            }

            // Show buttons (function now checks toggles)
            showActionButtons(buttonContainerX, buttonContainerY, selectedText, centerX, bottomY);
        } else if (selectedText.length === 0 && currentSelectedText !== null) {
             console.log("🚫 Selection cleared.");
            removePopup(); removeButtonContainer();
            currentSelectedText = null; currentPreloadPromise = null;
             if (window.speechSynthesis && window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); }
        }
    }, 10);
});

// Cleanup on outside click (mousedown)
document.addEventListener('mousedown', (event) => {
    const clickedOutsidePopup = !apiPopup || (apiPopup && !apiPopup.contains(event.target));
    const clickedOutsideButtons = !actionButtonContainer || (actionButtonContainer && !actionButtonContainer.contains(event.target));
    if ((apiPopup || actionButtonContainer) && clickedOutsidePopup && clickedOutsideButtons) {
         console.log("🖱️ Clicked outside UI elements, cleaning up.");
         removePopup(); removeButtonContainer();
         currentSelectedText = null; currentPreloadPromise = null;
    }
});


// --- <<< ADDED: Message Listener for Background Script Commands >>> ---
if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("✉️ Content Script: Message received from background:", message);

        if (message.action === "simplify-text") {
            // --- Check Feature Toggle ---
            if (!simplifyFeatureEnabled) {
                console.log("⌨️ Shortcut: Simplify Text action skipped - feature disabled.");
                // Maybe alert the user?
                alert("Simplification feature is currently disabled in the extension settings.");
                sendResponse({ status: "Skipped: Simplify disabled" });
                return true; // Indicate async (even though we didn't do much)
            }

            const textToSimplify = window.getSelection().toString().trim();
            if (textToSimplify.length > 0) {
                console.log("⌨️ Shortcut: Simplify Text action triggered for:", textToSimplify.substring(0, 50) + "...");

                // Calculate coordinates for the popup
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const fullRect = range.getBoundingClientRect();
                const centerX = window.scrollX + (fullRect.left + fullRect.right) / 2;
                const bottomY = window.scrollY + fullRect.bottom;

                // Initiate API call (callLocalApi already checks toggle, but good to double check here)
                const apiPromise = callLocalApi(textToSimplify);

                // Show the popup
                showPopup(apiPromise, centerX, bottomY);
                // Clean up the action buttons if they were visible
                removeButtonContainer();
                // Update state
                currentSelectedText = textToSimplify;
                currentPreloadPromise = apiPromise; // Store the new promise

                sendResponse({ status: "Simplify action initiated" });
            } else {
                console.log("⌨️ Shortcut: Simplify Text action triggered, but no text selected.");
                sendResponse({ status: "No text selected" });
            }
            return true; // Indicate potential async response

        } else if (message.action === "read-aloud") {
            // --- Check Feature Toggle ---
             // Note: speakText function *also* checks the toggle, providing double safety
             if (!ttsFeatureEnabled) {
                console.log("⌨️ Shortcut: Read Aloud action skipped - feature disabled.");
                alert("Text-to-Speech feature is currently disabled in the extension settings.");
                sendResponse({ status: "Skipped: TTS disabled" });
                return true;
            }

            const textToRead = window.getSelection().toString().trim();
            if (textToRead.length > 0) {
                console.log("⌨️ Shortcut: Read Aloud action triggered for:", textToRead.substring(0, 50) + "...");
                speakText(textToRead); // This function now internally checks ttsFeatureEnabled too
                // Update state maybe?
                currentSelectedText = textToRead;
                sendResponse({ status: "Read Aloud action initiated" });
            } else {
                console.log("⌨️ Shortcut: Read Aloud action triggered, but no text selected.");
                sendResponse({ status: "No text selected" });
            }
            return true; // Indicate potential async response
        }

        // Handle other potential messages if needed
        console.warn("Content Script: Received unknown message action:", message?.action);
        return false; // No async response intended for unknown actions
    });
} else {
     console.warn("Content Script: chrome.runtime.onMessage not available. Shortcut messages cannot be received.");
}
// --- <<< END of Message Listener >>> ---


console.log("✅ Local API Text Simplifier Extension Loaded (with Toggles, TTS, Feedback & Shortcuts).");