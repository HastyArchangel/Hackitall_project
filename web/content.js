// --- Global Variables ---
let apiPopup = null;            // Reference to the simplification result popup
let actionButtonContainer = null; // << NEW: Container for BOTH buttons
let currentPreloadPromise = null;// Promise for the preloaded API call
let currentSelectedText = null; // Currently selected text to avoid re-triggering
let utterance = null;           // To hold the current speech utterance

// --- Cleanup Functions ---

// Remove the result popup if it exists
function removePopup() {
    if (apiPopup && apiPopup.parentNode) {
        apiPopup.parentNode.removeChild(apiPopup);
        apiPopup = null;
    }
    // Stop any ongoing speech when popup is removed (good practice)
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}

// << MODIFIED: Remove the action button CONTAINER >>
function removeButtonContainer() {
    if (actionButtonContainer && actionButtonContainer.parentNode) {
        actionButtonContainer.parentNode.removeChild(actionButtonContainer);
        actionButtonContainer = null; // Clear the reference to the container
    }
    // Also stop speech if buttons are removed
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}

// --- UI Creation Functions ---

// Show popup with the simplification result (NO CHANGES HERE)
function showPopup(textPromise, selectionCenterX, bottomY) {
    console.log("🚀 showPopup called"); // Using the promise now
    removePopup();

    apiPopup = document.createElement('div');
    apiPopup.id = 'local-api-response-popup';

    const popupWidth = 500;
    const leftX = selectionCenterX - popupWidth / 2;
    const topY = bottomY + 20;

    // Popup container styles (NO CHANGES)
    Object.assign(apiPopup.style, {
        position: 'absolute', left: `${leftX}px`, top: `${topY}px`, zIndex: 9999,
        maxWidth: `${popupWidth}px`, backgroundColor: '#f5f5f5', border: '2px solid #28a745',
        borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', fontSize: '16px',
        lineHeight: '1.6', color: '#212529', overflowWrap: 'break-word',
        fontFamily: 'sans-serif', userSelect: 'none'
    });

    // Header bar (NO CHANGES)
    const headerBar = document.createElement('div');
    Object.assign(headerBar.style, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 10px', borderBottom: '1px solid #ddd', fontSize: '14px',
        backgroundColor: '#e9fbe9', borderTopLeftRadius: '10px', borderTopRightRadius: '10px'
    });
    const copyButton = document.createElement('span'); copyButton.textContent = '📋'; copyButton.title = 'Copy';
    Object.assign(copyButton.style, { cursor: 'pointer', userSelect: 'auto' });
    const infoButton = document.createElement('span'); infoButton.textContent = 'ℹ️';
    Object.assign(infoButton.style, { marginRight: '8px', cursor: 'pointer', position: 'relative', userSelect: 'auto' });
    const tooltip = document.createElement('div'); tooltip.textContent = '';
    Object.assign(tooltip.style, {
        visibility: 'hidden', backgroundColor: '#333', color: '#fff', textAlign: 'center',
        borderRadius: '4px', padding: '4px 8px', position: 'absolute', bottom: '125%', left: '50%',
        transform: 'translateX(-50%)', whiteSpace: 'nowrap', zIndex: '99999', fontSize: '12px',
        opacity: 0, transition: 'opacity 0.3s'
    });
    infoButton.appendChild(tooltip);
    infoButton.addEventListener('mouseenter', () => { tooltip.style.visibility = 'visible'; tooltip.style.opacity = '1'; });
    infoButton.addEventListener('mouseleave', () => { tooltip.style.visibility = 'hidden'; tooltip.style.opacity = '0'; });
    const closeButton = document.createElement('span'); closeButton.textContent = '✖';
    Object.assign(closeButton.style, { cursor: 'pointer', fontWeight: 'bold', userSelect: 'auto' });
    closeButton.onclick = removePopup;
    const leftWrapper = document.createElement('div'); leftWrapper.appendChild(copyButton);
    const rightWrapper = document.createElement('div'); rightWrapper.style.display = 'flex'; rightWrapper.style.gap = '8px';
    rightWrapper.appendChild(infoButton); rightWrapper.appendChild(closeButton);
    headerBar.appendChild(leftWrapper); headerBar.appendChild(rightWrapper);

    // Content area (NO CHANGES)
    const content = document.createElement('div');
    content.textContent = 'Loading...';
    Object.assign(content.style, { padding: '14px 18px' });

    // Assemble popup (NO CHANGES)
    apiPopup.appendChild(headerBar);
    apiPopup.appendChild(content);
    document.body.appendChild(apiPopup);

    // Load API data using the passed promise (NO CHANGES)
    textPromise
        .then(function(data) {
             if (!apiPopup) return; // Check if popup still exists
            console.log("✅ API full response received:", data);
            let reformulated_text = data.reformulated_text || 'No reformulated text';
            let original_score = parseFloat(data.original_score) || 0;
            let simplified_score = parseFloat(data.simplified_score) || 0;
            let difficultyDrop = 'N/A';
            if (original_score > 0 && simplified_score >= 0 && !isNaN(original_score) && !isNaN(simplified_score) && original_score !== 0) {
                difficultyDrop = ((1 - simplified_score / original_score) * 100).toFixed(1);
            }
            content.textContent = reformulated_text;
            tooltip.textContent = `Difficulty decreased by ${difficultyDrop}%`;
            copyButton.onclick = () => {
                navigator.clipboard.writeText(reformulated_text).then(() => {
                    copyButton.textContent = '✅'; setTimeout(() => { copyButton.textContent = '📋'; }, 1000);
                }).catch(err => console.error('Copy failed:', err));
            };
        })
        .catch(function(error) {
             if (!apiPopup) return; // Check if popup still exists
            console.error("API Call Error:", error);
            if (content) {
                content.textContent = `Error: ${error.message}`;
                content.style.backgroundColor = '#ffdddd';
            }
             tooltip.textContent = `Error loading data`;
        });
}

