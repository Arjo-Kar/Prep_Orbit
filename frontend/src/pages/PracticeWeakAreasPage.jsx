import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PracticeWeakAreasPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [practiceSessionId, setPracticeSessionId] = useState(null);

  // Get number of questions from URL params, default to 5
  const numQuestions = parseInt(searchParams.get("numQuestions") || "5", 10);

  // Fetch weak area questions
  useEffect(() => {
    const fetchWeakAreaQuestions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("User not authenticated");

        const res = await fetch(`http://localhost:8080/api/quiz/weak-areas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ numQuestions }), // Use dynamic number from URL params
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch weak area questions: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Weak areas response:", data);

        let questionsList = [];
        let sessionId = null;

        if (Array.isArray(data)) {
          questionsList = data;
        } else if (data.questions && Array.isArray(data.questions)) {
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
  }, [numQuestions]);

  const handleChange = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
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
        let answerLetter = '';
        if (userAnswer) {
          // Handle both "A) Option text" and "A" formats
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
      }).filter(answer => answer.userAnswer !== ''); // Only include answered questions

      const requestBody = { answers: formattedAnswers };

      console.log("Submitting practice answers:", requestBody);

      let submitUrl = `http://localhost:8080/api/quiz/${practiceSessionId}/submit`;

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

        try {
          const errorData = await response.json();
          console.log("Error response body:", errorData);

          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch (parseError) {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch {}
        }

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

      // Redirect to QuizResultPage with result and questionCount
      navigate(`/quiz/${practiceSessionId}/results`, {
        state: { result: data, questionCount: questions.length }
      });

      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error submitting practice quiz:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Your Weak Areas</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These {questions.length} questions are based on topics where you need improvement.
              Take your time and focus on understanding each concept.
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-8">
              {/* Question Header */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 border-l-4 border-green-500">
                <div className="flex items-center mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Question {index + 1}
                  </h3>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed pl-11">{q.questionText}</p>
              </div>

              {/* Answer Options */}
              <div className="space-y-4 pl-4">
                <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">Choose your answer:</h4>
                {/* Handle both options and choices properties */}
                {q.options && q.options.length > 0 ? (
                  q.options.slice(0, 4).map((option, i) => (
                    <label key={i} className="flex items-start space-x-4 p-4 rounded-lg border-2 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all duration-200 group">
                      <input
                        type="radio"
                        name={`q${index}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={() => handleChange(index, option)}
                        className="mt-1.5 h-5 w-5 text-green-600 border-2 border-gray-300 focus:ring-green-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-gray-800 text-base leading-relaxed group-hover:text-green-800 transition-colors">
                          {option}
                        </span>
                      </div>
                    </label>
                  ))
                ) : q.choices && q.choices.length > 0 ? (
                  q.choices.slice(0, 4).map((choice, i) => (
                    <label key={i} className="flex items-start space-x-4 p-4 rounded-lg border-2 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-all duration-200 group">
                      <input
                        type="radio"
                        name={`q${index}`}
                        value={choice}
                        checked={answers[index] === choice}
                        onChange={() => handleChange(index, choice)}
                        className="mt-1.5 h-5 w-5 text-green-600 border-2 border-gray-300 focus:ring-green-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-gray-800 text-base leading-relaxed group-hover:text-green-800 transition-colors">
                          {choice}
                        </span>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-yellow-800 font-medium">No options available for this question</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Practice Quiz"
              )}
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeWeakAreasPage;