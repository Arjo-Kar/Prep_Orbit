import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const QuizResultPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get result and questionCount from navigation state
  const result = location.state?.result;
  const questionCount = location.state?.questionCount;

  const handlePracticeWeakAreas = () => {
    navigate("/practice-weak-areas");
  };

  const formatAccuracy = (accuracy) => {
    if (accuracy === null || accuracy === undefined) return '0.0';
    if (typeof accuracy === 'string') {
      if (accuracy === 'NaN' || accuracy.toLowerCase() === 'nan') return '0.0';
      const numAccuracy = parseFloat(accuracy);
      return isNaN(numAccuracy) ? '0.0' : numAccuracy.toFixed(1);
    }
    if (typeof accuracy === 'number') {
      return isNaN(accuracy) ? '0.0' : accuracy.toFixed(1);
    }
    return '0.0';
  };

  if (!result) {
    return (
      <div>
        <p>No results found. Please complete the quiz first.</p>
        <button onClick={() => navigate(`/quiz/${sessionId}`)}>Take Quiz</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Quiz Results</h1>
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
            <strong>Score:</strong> {result.score} / {questionCount}
          </div>
          <div>
            <strong>Accuracy:</strong> {formatAccuracy(result.accuracy)}%
          </div>
        </div>
      </div>

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
  );
};

export default QuizResultPage;