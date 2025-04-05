let apiPopup = null; // To hold the reference to our popup div

// Function to remove the existing popup
function removePopup() {
    if (apiPopup && apiPopup.parentNode) {
        apiPopup.parentNode.removeChild(apiPopup);
        apiPopup = null;
    }
}

// Function to create and show the popup
function showPopup(text, x, y) {
    removePopup(); // Remove any existing popup first

    apiPopup = document.createElement('div');
    apiPopup.id = 'local-api-response-popup';
    apiPopup.textContent = 'Loading...'; // Initial text

    // Basic positioning near the selection end
    apiPopup.style.left = `${x}px`;
    apiPopup.style.top = `${y}px`;

    document.body.appendChild(apiPopup);

    // --- Call the Local API ---
    callLocalApi(text)
        .then(responseText => {
            if (apiPopup) { // Check if popup still exists
                 apiPopup.textContent = responseText; // Update with API response
            }
        })
        .catch(error => {
             console.error("API Call Error:", error);
             if (apiPopup) { // Check if popup still exists
                 apiPopup.textContent = `Error: ${error.message}`; // Show error in popup
                 apiPopup.style.backgroundColor = '#ffdddd'; // Indicate error visually
             }
        });
}

// Function to make the API call
async function callLocalApi(selectedText) {
    const apiUrl = 'http://localhost:5000/simplify'; // CHANGE if your endpoint is different

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: selectedText }) // Send text in JSON body
        });

        if (!response.ok) {
            // Try to get error message from API response body if possible
            let errorBody = await response.text(); // Or response.json() if API sends JSON errors
            throw new Error(`API Error (${response.status}): ${errorBody || response.statusText}`);
        }

        const responseData = await response.text(); // Assuming API returns plain text
        // If API returns JSON: const responseData = await response.json();
        // Then access the relevant field: return responseData.processed_text;

        return responseData;

    } catch (error) {
        console.error("Fetch failed:", error);
        // Handle network errors or CORS issues specifically if needed
        if (error instanceof TypeError) { // Often indicates network issue or CORS
             throw new Error("Network error or CORS issue. Is the local API running and configured for CORS?");
        }
        throw error; // Re-throw other errors
    }
}


// --- Event Listener for Text Selection ---
document.addEventListener('mouseup', (event) => {
    const selectedText = window.getSelection().toString().trim();

    if (selectedText.length > 0) {
        // Get selection position
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate position for the popup (bottom-right of selection)
        // Adjust these offsets as needed
        const popupX = window.scrollX + rect.right;
        const popupY = window.scrollY + rect.bottom + 5; // 5px below selection

        console.log("Selected:", selectedText);
        showPopup(selectedText, popupX, popupY);

    } else {
        // If no text is selected (e.g., just a click), remove the popup
        // Add a small delay to allow clicking inside the popup if needed (optional)
         // setTimeout(removePopup, 100);
    }
});

// Add listener to remove popup if clicking elsewhere on the page
document.addEventListener('mousedown', (event) => {
    // Check if the click is outside the popup
    if (apiPopup && !apiPopup.contains(event.target)) {
        removePopup();
    }
});

console.log("Local API Text Selector content script loaded.");