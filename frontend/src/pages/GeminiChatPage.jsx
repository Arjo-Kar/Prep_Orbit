import React, { useState } from 'react';
import { askGemini } from '../api/gemini';

function GeminiChatPage() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResponse('');

        try {
            const geminiResponse = await askGemini(prompt);
            setResponse(geminiResponse);
        } catch (err) {
            setError('Failed to get a response from Gemini. Please try again.');
            console.error('Gemini API error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>Ask Gemini</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Gemini a question about an interview, technology, etc."
                    rows="5"
                    cols="50"
                    required
                />
                <br />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Ask'}
                </button>
            </form>

            {response && (
                <div>
                    <h3>Gemini's Response:</h3>
                    <p>{response}</p>
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default GeminiChatPage;