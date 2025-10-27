// Utility functions for Music App

/**
 * Call Gemini API with retry logic
 * @param {Object} payload - The API payload
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} API response
 */
async function callGeminiApi(payload, maxRetries = 3) {
    const url = GEMINI_API_URL + API_KEY;
    
    // Check if API Key is available before fetching
    if (API_KEY === "") {
        console.error("API Key is missing. Cannot call Gemini API.");
        throw new Error("API Key not set correctly.");
    }
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) {
                throw error;
            }
            // Exponential backoff delay
            const delay = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Format time in HH:MM:SS format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = num => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show error message in UI
 * @param {string} elementId - ID of error message element
 * @param {string} message - Error message to display
 */
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

/**
 * Clear error message in UI
 * @param {string} elementId - ID of error message element
 */
function clearError(elementId) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

/**
 * Generate note data from frequency
 * @param {number} frequency - Input frequency
 * @returns {Object} Note data object
 */
function getNoteData(frequency) {
    const A4 = AUDIO_CONFIG.TUNER.A4;
    const NOTE_NAMES = AUDIO_CONFIG.TUNER.NOTE_NAMES;
    
    const noteNum = 12 * (Math.log(frequency / A4) / Math.log(2));
    const roundedNoteNum = Math.round(noteNum) + 69;
    const noteName = NOTE_NAMES[roundedNoteNum % 12];
    const standardFrequency = A4 * Math.pow(2, (roundedNoteNum - 69) / 12);
    const cents = 1200 * Math.log2(frequency / standardFrequency);
    
    return { frequency, noteName, cents, standardFrequency };
}

/**
 * Auto-correlation algorithm for pitch detection
 * @param {Float32Array} buffer - Audio buffer
 * @param {number} sampleRate - Sample rate
 * @returns {number} Detected frequency
 */
function autoCorrelate(buffer, sampleRate) {
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) return -1;

    const correlations = new Array(buffer.length).fill(0);
    for (let lag = 0; lag < buffer.length; lag++) {
        for (let i = 0; i < buffer.length - lag; i++) {
            correlations[lag] += buffer[i] * buffer[i + lag];
        }
    }
    
    let d = 0;
    while (correlations[d] > correlations[d + 1]) d++;
    
    let maxVal = -1, maxPos = -1;
    for (let i = d; i < buffer.length; i++) {
        if (correlations[i] > maxVal) {
            maxVal = correlations[i];
            maxPos = i;
        }
    }
    
    if (maxPos > 0 && maxPos < correlations.length - 1) {
        const y1 = correlations[maxPos - 1];
        const y2 = correlations[maxPos];
        const y3 = correlations[maxPos + 1];
        maxPos += (y3 - y1) / (2 * (2 * y2 - y1 - y3));
    }
    
    return sampleRate / maxPos;
}