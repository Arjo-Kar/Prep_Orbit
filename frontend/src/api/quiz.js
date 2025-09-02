import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// A helper function to attach the JWT token to requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const startQuiz = async (topics, difficulty) => {
    try {
        const response = await axiosInstance.post('/api/quiz/start', { topics, difficulty });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getQuizQuestions = async (sessionId) => {
    try {
        const response = await axiosInstance.get(`/api/quiz/${sessionId}/questions`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const submitQuiz = async (sessionId, answers) => {
    try {
        const response = await axiosInstance.post(`/api/quiz/${sessionId}/submit`, { answers });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const practiceWeakAreas = async (numQuestions) => {
    try {
        const response = await axiosInstance.post('/api/quiz/weak-areas', { numQuestions });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getUserWeaknesses = async (userId) => {
    try {
        const response = await axiosInstance.get(`/api/quiz/user/${userId}/weaknesses`);
        return response.data;
    } catch (error) {
        throw error;
    }
};