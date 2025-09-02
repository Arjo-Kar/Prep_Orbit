import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PracticeWeakAreasPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [practiceSessionId, setPracticeSessionId] = useState(null);

  // Fetch weak area questions
  useEffect(() => {
    const fetchWeakAreaQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        const res = await fetch(`http://localhost:8080/api/quiz/weak-areas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ numQuestions: 5 }), // Default number of questions
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch weak area questions: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Weak areas response:", data);

        // Handle different response formats
        let questionsList = [];
        let sessionId = null;

        if (Array.isArray(data)) {
          // Direct array of questions
          questionsList = data;
        } else if (data.questions && Array.isArray(data.questions)) {
          // Nested under 'questions' property
          questionsList = data.questions;
          sessionId = data.sessionId;
        } else if (data.sessionId && data.questions) {
          questionsList = data.questions;
          sessionId = data.sessionId;
        }

        setQuestions(questionsList);
        setPracticeSessionId(sessionId);
      } catch (err) {
        console.error("Error fetching weak area questions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeakAreaQuestions();
  }, []);

  const handleChange = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  // Local evaluation function for when backend is not available
  const evaluateLocally = () => {
    let correct = 0;
    const feedback = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctAnswer = question.correctAnswer || question.answer;

      let isCorrect = false;
      if (userAnswer && correctAnswer) {
        // Extract letter from user answer
        const userLetter = userAnswer.match(/^([A-D])\)/)?.[1];
        // Extract letter from correct answer or compare directly
        const correctLetter = correctAnswer.match(/^([A-D])\)/)?.[1] || correctAnswer;

        isCorrect = userLetter === correctLetter;
        if (isCorrect) correct++;
      }

      feedback.push({
        questionId: question.id || index,
        correct: isCorrect,
        feedback: isCorrect
          ? "Correct! Well done."
          : `Incorrect. ${question.explanation || 'Review this topic for better understanding.'}`,
        hint: question.hint || null
      });
    });

    const totalQuestions = questions.length;
    const accuracy = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

    return {
      score: correct,
      accuracy: accuracy,
      correctAnswers: correct,
      incorrectAnswers: totalQuestions - correct,
      feedback: feedback,
      strengths: correct > totalQuestions * 0.7 ? ['Good improvement in practice areas!'] : [],
      weaknesses: correct < totalQuestions * 0.5 ? ['Continue practicing these areas'] : [],
      suggestions: ['Keep practicing to improve your understanding', 'Review explanations for incorrect answers']
    };
  };

  const handleSubmit = async () => {
    // Check if user has answered all questions
    const unansweredQuestions = questions.filter((_, index) => !answers[index]);
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
      const formattedAnswers = questions.map((question, index) => {
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

      console.log("Submitting practice answers:", requestBody);

      // Use practice session ID if available, otherwise create a generic endpoint
      let submitUrl;
      if (practiceSessionId) {
        submitUrl = `http://localhost:8080/api/quiz/${practiceSessionId}/submit`;
      } else {
        // Alternative endpoint for practice submissions
        submitUrl = `http://localhost:8080/api/quiz/practice/submit`;
      }

      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Practice submit response status:", response.status);

      if (!response.ok) {
        let errorMessage = `Failed to submit practice quiz: ${response.status} ${response.statusText}`;

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
          errorMessage = "Access denied. You may not be authorized to submit this practice quiz.";
        } else if (response.status === 404) {
          errorMessage = "Practice session not found. Please try refreshing the page.";
        } else if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Practice quiz submitted successfully:", data);
      setResult(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error submitting practice quiz:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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

  if (loading) return <p>Loading weak area questions...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (questions.length === 0) {
    return (
      <div>
        <h1>Practice Your Weak Areas</h1>
        <p>No weak area questions available. Complete some quizzes first to identify areas for improvement.</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Practice Your Weak Areas</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        These questions are based on topics where you need improvement. Take your time and focus on understanding each concept.
      </p>

      {questions.map((q, index) => (
        <div
          key={index}
          style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}
        >
          <p>
            <strong>Q{index + 1}:</strong> {q.questionText}
          </p>

          {/* Handle different option formats */}
          {q.options && q.options.length > 0 ? (
            q.options.slice(0, 4).map((option, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <input
                  type="radio"
                  id={`q${index}_opt${i}`}
                  name={`q${index}`}
                  value={option}
                  checked={answers[index] === option}
                  onChange={() => handleChange(index, option)}
                />
                <label htmlFor={`q${index}_opt${i}`} style={{ marginLeft: "8px" }}>
                  {option}
                </label>
              </div>
            ))
          ) : q.choices && q.choices.length > 0 ? (
            q.choices.slice(0, 4).map((choice, i) => (
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
        {submitting ? "Submitting..." : "Submit Practice Quiz"}
      </button>

      <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>

      {result && (
        <div id="practice-results" style={{ marginTop: "30px" }}>
          {/* Overall Results */}
          <div style={{
            padding: "20px",
            border: "2px solid #4CAF50",
            borderRadius: "10px",
            backgroundColor: "#f9f9f9",
            marginBottom: "20px"
          }}>
            <h2 style={{ color: "#4CAF50", marginBottom: "15px" }}>Practice Results</h2>
            <div style={{ display: "flex", gap: "30px", marginBottom: "15px" }}>
              <div>
                <strong>Score:</strong> {result.score || 0} / {questions.length}
              </div>
              <div>
                <strong>Accuracy:</strong> {formatAccuracy(result.accuracy)}%
              </div>
            </div>
            {result.correctAnswers !== undefined && (
              <div style={{ display: "flex", gap: "30px" }}>
                <div style={{ color: "#4CAF50" }}>
                  <strong>Correct:</strong> {result.correctAnswers}
                </div>
                <div style={{ color: "#f44336" }}>
                  <strong>Incorrect:</strong> {result.incorrectAnswers}
                </div>
              </div>
            )}
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
              <h3 style={{ color: "#f57c00", marginBottom: "10px" }}>Areas Still Needing Work</h3>
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
              <h3 style={{ color: "#1976d2", marginBottom: "10px" }}>Study Suggestions</h3>
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
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Practice More Questions
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

export default PracticeWeakAreasPage;