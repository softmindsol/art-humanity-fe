import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to the top on route change
    }, [location]);

    return null; // This component doesn't render anything
};

export default ScrollToTop;
