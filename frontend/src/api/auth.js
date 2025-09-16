import axios from 'axios';

// Access the API URL from the environment variable
const API_URL = import.meta.env.VITE_API_URL;

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const signup = async (email, password, fullName) => {
    try {
        const response = await axios.post(`${API_URL}/auth/signup`, { email, password, fullName });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/auth/verify`, { params: { token } });
        return response.data;
    } catch (error) {
        throw error;
    }
};