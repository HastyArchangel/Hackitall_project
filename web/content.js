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

    const popupWidth = 500;
    const leftX = selectionCenterX - popupWidth / 2;
    const topY = bottomY + 20;

    // Main popup container styles
    Object.assign(apiPopup.style, {
        position: 'absolute',
        left: `${leftX}px`,
        top: `${topY}px`,
        zIndex: 9999,
        maxWidth: `${popupWidth}px`,
        backgroundColor: '#f5f5f5',
        border: '2px solid #28a745',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#212529',
        overflowWrap: 'break-word',
        fontFamily: 'sans-serif',
        userSelect: 'none' // 🔒 Make text non-selectable
    });

    // --- HEADER BAR ---
    const headerBar = document.createElement('div');
    Object.assign(headerBar.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 10px',
        borderBottom: '1px solid #ddd',
        fontSize: '14px',
        backgroundColor: '#e9fbe9',
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px'
    });

    // ℹ️ Info Button
    const infoButton = document.createElement('span');
    infoButton.textContent = 'ℹ️';
    Object.assign(infoButton.style, {
        marginRight: '8px',
        cursor: 'pointer',
        position: 'relative',
        userSelect: 'auto'
    });

    // Tooltip for info
    const tooltip = document.createElement('div');
    tooltip.textContent = ''; // Will be set later
    Object.assign(tooltip.style, {
        visibility: 'hidden',
        backgroundColor: '#333',
        color: '#fff',
        textAlign: 'center',
        borderRadius: '4px',
        padding: '4px 8px',
        position: 'absolute',
        bottom: '125%',
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        zIndex: '99999',
        fontSize: '12px',
        opacity: 0,
        transition: 'opacity 0.3s'
    });

    infoButton.appendChild(tooltip);

    infoButton.addEventListener('mouseenter', () => {
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
    });
    infoButton.addEventListener('mouseleave', () => {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
    });

    // 📋 Copy Button
    const copyButton = document.createElement('span');
    copyButton.textContent = '📋';
    copyButton.title = 'Copy to clipboard';
    Object.assign(copyButton.style, {
        cursor: 'pointer',
        marginRight: '10px',
        userSelect: 'auto'
    });

    copyButton.onclick = () => {
        if (content && content.textContent) {
            navigator.clipboard.writeText(content.textContent).then(() => {
                copyButton.textContent = '✅';
                setTimeout(() => {
                    copyButton.textContent = '📋';
                }, 1000);
            }).catch(err => {
                console.error('Copy failed:', err);
            });
        }
    };

    // ❌ Close Button
    const closeButton = document.createElement('span');
    closeButton.textContent = '✖';
    Object.assign(closeButton.style, {
        cursor: 'pointer',
        fontWeight: 'bold',
        userSelect: 'auto'
    });
    closeButton.onclick = () => removePopup();

    // Left and Right Header Sections
    const leftWrapper = document.createElement('div');
    leftWrapper.appendChild(infoButton);

    const rightWrapper = document.createElement('div');
    rightWrapper.style.display = 'flex';
    rightWrapper.style.gap = '8px';
    rightWrapper.appendChild(copyButton);
    rightWrapper.appendChild(closeButton);

    headerBar.appendChild(leftWrapper);
    headerBar.appendChild(rightWrapper);

    // --- CONTENT AREA ---
    const content = document.createElement('div');
    content.textContent = 'Loading...';
    Object.assign(content.style, {
        padding: '14px 18px'
    });

    // Assemble popup
    apiPopup.appendChild(headerBar);
    apiPopup.appendChild(content);
    document.body.appendChild(apiPopup);

    // API result handler
    currentPreloadPromise
        .then(function(data) {
            console.log("✅ API full response received:", data);

            let reformulated_text = data.reformulated_text || 'No reformulated text';
            let original_score = parseFloat(data.original_score) || 0;
            let simplified_score = parseFloat(data.simplified_score) || 0;

            let difficultyDrop = 'N/A';
            if (original_score > 0 && simplified_score >= 0) {
                difficultyDrop = ((1 - simplified_score / original_score) * 100).toFixed(1);
            }

            content.textContent = reformulated_text;
            tooltip.textContent = `Difficulty decreased by ${difficultyDrop}%`;
        })
        .catch(function(error) {
            console.error("API Call Error:", error);
            if (content) {
                content.textContent = `Error: ${error.message}`;
                content.style.backgroundColor = '#ffdddd';
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

        return await response.json();

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
            const fullRect = range.getBoundingClientRect();
            const centerX = window.scrollX + (fullRect.left + fullRect.right) / 2;
            const bottomY = window.scrollY + fullRect.bottom;

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
