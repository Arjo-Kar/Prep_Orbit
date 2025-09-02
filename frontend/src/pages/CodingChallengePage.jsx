import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getChallenge, submitSolution } from '../api/coding';

function CodingChallengePage() {
    const { challengeId } = useParams();
    const [challenge, setChallenge] = useState(null);
    const [code, setCode] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const fetchedChallenge = await getChallenge(challengeId);
                setChallenge(fetchedChallenge);
            } catch (err) {
                setError('Failed to load coding challenge.');
                console.error('Coding Challenge API error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (challengeId) {
            fetchChallenge();
        }
    }, [challengeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setResult(null);

        const submissionPayload = {
            sourceCode: code,
            languageId: challenge.languageId, // Assuming this is part of your DTO
        };

        try {
            const submissionResult = await submitSolution(challengeId, submissionPayload);
            setResult(submissionResult);
        } catch (err) {
            setError('Failed to submit solution. Please try again.');
            console.error('Submission API error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div>Loading coding challenge...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!challenge) {
        return <div>Challenge not found.</div>;
    }

    return (
        <div>
            <h2>{challenge.title}</h2>
            <p>{challenge.description}</p>

            <pre>
                <code>{challenge.starterCode}</code>
            </pre>

            <form onSubmit={handleSubmit}>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Write your code here..."
                    rows="20"
                    cols="80"
                />
                <br />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                </button>
            </form>

            {result && (
                <div>
                    <h3>Submission Result:</h3>
                    {/* Display submission status, test case results, etc., from CodingChallengeResultDto */}
                    <p>Status: {result.status}</p>
                    <p>Passed Test Cases: {result.passedCount}</p>
                    <p>Total Test Cases: {result.totalCount}</p>
                </div>
            )}
        </div>
    );
}

export default CodingChallengePage;