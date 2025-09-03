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
        let questions = [];
        if (Array.isArray(data)) {
          questions = data;
        } else if (data.questions && Array.isArray(data.questions)) {
          questions = data.questions;
        }

        setQuizData({ questions });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizQuestions();
  }, [sessionId]);

  // Store answers by questionId
  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Submit quiz
  const handleSubmit = async () => {
    const unansweredQuestions = quizData.questions.filter((q) => !answers[q.id]);
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

      // Format answers for backend
      const formattedAnswers = quizData.questions
        .map((question) => {
          const userAnswer = answers[question.id];
          let answerLetter = '';
          if (userAnswer) {
            const match = userAnswer.match(/^([A-D])\)/);
            if (match) {
              answerLetter = match[1];
            } else if (["A", "B", "C", "D"].includes(userAnswer)) {
              answerLetter = userAnswer;
            }
          }
          return {
            questionId: question.id,
            userAnswer: answerLetter
          };
        })
        .filter(answer => answer.userAnswer !== '');

      const requestBody = { answers: formattedAnswers };

      const response = await fetch(`http://localhost:8080/api/quiz/${sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `Failed to submit quiz: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch {}
        }

        if (response.status === 403) {
          errorMessage = "Access denied. You may not be authorized to submit this quiz, or your session may have expired. Please try logging in again.";
        } else if (response.status === 404) {
          errorMessage = "Quiz session not found. It may have been deleted or expired.";
        } else if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        }

        throw new Error(errorMessage);
      }

      const resultData = await response.json();

      // Pass result data to the result page via navigation state
      navigate(`/quiz/${sessionId}/results`, { state: { result: resultData, questionCount: quizData.questions.length } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
              key={q.id}
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
                      id={`q${q.id}_opt${i}`}
                      name={`q${q.id}`}
                      value={choice}
                      checked={answers[q.id] === choice}
                      onChange={() => handleChange(q.id, choice)}
                    />
                    <label htmlFor={`q${q.id}_opt${i}`} style={{ marginLeft: "8px" }}>
                      {choice}
                    </label>
                  </div>
                ))
              ) : (
                <p style={{ color: "orange" }}>No options available for this question</p>
              )}
            </div>
          ))}

          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizSessionPage;