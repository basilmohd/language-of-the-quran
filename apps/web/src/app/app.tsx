import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from '@/components/AuthGuard';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Lesson from '../pages/Lesson';
import Review from '../pages/Review';
import WordBank from '../pages/WordBank';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={<AuthGuard><Dashboard /></AuthGuard>}
        />
        <Route
          path="/lesson/:id"
          element={<AuthGuard><Lesson /></AuthGuard>}
        />
        <Route
          path="/review"
          element={<AuthGuard><Review /></AuthGuard>}
        />
        <Route
          path="/word-bank"
          element={<AuthGuard><WordBank /></AuthGuard>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
