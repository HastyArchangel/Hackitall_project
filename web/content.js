let apiPopup = null;
let apiButton = null;
let currentPreloadPromise = null;
let currentSelectedText = null;

// Remove popup if it exists
function removePopup() {
    if (apiPopup && apiPopup.parentNode) {
        apiPopup.parentNode.removeChild(apiPopup);
        apiPopup = null;
    }
}

// Remove button if it exists
function removeButton() {
    if (apiButton && apiButton.parentNode) {
        apiButton.parentNode.removeChild(apiButton);
        apiButton = null;
    }
}

// Show popup with the provided text
function showPopup(text, selectionCenterX, bottomY) {
    console.log("🚀 showPopup called with:", text);
    removePopup();

    apiPopup = document.createElement('div');
    apiPopup.id = 'local-api-response-popup';
    apiPopup.textContent = 'Loading...';

    const popupWidth = 500;
    const leftX = selectionCenterX - popupWidth / 2;
    const topY = bottomY + 20; // Slightly below selection

    Object.assign(apiPopup.style, {
        position: 'absolute',
        left: `${leftX}px`,
        top: `${topY}px`,
        zIndex: 9999,
        maxWidth: `${popupWidth}px`,
        padding: '14px 18px',
        backgroundColor: '#f5f5f5',
        border: '2px solid #28a745',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#212529',
        overflowWrap: 'break-word',
        fontFamily: 'sans-serif'
    });

    document.body.appendChild(apiPopup);

    currentPreloadPromise
        .then(responseText => {
            console.log("✅ API response received:", responseText);
            if (apiPopup) {
                apiPopup.textContent = responseText;
            }
        })
        .catch(error => {
            console.error("API Call Error:", error);
            if (apiPopup) {
                apiPopup.textContent = `Error: ${error.message}`;
                apiPopup.style.backgroundColor = '#ffdddd';
            }
        });
}

// Call your Flask API (preloading)
async function callLocalApi(selectedText) {
    const apiUrl = 'http://localhost:5000/simplify';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: selectedText })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error (${response.status}): ${errorBody || response.statusText}`);
        }

        const json = await response.json();
        return json.reformulated_text;

    } catch (error) {
        console.error("Fetch failed:", error);
        if (error instanceof TypeError) {
            throw new Error("Network error or CORS issue. Is the local API running?");
        }
        throw error;
    }
}

// Show the floating action button
function showActionButton(x, y, selectedText, selectionCenterX, selectionBottomY) {
    removePopup();
    removeButton();

    if (!selectedText) {
        console.warn("⚠️ No selected text found.");
        return;
    }

    console.log("📌 Showing button for:", selectedText);

    apiButton = document.createElement('button');
    apiButton.textContent = "Simplify Text";

    Object.assign(apiButton.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 9999,
        padding: '6px 10px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        fontSize: '14px',
        fontFamily: 'sans-serif'
    });

    apiButton.addEventListener('click', () => {
        console.log("🟢 Simplify button clicked");
        showPopup(selectedText, selectionCenterX, selectionBottomY);
        removeButton();
    });

    document.body.appendChild(apiButton);
}

// --- Main event listener for text selection ---
document.addEventListener('mouseup', (event) => {
    // Don't trigger if clicking on the button itself
    if (apiButton && apiButton.contains(event.target)) return;

    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0 && selectedText !== currentSelectedText) {
            const range = selection.getRangeAt(0);

            // ✅ Get exact starting position of selection
            const startRange = range.cloneRange();
            startRange.collapse(true); // Collapse to the start of the selection
            const startRect = startRange.getBoundingClientRect();

            // Position the button right above the starting point of the selection
            const buttonX = window.scrollX + startRect.left - 2;
            const buttonY = window.scrollY + startRect.top - 35;

            // For centering the popup below selection
            const centerX = window.scrollX + (startRect.left + startRect.right) / 2;
            const bottomY = window.scrollY + startRect.bottom;

            console.log("🖱️ Selected:", selectedText);

            currentSelectedText = selectedText;
            currentPreloadPromise = callLocalApi(selectedText);

            showActionButton(buttonX, buttonY, selectedText, centerX, bottomY);
        } else if (selectedText.length === 0) {
            removePopup();
            removeButton();
            currentSelectedText = null;
            currentPreloadPromise = null;
        }
    }, 10); // Let selection finalize before reading it
});

// Cleanup on outside click
document.addEventListener('mousedown', (event) => {
    if (apiPopup && !apiPopup.contains(event.target)) {
        removePopup();
    }
    if (apiButton && !apiButton.contains(event.target)) {
        removeButton();
    }
});

console.log("✅ Local API Text Simplifier Extension Loaded.");
