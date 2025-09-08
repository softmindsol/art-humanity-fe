import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HeroSection from './components/hero-section/home-page-hero-section';
import NotFoundPage from './components/PageNotFound';
import GuidelinePage from './page/guideline';
import ActiveProjects from './page/contribute/';
import VerifyEmail from './page/VerifyEmail';
import ResetPassword from './page/ResetPassword';
import ProfilePage from './page/profile';
import CreateProjectPage from './page/create-project';
import ProtectedRoute from './routes/PrivateRoute';
import { ProjectProvider } from './context/ProjectContext';
import TiledCanvasPage from './page/TiledCanvasPage';
import Demo from './page/Demo';
import GalleryPage from './page/gallery';
import { SocketProvider } from './context/SocketContext';
function App() {
  return (
    <Router>
      <SocketProvider>
        <Header />
        <ProjectProvider>
          <main>
            <Routes>
              <Route path="/" element={<HeroSection />} />
              <Route path="/guideline" element={<GuidelinePage />} />
              <Route path="/gallery" element={<><GalleryPage /></>} />
              <Route path="/profile" element={<><ProfilePage /></>} />
              <Route path="/create-project" element={<CreateProjectPage />} />

              <Route path="/projects" element={<><ActiveProjects /></>} />
              <Route path="/demo" element={<Demo />} />
              <Route path='/verify-email/:token' element={<VerifyEmail />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/project/:canvasId" element={<TiledCanvasPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </ProjectProvider>
        <Footer />
      </SocketProvider>
    </Router>
  );
}

export default App;
