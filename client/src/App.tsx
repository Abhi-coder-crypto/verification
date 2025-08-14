import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CandidateProvider } from './context/CandidateContext';
import Navigation from './components/Navigation';
import VerificationPage from './pages/VerificationPage';
import RegistrationPage from './pages/RegistrationPage';
import StatusPage from './pages/StatusPage';

function App() {
  return (
    <CandidateProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<VerificationPage />} />
              <Route path="/verification" element={<VerificationPage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/status" element={<StatusPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CandidateProvider>
  );
}

export default App;