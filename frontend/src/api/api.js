// ✅ Centralized API Configuration
// Last updated: 2025-09-05 16:42:33 UTC by Arjo-Kar

const API_CONFIG = {
  // ✅ Only update this URL when ngrok changes
  BASE_URL: 'https://c2ea8584f351.ngrok-free.app',

  // Current user info
  CURRENT_USER: 'Arjo-Kar',
  CURRENT_TIME: '2025-09-05 16:42:33',

  // API endpoints
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',

    // Interview endpoints
    INTERVIEWS: '/api/interviews',
    MY_INTERVIEWS: '/api/interviews/my-interviews',
    GENERATE_INTERVIEW: '/api/interviews/generate',

    // Feedback endpoints
    FEEDBACK: '/api/interviews/{id}/feedback',

    // VAPI endpoints
    VAPI_WEBHOOK: '/api/vapi/webhook',
    VAPI_GENERATE: '/api/vapi/interview/generate',

    // Health check
    HEALTH: '/api/interviews/health'
  },

  // Common headers
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },

  // Request options
  OPTIONS: {
    credentials: 'include'
  }
};

// ✅ Helper functions
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return {
    ...API_CONFIG.HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const makeApiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const config = {
    ...API_CONFIG.OPTIONS,
    headers: getAuthHeaders(),
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  console.log(`🔗 API Request to: ${url} at ${API_CONFIG.CURRENT_TIME} by ${API_CONFIG.CURRENT_USER}`);

  try {
    const response = await fetch(url, config);
    console.log(`📡 Response status: ${response.status} from ${url}`);
    return response;
  } catch (error) {
    console.error(`❌ API Error for ${url}:`, error);
    throw error;
  }
};

export default API_CONFIG;