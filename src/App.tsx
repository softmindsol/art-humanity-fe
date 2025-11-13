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
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import DonationPromptModal from './components/modal/DonationPromptModal';
import { useSelector } from 'react-redux';
import { openDonationForm, resetDonationPrompt, selectIsDonationPromptModalOpen } from './redux/slice/opeModal';
import { useDispatch } from 'react-redux';
import ContactUs from './page/contact/ContactPage';
import ScrollToTop from './components/common/ScrollToTop';
function App() {
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const shouldShow = useSelector(selectIsDonationPromptModalOpen);
  const dispatch = useDispatch();
  // This useEffect listens for the trigger from Redux
  useEffect(() => {
    if (shouldShow) {
      // Check if the user has ALREADY seen the modal in this session or ever before
      const hasSeenModal = localStorage.getItem('hasSeenDonationPrompt');
      if (!hasSeenModal) {
        const timer = setTimeout(() => {
          // 5 second ke baad, modal ko dikhayein
          setIsPromptModalOpen(true);
          // Aur foran record set kar dein taake dobara na dikhe
          localStorage.setItem('hasSeenDonationPrompt', 'true');
        }, 5000); // 5000 milliseconds = 5 seconds

        // Hamesha cleanup function return karein taake agar component unmount ho to timer cancel ho jaye
        return () => clearTimeout(timer);
      }
      // Reset the trigger immediately so it doesn't fire again on re-renders
      dispatch(resetDonationPrompt());
    }
  }, [shouldShow, dispatch]);

  console.log("published key:", import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  return (
    <Elements stripe={stripePromise}>
    <Router>
      <SocketProvider>
          {/* <div className=""> */}

        
          <Header  />
        <ProjectProvider>
              <main className=''>
              <ScrollToTop />

            <Routes>
              <Route path="/" element={<HeroSection />} />
              <Route path="/guideline" element={<GuidelinePage />} />
              <Route path="/gallery" element={<><GalleryPage /></>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/create-project" element={<CreateProjectPage />} />
                <Route path="/contact-us" element={<><ContactUs /></>} />

              <Route path="/projects" element={<><ActiveProjects /></>} />
              <Route path="/demo" element={<Demo />} />
              <Route path='/verify-email/:token' element={<VerifyEmail />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/project/:canvasId" element={<TiledCanvasPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </ProjectProvider>
       {
            isPromptModalOpen && <div className='w-[90%] md:w-[100%]'><DonationPromptModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onDonateClick={() => {
                  dispatch(openDonationForm())
                }}
              /></div>
      }
       
          <Footer />
            {/* </div> */}
      </SocketProvider>
    </Router>
    </Elements>
  );
}

export default App;
