import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Onboarding } from './pages/Onboarding';
import { NewDashboard } from './pages/NewDashboard';
import { Unlearning } from './pages/Unlearning';
import { Settings } from './pages/Settings';

function App() {
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dash/*" element={<NewDashboard />} />
          <Route path="/unlearning" element={<Unlearning />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dash" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;