import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserWeaknesses } from "../api/quiz";

const WeaknessReportPage = () => {
  const navigate = useNavigate();
  const [weaknesses, setWeaknesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeaknesses = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No user logged in. Please sign in to view your weaknesses.");
        setIsLoading(false);
        return;
      }

      // You may store userId in localStorage after login
      const user = localStorage.getItem("user");
      console.log(user);
      let userId = null;
      try {
        userId = user ? JSON.parse(user).id : null;
      } catch (e) {
        userId = null;
      }

      if (!userId) {
        setError("User information missing. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        // getUserWeaknesses should return an array like you showed
        const data = await getUserWeaknesses(userId);
        setWeaknesses(data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load user weaknesses. Please check your backend."
        );
        console.error("API error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeaknesses();
  }, []);

  if (isLoading) {
    return <div>Loading weaknesses report...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "red" }}>
        Error: {error}
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => navigate("/login")}>Go to Login</button>
          <button onClick={() => navigate("/dashboard")} style={{ marginLeft: "10px" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!weaknesses || weaknesses.length === 0) {
    return (
      <div>
        <h2>Your Weak Areas Report</h2>
        <p>No weaknesses found yet. Take some quizzes to get a report!</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Weak Areas Report</h2>
      <p>
        Based on your quiz history, here are the topics where you have the most incorrect answers.
      </p>
      <ul>
        {weaknesses.map((weakness) => (
          <li key={weakness.id}>
            <strong>Topic:</strong> {weakness.topic},{" "}
            <strong>Incorrect Answers:</strong> {weakness.incorrectCount}
            <span style={{ marginLeft: "10px", color: "#888", fontSize: "0.95em" }}>
              (Last updated: {new Date(weakness.lastUpdated).toLocaleString()})
            </span>
          </li>
        ))}
      </ul>
      <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
    </div>
  );
};

export default WeaknessReportPage;