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

export const generateChallenge = async (topics, difficulty) => {
    try {
        const response = await axiosInstance.post('/api/ai-coding/generate', { topics, difficulty });
        return response.data; // Returns CodingChallengeDto
    } catch (error) {
        throw error;
    }
};

export const getChallenge = async (challengeId) => {
    try {
        const response = await axiosInstance.get(`/api/coding/challenge/${challengeId}`);
        return response.data; // Returns CodingChallengeDto
    } catch (error) {
        throw error;
    }
};

export const submitSolution = async (challengeId, submission) => {
    try {
        const response = await axiosInstance.post(`/api/coding/challenge/${challengeId}/submit`, submission);
        return response.data; // Returns CodingChallengeResultDto
    } catch (error) {
        throw error;
    }
};