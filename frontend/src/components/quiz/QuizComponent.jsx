import React, { useState } from 'react';
import { startQuiz } from '../../api/quiz';
import { useNavigate } from 'react-router-dom';

function StartQuizForm() {
    const [topics, setTopics] = useState([]); // Assuming topics are an array
    const [difficulty, setDifficulty] = useState('BEGINNER');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await startQuiz(topics, difficulty);
            // On success, redirect to the quiz page with the session ID
            navigate(`/quiz/${response.sessionId}`);
        } catch (error) {
            console.error('Failed to start quiz:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Start a New Quiz</h3>
            <div>
                <label>Topics:</label>
                {/* You can use checkboxes or a multi-select dropdown for topics */}
                <input
                    type="text"
                    placeholder="e.g., java, spring boot"
                    onChange={(e) => setTopics(e.target.value.split(',').map(topic => topic.trim()))}
                />
            </div>
            <div>
                <label>Difficulty:</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                </select>
            </div>
            <button type="submit">Start Quiz</button>
        </form>
    );
}

export default StartQuizForm;