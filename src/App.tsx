import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Domain from './pages/Domain';
import Objective from './pages/Objective';
import NotFound from './pages/NotFound';
import { ProgressProvider } from './progress/ProgressContext';

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="domain/:domainNum" element={<Domain />} />
            <Route path="objective/:objectiveId" element={<Objective />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ProgressProvider>
  );
}
