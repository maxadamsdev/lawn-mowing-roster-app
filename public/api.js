// === API FUNCTIONS ===
async function apiCall(endpoint, method = 'GET', body = null) {
    // Get API URL from localStorage or use default
    const savedUrl = localStorage.getItem('apiUrl') || API_URL;
    const finalUrl = savedUrl || (window.location.origin + '/api');
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${finalUrl}${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showAlert(`API Error: ${error.message}`, 'error');
        throw error;
    }
}

// Save API URL when we make a successful call
function saveApiUrl(url) {
    if (url) {
        localStorage.setItem('apiUrl', url);
        API_URL = url;
    }
}

