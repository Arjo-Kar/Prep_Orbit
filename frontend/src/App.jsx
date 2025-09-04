import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import QuizSessionPage from './pages/QuizSessionPage';
import GeminiChatPage from './pages/GeminiChatPage';
import CodingChallengePage from './pages/CodingChallengePage';
import WeaknessReportPage from './pages/WeaknessReportPage';
import QuizResultPage from './pages/QuizResultPage';
import PracticeWeakAreasPage from "./pages/PracticeWeakAreasPage";
import CodingChallengeResultPage from "./pages/CodingChallengeResultPage"

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/quiz/:sessionId" element={<QuizSessionPage />} />
                <Route path="/quiz/:sessionId/results" element={<QuizResultPage />} />
                <Route path="/gemini" element={<GeminiChatPage />} />
                <Route path="/coding-challenge/:id" element={<CodingChallengePage />} />
                <Route path="/report/weaknesses" element={<WeaknessReportPage />} />
                <Route path="/quiz/result/:sessionId" element={<QuizResultPage />} />
                <Route path="/practice-weak-areas" element={<PracticeWeakAreasPage />} />
                 <Route path="/coding-challenge/result" element={<CodingChallengeResultPage />} />
                <Route path="/" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;