// Call your Flask API (preloading) - (NO CHANGES HERE)
// *** Make sure this endpoint is correct for your Flask app! ***
async function callLocalApi(selectedText) {
    const apiUrl = 'http://localhost:5000/simplify'; // Or /process if you changed Flask

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: selectedText })
        });

        // Try parsing JSON even if not ok, for error messages
        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData?.message || responseData?.error || JSON.stringify(responseData) || response.statusText;
            throw new Error(`API Error (${response.status}): ${errorMessage}`);
        }
        return responseData; // Return the parsed JSON

    } catch (error) {
        console.error("Fetch/Processing Error:", error);
        if (error.message.includes("Failed to fetch")) {
             throw new Error("Network error: Could not connect to API.");
        } else if (error instanceof SyntaxError) {
             throw new Error("API response format error: Expected JSON.");
        } else if (error.message.startsWith('API Error')) {
             throw error; // Re-throw our formatted API error
        }
        throw new Error(`An unexpected error occurred: ${error.message}`);
    }
}

// << MODIFIED: Renamed and now creates a container with BOTH buttons >>
function showActionButtons(buttonX, buttonY, selectedText, selectionCenterX, selectionBottomY) {
    removePopup(); // Remove results popup
    removeButtonContainer(); // Remove any old button container

    if (!selectedText) {
        console.warn("⚠️ No selected text provided to showActionButtons.");
        return;
    }

    console.log("📌 Showing action buttons container");

    // --- Create the container ---
    actionButtonContainer = document.createElement('div');
    Object.assign(actionButtonContainer.style, {
        position: 'absolute',
        left: `${buttonX}px`, // Position the container
        top: `${buttonY}px`,  // Position the container
        zIndex: 9998,
        display: 'flex',      // Layout buttons horizontally
        gap: '5px',           // Space between buttons
        // Optional styling for the container itself
        // backgroundColor: 'rgba(255, 255, 255, 0.8)',
        // padding: '2px',
        // borderRadius: '5px',
    });

    // --- 1. Create the ORIGINAL "Simplify Text" button ---
    const simplifyButton = document.createElement('button');
    simplifyButton.textContent = "Simplify Text"; // Original text
    simplifyButton.title = "Simplify selected text";
    // Original Styling:
    Object.assign(simplifyButton.style, {
        padding: '6px 10px', backgroundColor: '#007bff', color: '#fff',
        border: 'none', borderRadius: '4px', cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)', fontSize: '14px',
        fontFamily: 'sans-serif', lineHeight: '1' // Added line height for consistency
    });

    // Original Action:
    simplifyButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering mousedown cleanup immediately
        console.log("🟢 Simplify button clicked");
        // Pass the *preloaded promise* to showPopup
        showPopup(currentPreloadPromise, selectionCenterX, selectionBottomY);
        // Remove the button container after clicking Simplify
        removeButtonContainer();
    });

    // --- 2. Create the NEW "Read Aloud" button ---
    const readAloudButton = document.createElement('button');
    readAloudButton.textContent = "🔊"; // Speaker icon for TTS
    readAloudButton.title = "Read selected text aloud";
    // Styling similar to Simplify button, but maybe different color:
    Object.assign(readAloudButton.style, {
        padding: '6px 8px', // Slightly less padding for icon?
        backgroundColor: '#6c757d', // Gray color
        color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)', fontSize: '14px',
        fontFamily: 'sans-serif', lineHeight: '1' // Added line height
    });

    // Action for Read Aloud button:
    readAloudButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering mousedown cleanup immediately
        console.log("🔊 Read Aloud button clicked");
        speakText(currentSelectedText); // Use the stored selected text
        // DO NOT remove the button container here - allow simplifying after reading
    });

    // --- Add buttons TO the container ---
    actionButtonContainer.appendChild(simplifyButton);
    actionButtonContainer.appendChild(readAloudButton);

    // --- Add the CONTAINER to the page ---
    document.body.appendChild(actionButtonContainer);
}

