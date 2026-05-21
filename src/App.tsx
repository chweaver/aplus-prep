import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Domain from './pages/Domain';
import Objective from './pages/Objective';
import Flashcards from './pages/Flashcards';
import Questions from './pages/Questions';
import Exam from './pages/Exam';
import NotFound from './pages/NotFound';
import { ProgressProvider } from './progress/ProgressContext';
import { SrsProvider } from './srs/SrsContext';

export default function App() {
  return (
    <ProgressProvider>
      <SrsProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="domain/:domainNum" element={<Domain />} />
              <Route path="objective/:objectiveId" element={<Objective />} />
              <Route path="objective/:objectiveId/flashcards" element={<Flashcards />} />
              <Route path="objective/:objectiveId/questions" element={<Questions />} />
              <Route path="exam" element={<Exam />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </SrsProvider>
    </ProgressProvider>
  );
}
