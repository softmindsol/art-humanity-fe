import React from 'react';
import palette from '../../assets/images/palette.svg'; // Optional CSS import if you want to style this page
import { Link } from 'react-router-dom';
import '../../style/gallery.css'
const GalleryPage: React.FC = () => {
    return (
        <div className="container">
            <main>
                <section className="page-header">
                    <h2>Gallery</h2>
                    <p>Explore completed masterpieces from our collaborative community</p>
                </section>

                <section className="gallery-content">
                    <div className="empty-state flex items-center justify-center flex-col">
                        <img
                            src={palette}
                            alt="Empty Gallery"
                            className="empty-state-icon"
                        />
                        <h3>No projects have been completed yet</h3>
                        <p>
                            Be part of history! Join our active projects and help create the first masterpiece.
                        </p>
                        <Link to="/projects" className="btn-primary">
                            Start Contributing
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default GalleryPage;
