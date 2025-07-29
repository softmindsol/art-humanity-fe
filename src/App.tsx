import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HeroSection from './components/hero-section/home-page-hero-section';
import NotFoundPage from './components/PageNotFound';
import GuidelinePage from './page/guideline';
import GalleryPage from './page/gallery';
import ActiveProjects from './page/contribute/';
import DemoCanvas from './page/Demo';
import VerifyEmail from './page/VerifyEmail';
import ResetPassword from './page/ResetPassword';
import ProfilePage from './page/profile';
import CreateProjectPage from './page/create-project';
function App() {
  return (
    <Router>
      <Header />
      <main>
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/guideline" element={<GuidelinePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-project" element={<CreateProjectPage />} />

        <Route path="/projects" element={<ActiveProjects />} />
        <Route path="/demo" element={<DemoCanvas />} />
        <Route path='/verify-email/:token' element={<VerifyEmail/>}/>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
 
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
        </main>
      <Footer />
    </Router>
  );
}

export default App;
