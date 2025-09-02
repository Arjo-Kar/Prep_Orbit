import React, { useState, useEffect } from 'react';
import { getUserWeaknesses } from '../api/quiz';

function WeaknessReportPage() {
    // You would get the userId from your authentication state or context
    // For this example, let's assume a hardcoded userId
    const userId = 1;

    const [weaknesses, setWeaknesses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeaknesses = async () => {
            try {
                const data = await getUserWeaknesses(userId);
                setWeaknesses(data);
            } catch (err) {
                setError('Failed to load user weaknesses. Please check your backend.');
                console.error('API error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchWeaknesses();
        }
    }, [userId]);

    if (isLoading) {
        return <div>Loading weaknesses report...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (weaknesses.length === 0) {
        return <div>No weaknesses found yet. Take some quizzes to get a report!</div>;
    }

    return (
        <div>
            <h2>Your Weak Areas Report</h2>
            <p>Based on your quiz history, here are the topics where you have the most incorrect answers.</p>
            <ul>
                {weaknesses.map((weakness, index) => (
                    <li key={index}>
                        <strong>Topic:</strong> {weakness.topic}, <strong>Incorrect Answers:</strong> {weakness.incorrectCount}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default WeaknessReportPage;