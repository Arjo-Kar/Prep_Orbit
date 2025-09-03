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
      <div style={{
        backgroundColor: "#181818",
        color: "#fafafa",
        minHeight: "100vh",
        padding: "40px"
      }}>
        <p>No results found. Please complete the quiz first.</p>
        <button
          onClick={() => navigate(`/quiz/${sessionId}`)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#388e3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Take Quiz
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "#181818",
      color: "#fafafa",
      minHeight: "100vh",
      padding: "40px"
    }}>
      <h1 style={{ color: "#fafafa" }}>Quiz Results</h1>
      <div style={{
        padding: "20px",
        border: "2px solid #388e3c",
        borderRadius: "10px",
        backgroundColor: "#222",
        marginBottom: "20px"
      }}>
        <h2 style={{ color: "#81c784", marginBottom: "15px" }}>Quiz Results</h2>
        <div style={{ display: "flex", gap: "30px", marginBottom: "15px" }}>
          <div>
            <strong style={{ color: "#90caf9" }}>Score:</strong> <span style={{ color: "#81c784" }}>{result.score} / {questionCount}</span>
          </div>
          <div>
            <strong style={{ color: "#90caf9" }}>Accuracy:</strong> <span style={{ color: "#81c784" }}>{formatAccuracy(result.accuracy)}%</span>
          </div>
        </div>
      </div>

      {result.strengths && result.strengths.length > 0 && (
        <div style={{
          padding: "15px",
          border: "1px solid #388e3c",
          borderRadius: "8px",
          backgroundColor: "#263238",
          marginBottom: "15px"
        }}>
          <h3 style={{ color: "#81c784", marginBottom: "10px" }}>Your Strengths</h3>
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
          border: "1px solid #ffa726",
          borderRadius: "8px",
          backgroundColor: "#3e2723",
          marginBottom: "15px"
        }}>
          <h3 style={{ color: "#ffa726", marginBottom: "10px" }}>Areas for Improvement</h3>
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
          border: "1px solid #64b5f6",
          borderRadius: "8px",
          backgroundColor: "#1e293b",
          marginBottom: "15px"
        }}>
          <h3 style={{ color: "#64b5f6", marginBottom: "10px" }}>Suggestions</h3>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {result.suggestions.map((suggestion, index) => (
              <li key={index} style={{ marginBottom: "5px" }}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {result.feedback && result.feedback.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ marginBottom: "15px", color: "#fafafa" }}>Detailed Feedback</h3>
          {result.feedback.map((fb, index) => (
            <div key={fb.questionId || index} style={{
              padding: "15px",
              border: `1px solid ${fb.correct ? '#81c784' : '#e57373'}`,
              borderRadius: "8px",
              backgroundColor: fb.correct ? '#263238' : '#3e2723',
              marginBottom: "10px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ color: fb.correct ? '#81c784' : '#e57373' }}>
                  Q{index + 1}: {fb.correct ? 'Correct' : 'Incorrect'}
                </strong>
              </div>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#fafafa" }}>
                <strong style={{ color: "#90caf9" }}>Feedback:</strong> {fb.feedback}
              </p>
              {fb.hint && (
                <p style={{
                  margin: "8px 0 0 0",
                  padding: "8px",
                  backgroundColor: '#212121',
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontStyle: "italic",
                  color: "#bdbdbd"
                }}>
                  <strong style={{ color: "#ffd54f" }}>Hint:</strong> {fb.hint}
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
            color: "#181818",
            fontWeight: 600,
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
            backgroundColor: "#1976d2",
            color: "#fafafa",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default QuizResultPage;