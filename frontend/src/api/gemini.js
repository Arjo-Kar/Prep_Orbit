import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const askGemini = async (prompt) => {
    try {
        const response = await axiosInstance.post('/api/gemini/ask', prompt);
        return response.data; // This returns the String response from your controller
    } catch (error) {
        throw error;
    }
};

export const askGeminiWithImage = async (prompt, imageFile) => {
    try {
        const formData = new FormData();
        if (prompt) formData.append('prompt', prompt);
        if (imageFile) formData.append('image', imageFile);

        // Do NOT use axiosInstance here because it sets Content-Type: application/json which breaks FormData
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
            `${API_URL}/api/gemini/chat`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};