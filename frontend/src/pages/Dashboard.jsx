import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [topics, setTopics] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [numWeakQuestions, setNumWeakQuestions] = useState(5);
  const [message, setMessage] = useState("");

  // Pre-fill form if URL has query params
  useEffect(() => {
    const urlTopics = searchParams.get("topics");
    const urlNumQuestions = searchParams.get("numQuestions");

    if (urlTopics) setTopics(urlTopics);
    if (urlNumQuestions) setNumQuestions(parseInt(urlNumQuestions, 10));
  }, [searchParams]);

  // Fetch wrapper for secured endpoints
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication token not found. Please log in.");

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }

    return res.json();
  };

  // Start Quiz API call
  const startQuiz = async (topicsArray, numQuestions) => {
    return fetchWithAuth("http://localhost:8080/api/quiz/start", {
      method: "POST",
      body: JSON.stringify({ topics: topicsArray, numQuestions }),
    });
  };

  // Practice Weak Areas API call
  const practiceWeakAreas = async (numQuestions) => {
    return fetchWithAuth("http://localhost:8080/api/quiz/weak-areas", {
      method: "POST",
      body: JSON.stringify({ numQuestions }),
    });
  };

  // Handle Start Quiz button
  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const topicList = topics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (topicList.length === 0) {
        setMessage("Please enter at least one topic.");
        return;
      }

      const response = await startQuiz(topicList, parseInt(numQuestions, 10));
      navigate(`/quiz/${response.sessionId}`);
    } catch (error) {
      console.error("Start quiz error:", error);
      setMessage(error.message || "Failed to start quiz.");
    }
  };

  // Handle Practice Weak Areas button
  const handlePracticeWeakAreas = async () => {
    setMessage("");
    try {
      const response = await practiceWeakAreas(parseInt(numWeakQuestions, 10));
      navigate(`/quiz/${response.sessionId}`);
    } catch (error) {
      console.error("Practice weak areas error:", error);
      setMessage(error.message || "Failed to start weak areas practice.");
    }
  };

  const BrainCircuitIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mx-auto h-12 w-12 text-blue-600 animate-pulse"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2 14c-.55 0-1-.45-1-1v-2h2v1c0 .55-.45 1-1 1zm-4-2c-.55 0-1-.45-1-1v-3h2v3c0 .55-.45 1-1 1zm3-3v-2h-2v2c0 .55-.45 1-1 1h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-1c0-.55-.45-1-1-1s-1 .45-1 1v1c-.55 0-1 .45-1 1s.45 1 1 1h3v2h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H5c-.55 0-1 .45-1 1s.45 1 1 1h2v-2h2v2h2v-2h2v2h2v-2h2v2h2c.55 0 1-.45 1-1s-.45-1-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            <BrainCircuitIcon />
            User Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Choose an option to get started with your interview preparation.
          </p>
        </div>

        {message && <p className="text-red-500 text-center text-sm font-medium">{message}</p>}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Start Quiz */}
          <div className="flex-1 border border-gray-200 bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800">Start a New Quiz</h3>
            <form onSubmit={handleStartQuiz} className="mt-4 space-y-4">
              <div>
                <label htmlFor="topics" className="block text-sm font-medium text-gray-700">
                  Topics (comma-separated):
                </label>
                <input
                  id="topics"
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., java, spring boot, algorithms"
                  required
                />
              </div>
              <div>
                <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700">
                  Number of Questions:
                </label>
                <input
                  id="numQuestions"
                  type="number"
                  min="1"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Start Quiz
              </button>
            </form>
          </div>

          {/* Practice Weak Areas */}
          <div className="flex-1 border border-gray-200 bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800">Practice Weak Areas</h3>
            <p className="mt-2 text-sm text-gray-600">
              Focus on topics you've previously struggled with.
            </p>
            <div className="mt-4">
              <label htmlFor="numWeakQuestions" className="block text-sm font-medium text-gray-700">
                Number of Questions:
              </label>
              <input
                id="numWeakQuestions"
                type="number"
                min="1"
                value={numWeakQuestions}
                onChange={(e) => setNumWeakQuestions(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handlePracticeWeakAreas}
              className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
            >
              Start Practice Session
            </button>
          </div>
        </div>

        <hr className="my-8" />

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/report/weaknesses")}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition duration-150 ease-in-out"
          >
            View Weakness Report
          </button>
          <button
            onClick={() => navigate("/gemini")}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition duration-150 ease-in-out"
          >
            Chat with Gemini AI
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
