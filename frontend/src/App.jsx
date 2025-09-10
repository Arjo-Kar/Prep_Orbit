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
import InterviewPrepPage from './pages/InterviewPrepPage';
import InterviewGeneratorPage from './pages/InterviewGeneratorPage';
import InterviewSessionPage from './pages/InterviewSessionPage';
import InterviewFeedbackPage from './pages/InterviewFeedbackPage';
import InterviewFeedbackListPage from './pages/InterviewFeedbackListPage';
import GenerateResume from './pages/GenerateResume';
import LiveInterviewPage from './pages/LiveInterviewPage';
import LiveInterviewFeedbackPage from './pages/LiveInterviewFeedbackPage';

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

                {/* Interview-related routes */}
                <Route path="/interview-prep" element={<InterviewPrepPage />} />
                <Route path="/interview/new" element={<InterviewGeneratorPage />} />
                <Route path="/interview/:interviewId" element={<InterviewSessionPage />} />

                {/* ✅ Fixed feedback routes - both patterns for flexibility */}
                <Route path="/feedback/:interviewId" element={<InterviewFeedbackPage />} />
                <Route path="/feedback/:interviewId/user/:userId" element={<InterviewFeedbackPage />} />
                <Route path="/interview/:interviewId/feedback" element={<InterviewFeedbackPage />} />
                <Route path="/feedback-history" element={<InterviewFeedbackListPage />} />

                <Route path="/resume-generate" element={<GenerateResume />} />

                {/* Live Interview routes */}
                <Route path="/live-interview" element={<LiveInterviewPage />} />
                <Route path="/live-interview/feedback/:interviewId" element={<LiveInterviewFeedbackPage />} />

                <Route path="/" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;