// --- NEW: Function to speak text using Web Speech API ---
function speakText(textToSpeak) {
    if (!textToSpeak) {
        console.warn("No text provided to speak.");
        return;
    }
    if (!('speechSynthesis' in window)) {
        console.error("Text-to-Speech not supported by this browser.");
        alert("Sorry, your browser doesn't support Text-to-Speech.");
        return;
    }

    // Cancel any ongoing speech *before* starting new speech
    if (window.speechSynthesis.speaking) {
        console.log("Cancelling previous speech...");
        window.speechSynthesis.cancel();
        // Add a tiny delay. Sometimes helps prevent issues after cancel.
        setTimeout(() => { proceedWithSpeech(textToSpeak); }, 50);
    } else {
        proceedWithSpeech(textToSpeak);
    }
}

// Helper for speakText
function proceedWithSpeech(textToSpeak) {
    console.log("🗣️ Speaking:", textToSpeak.substring(0, 50) + "...");
    utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        utterance = null;
    };
     utterance.onend = () => {
        console.log("Speech finished.");
        utterance = null; // Clear utterance reference when done
    };
    window.speechSynthesis.speak(utterance);
}


// --- Main event listener for text selection (MODIFIED TO CALL showActionButtons) ---
document.addEventListener('mouseup', (event) => {
    // Don't trigger if clicking inside our button container or the result popup
    if ((actionButtonContainer && actionButtonContainer.contains(event.target)) ||
        (apiPopup && apiPopup.contains(event.target))) {
        return;
    }

    setTimeout(() => { // Use timeout as before
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0 && selectedText !== currentSelectedText) {
             // Stop any previous speech when new text is selected
             if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }

            const range = selection.getRangeAt(0);
            const startRange = range.cloneRange(); startRange.collapse(true);
            const startRect = startRange.getBoundingClientRect();
            const fullRect = range.getBoundingClientRect();

            // Position for the button CONTAINER (above start of selection)
            const buttonContainerX = window.scrollX + startRect.left - 2;
            const buttonContainerY = window.scrollY + startRect.top - 35; // Original Y pos

            // Coords needed for the popup if Simplify is clicked (center below)
            const centerX = window.scrollX + (fullRect.left + fullRect.right) / 2;
            const bottomY = window.scrollY + fullRect.bottom;

            console.log("🖱️ Selected:", selectedText.substring(0, 50) + "...");

            currentSelectedText = selectedText;
            // Preload API call (NO CHANGE)
            currentPreloadPromise = callLocalApi(selectedText);
            currentPreloadPromise.catch(err => console.warn("Preload API call failed:", err.message)); // Handle error silently

            // << Call the modified function to show BOTH buttons >>
            showActionButtons(buttonContainerX, buttonContainerY, selectedText, centerX, bottomY);

        } else if (selectedText.length === 0 && currentSelectedText !== null) {
            // Selection cleared
             console.log("🚫 Selection cleared.");
            removePopup();
            removeButtonContainer(); // Use new cleanup function
            currentSelectedText = null;
            currentPreloadPromise = null;
             if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }
    }, 10);
});

// Cleanup on outside click (MODIFIED TO CHECK CONTAINER)
document.addEventListener('mousedown', (event) => {
    // Check if the click target is outside BOTH the popup and the button container
    const clickedOutsidePopup = apiPopup && !apiPopup.contains(event.target);
    const clickedOutsideButtons = actionButtonContainer && !actionButtonContainer.contains(event.target);

    // If we have UI elements showing (popup OR buttons), and the click was outside ALL of them...
    if ((apiPopup || actionButtonContainer) && clickedOutsidePopup && clickedOutsideButtons) {
         console.log("🖱️ Clicked outside UI elements, cleaning up.");
        removePopup();
        removeButtonContainer(); // Use new cleanup function
        currentSelectedText = null; // Reset selection state
        currentPreloadPromise = null;
    }
});

console.log("✅ Local API Text Simplifier Extension Loaded (with added TTS button).");