let apiPopup = null;
let apiButton = null;

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

// Show popup with simplified text
function showPopup(text, x, y) {
    console.log("🚀 showPopup called with:", text);
    removePopup();

    apiPopup = document.createElement('div');
    apiPopup.id = 'local-api-response-popup';
    apiPopup.textContent = 'Loading...';

    Object.assign(apiPopup.style, {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 9999,
        maxWidth: '300px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        fontSize: '14px'
    });

    document.body.appendChild(apiPopup);

    callLocalApi(text)
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

// Call your Flask API
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
function showActionButton(x, y, selectedText) {
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
        fontSize: '14px'
    });

    apiButton.addEventListener('click', () => {
        console.log("🟢 Simplify button clicked");
        showPopup(selectedText, x + 10, y + 30);
        removeButton();
    });

    document.body.appendChild(apiButton);
}

// --- Main event listener for text selection ---
document.addEventListener('mouseup', (event) => {
    if (apiButton && apiButton.contains(event.target)) return;

    setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();

        if (selectedText.length > 0) {
            const range = window.getSelection().getRangeAt(0);
            const rect = range.getBoundingClientRect();

            const popupX = window.scrollX + rect.right;
            const popupY = window.scrollY + rect.bottom + 5;

            console.log("🖱️ Selected:", selectedText);
            showActionButton(popupX, popupY, selectedText);
        } else {
            removePopup();
            removeButton();
        }
    }, 10);
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
