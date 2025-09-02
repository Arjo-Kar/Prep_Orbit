import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const QuizSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState({ questions: [] });
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch quiz questions
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        const res = await fetch(`http://localhost:8080/api/quiz/${sessionId}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Handle different response formats
        let questions = [];

        if (Array.isArray(data)) {
          // Direct array of questions
          questions = data;
        } else if (data.questions && Array.isArray(data.questions)) {
          // Nested under 'questions' property
          questions = data.questions;
        }

        setQuizData({ questions });
      } catch (err) {
        console.error("Error fetching quiz questions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizQuestions();
  }, [sessionId]);

  // Handle answer selection
  const handleChange = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  // Submit quiz
  const handleSubmit = async () => {
    // Check if user has answered all questions
    const unansweredQuestions = quizData.questions.filter((_, index) => !answers[index]);
    if (unansweredQuestions.length > 0) {
      const proceed = window.confirm(
        `You have ${unansweredQuestions.length} unanswered questions. Do you want to submit anyway?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");

      // Format answers according to backend expectation
      const formattedAnswers = quizData.questions.map((question, index) => {
        const userAnswer = answers[index];

        // Extract just the letter (A, B, C, D) from the full answer text
        let answerLetter = '';
        if (userAnswer) {
          const match = userAnswer.match(/^([A-D])\)/);
          if (match) {
            answerLetter = match[1];
          }
        }

        return {
          questionId: question.id,
          userAnswer: answerLetter
        };
      }).filter(answer => answer.userAnswer !== ''); // Only include answered questions

      const requestBody = {
        answers: formattedAnswers
      };

      console.log("Submitting formatted answers:", requestBody);
      console.log("Session ID:", sessionId);

      const response = await fetch(`http://localhost:8080/api/quiz/${sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        let errorMessage = `Failed to submit quiz: ${response.status} ${response.statusText}`;

        // Try to get detailed error message
        try {
          const errorData = await response.json();
          console.log("Error response body:", errorData);

          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch (parseError) {
          console.log("Could not parse error response as JSON");
          // Try to get response as text
          try {
            const errorText = await response.text();
            console.log("Error response text:", errorText);
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch (textError) {
            console.log("Could not get error response as text");
          }
        }

        // Handle specific error cases
        if (response.status === 403) {
          errorMessage = "Access denied. You may not be authorized to submit this quiz, or your session may have expired. Please try logging in again.";
        } else if (response.status === 404) {
          errorMessage = "Quiz session not found. It may have been deleted or expired.";
        } else if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
          // Optionally redirect to login
          // navigate('/login');
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Quiz submitted successfully:", data);
      setResult(data);
      setError(null); // Clear any previous errors

      // Results will be shown in the current component below
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Navigate to practice weak areas
  const handlePracticeWeakAreas = () => {
    navigate("/practice-weak-areas");
  };

  // Helper function to safely format accuracy
  const formatAccuracy = (accuracy) => {
    if (accuracy === null || accuracy === undefined) return '0.0';
    if (typeof accuracy === 'string') {
      // Handle string 'NaN' or convert string numbers
      if (accuracy === 'NaN' || accuracy.toLowerCase() === 'nan') return '0.0';
      const numAccuracy = parseFloat(accuracy);
      return isNaN(numAccuracy) ? '0.0' : numAccuracy.toFixed(1);
    }
    if (typeof accuracy === 'number') {
      return isNaN(accuracy) ? '0.0' : accuracy.toFixed(1);
    }
    return '0.0';
  };

  if (loading) return <p>Loading quiz questions...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h1>Quiz Session: {sessionId}</h1>
      {quizData.questions.length === 0 ? (
        <p>No questions available for this session.</p>
      ) : (
        <div>
          {quizData.questions.map((q, index) => (
            <div
              key={index}
              style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}
            >
              <p>
                <strong>Q{index + 1}:</strong> {q.questionText}
              </p>

              {q.choices && q.choices.length > 0 ? (
                q.choices.map((choice, i) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <input
                      type="radio"
                      id={`q${index}_opt${i}`}
                      name={`q${index}`}
                      value={choice}
                      checked={answers[index] === choice}
                      onChange={() => handleChange(index, choice)}
                    />
                    <label htmlFor={`q${index}_opt${i}`} style={{ marginLeft: "8px" }}>
                      {choice}
                    </label>
                  </div>
                ))
              ) : (
                <p style={{ color: "orange" }}>No options available for this question</p>
              )}
            </div>
          ))}

          <button onClick={handleSubmit} disabled={submitting} style={{ marginRight: "10px" }}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>

          <button onClick={handlePracticeWeakAreas}>Practice Weak Areas</button>
        </div>
      )}

      {result && (
        <div id="quiz-results" style={{ marginTop: "30px" }}>
          {/* Overall Results */}
          <div style={{
            padding: "20px",
            border: "2px solid #4CAF50",
            borderRadius: "10px",
            backgroundColor: "#f9f9f9",
            marginBottom: "20px"
          }}>
            <h2 style={{ color: "#4CAF50", marginBottom: "15px" }}>Quiz Results</h2>
            <div style={{ display: "flex", gap: "30px", marginBottom: "15px" }}>
              <div>
                <strong>Score:</strong> {result.score} / {quizData.questions.length}
              </div>
              <div>
                <strong>Accuracy:</strong> {formatAccuracy(result.accuracy)}%
              </div>
            </div>
          </div>

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <div style={{
              padding: "15px",
              border: "1px solid #4CAF50",
              borderRadius: "8px",
              backgroundColor: "#e8f5e8",
              marginBottom: "15px"
            }}>
              <h3 style={{ color: "#2e7d32", marginBottom: "10px" }}>Your Strengths</h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {result.strengths.map((strength, index) => (
                  <li key={index} style={{ marginBottom: "5px" }}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {result.weaknesses && result.weaknesses.length > 0 && (
            <div style={{
              padding: "15px",
              border: "1px solid #ff9800",
              borderRadius: "8px",
              backgroundColor: "#fff3e0",
              marginBottom: "15px"
            }}>
              <h3 style={{ color: "#f57c00", marginBottom: "10px" }}>Areas for Improvement</h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {result.weaknesses.map((weakness, index) => (
                  <li key={index} style={{ marginBottom: "5px" }}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div style={{
              padding: "15px",
              border: "1px solid #2196F3",
              borderRadius: "8px",
              backgroundColor: "#e3f2fd",
              marginBottom: "15px"
            }}>
              <h3 style={{ color: "#1976d2", marginBottom: "10px" }}>Suggestions</h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: "5px" }}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Question-by-Question Feedback */}
          {result.feedback && result.feedback.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "15px" }}>Detailed Feedback</h3>
              {result.feedback.map((fb, index) => (
                <div key={fb.questionId || index} style={{
                  padding: "15px",
                  border: `1px solid ${fb.correct ? '#4CAF50' : '#f44336'}`,
                  borderRadius: "8px",
                  backgroundColor: fb.correct ? '#e8f5e8' : '#ffebee',
                  marginBottom: "10px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ color: fb.correct ? '#2e7d32' : '#c62828' }}>
                      Q{index + 1}: {fb.correct ? 'Correct' : 'Incorrect'}
                    </strong>
                  </div>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Feedback:</strong> {fb.feedback}
                  </p>
                  {fb.hint && (
                    <p style={{
                      margin: "8px 0 0 0",
                      padding: "8px",
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontStyle: "italic"
                    }}>
                      <strong>Hint:</strong> {fb.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <button
              onClick={handlePracticeWeakAreas}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Practice Weak Areas
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: "10px 20px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSessionPage;