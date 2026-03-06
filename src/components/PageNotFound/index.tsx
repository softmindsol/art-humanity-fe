
import React from 'react';
import { Link } from 'react-router-dom';
import '../../style/NotFoundPage.css'; // Optional: Create this file for styling if needed

const NotFoundPage: React.FC = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <h1 className='text-9xl font-bold'>404</h1>
                <h2 className='text-2xl font-bold !text-white' >Page Not Found</h2>
                <p className='text-xl !text-white'>The page you're looking for doesn't exist or has been moved.</p>
                <Link to="/" className="back-home-button">Go to Homepage</Link>
            </div>
        </div>
    );  
};

export default NotFoundPage;
