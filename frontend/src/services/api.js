/**
 * API service for making HTTP requests to the backend
 */

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000;

// Create a fetch request with timeout
const fetchWithTimeout = (url, options, timeout = DEFAULT_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

// Handle API response
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    // Handle error response
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  
  return data;
};

// Get auth token from local storage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Set auth token in local storage
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Create default headers
const createHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// API methods
const api = {
  // GET request
  get: async (endpoint, params = {}, includeAuth = true) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const options = {
      method: 'GET',
      headers: createHeaders(includeAuth),
    };
    
    const response = await fetchWithTimeout(url.toString(), options);
    return handleResponse(response);
  },
  
  // POST request
  post: async (endpoint, data = {}, includeAuth = true) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options = {
      method: 'POST',
      headers: createHeaders(includeAuth),
      body: JSON.stringify(data),
    };
    
    const response = await fetchWithTimeout(url, options);
    return handleResponse(response);
  },
  
  // PUT request
  put: async (endpoint, data = {}, includeAuth = true) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options = {
      method: 'PUT',
      headers: createHeaders(includeAuth),
      body: JSON.stringify(data),
    };
    
    const response = await fetchWithTimeout(url, options);
    return handleResponse(response);
  },
  
  // PATCH request
  patch: async (endpoint, data = {}, includeAuth = true) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options = {
      method: 'PATCH',
      headers: createHeaders(includeAuth),
      body: JSON.stringify(data),
    };
    
    const response = await fetchWithTimeout(url, options);
    return handleResponse(response);
  },
  
  // DELETE request
  delete: async (endpoint, includeAuth = true) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options = {
      method: 'DELETE',
      headers: createHeaders(includeAuth),
    };
    
    const response = await fetchWithTimeout(url, options);
    return handleResponse(response);
  },
  
  // Upload file
  upload: async (endpoint, file, additionalData = {}, includeAuth = true) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data to form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    const headers = {};
    if (includeAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const options = {
      method: 'POST',
      headers,
      body: formData,
    };
    
    const response = await fetchWithTimeout(url, options);
    return handleResponse(response);
  },
};

export { api, getAuthToken, setAuthToken };