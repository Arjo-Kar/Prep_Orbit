import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppThemeProvider from "./components/AppThemeProvider";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import QuizSessionPage from "./pages/QuizSessionPage";
import GeminiChatPage from "./pages/GeminiChatPage";
import CodingChallengePage from "./pages/CodingChallengePage";
import WeaknessReportPage from "./pages/WeaknessReportPage";
import QuizResultPage from "./pages/QuizResultPage";
import PracticeWeakAreasPage from "./pages/PracticeWeakAreasPage";
import CodingChallengeResultPage from "./pages/CodingChallengeResultPage";
import InterviewPrepPage from "./pages/InterviewPrepPage";
import InterviewGeneratorPage from "./pages/InterviewGeneratorPage";
import InterviewSessionPage from "./pages/InterviewSessionPage";
import InterviewFeedbackPage from "./pages/InterviewFeedbackPage";
import InterviewFeedbackListPage from "./pages/InterviewFeedbackListPage";
import GenerateResume from "./pages/GenerateResume";
import LiveInterviewPage from "./pages/LiveInterviewPage";
import LiveInterviewFeedbackPage from "./pages/LiveInterviewFeedbackPage";
import InterviewAnalyticsPage from "./pages/InterviewAnalyticsPage";
import LandingPage from "./pages/LandingPage";
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import CodingChallengeRunResultPage from './pages/CodingChallengeRunResultPage'

export default function App() {
  return (
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/quiz/:sessionId" element={<QuizSessionPage />} />
          <Route path="/quiz/:sessionId/results" element={<QuizResultPage />} />
          <Route path="/quiz/result/:sessionId" element={<QuizResultPage />} />

          <Route path="/gemini" element={<GeminiChatPage />} />
          <Route path="/coding-challenge/:id" element={<CodingChallengePage />} />
          <Route path="/coding-challenge/result" element={<CodingChallengeResultPage />} />
          <Route path="/coding-challenge/run-result" element={<CodingChallengeRunResultPage />} />
          <Route path="/practice-weak-areas" element={<PracticeWeakAreasPage />} />
          <Route path="/report/weaknesses" element={<WeaknessReportPage />} />

          <Route path="/interview-prep" element={<InterviewPrepPage />} />
          <Route path="/interview/new" element={<InterviewGeneratorPage />} />
          <Route path="/interview/:interviewId" element={<InterviewSessionPage />} />

          <Route path="/feedback/:interviewId" element={<InterviewFeedbackPage />} />
          <Route path="/feedback/:interviewId/user/:userId" element={<InterviewFeedbackPage />} />
          <Route path="/interview/:interviewId/feedback" element={<InterviewFeedbackPage />} />
          <Route path="/feedback-history" element={<InterviewFeedbackListPage />} />

          <Route path="/resume-generate" element={<GenerateResume />} />
          <Route path="/live-interview" element={<LiveInterviewPage />} />
          <Route path="/live-interview/feedback/:interviewId" element={<LiveInterviewFeedbackPage />} />
          <Route path="/analytics" element={<InterviewAnalyticsPage />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  );
}