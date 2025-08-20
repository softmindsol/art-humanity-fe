import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    selectGalleryProjects, 
    selectProjectsLoading,
    selectProjectsError
} from '@/redux/slice/project';
import { fetchGalleryProjects } from '@/redux/action/project'; // Naya thunk istemal karein
import { getImageUrl } from '@/utils/publicUrl';
import useAppDispatch from '@/hook/useDispatch';

const GalleryPage: React.FC = () => {
    const dispatch = useAppDispatch();

    // Redux store se gallery ka data nikalein
    const projects = useSelector(selectGalleryProjects);
    const isLoading = useSelector(selectProjectsLoading).fetchingGallery;
    const error = useSelector(selectProjectsError).fetchingGallery;

    console.log('Gallery Projects:', projects, 'Loading:', isLoading, 'Error:', error);
  
    useEffect(() => {
        console.log("useEffect is running, dispatching fetchGalleryProjects..."); // <-- YEH LINE BHI ADD KAREIN

        dispatch(fetchGalleryProjects());
    }, [dispatch]);

    if (isLoading) {
        return <div className="text-center py-20">Loading Gallery...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    }

    return (
        <div id="gallery-content" className="projects-content">
            <section className="projects-header page-header">
                <h2>Project Gallery</h2>
                <p style={{ color: '#8d6e63' }}>Explore our collection of completed collaborative canvases.</p>
            </section>

            <section className="projects-grid mt-5">
                {projects.length === 0 ? (
                    <div className="text-center w-full py-20 col-span-full">
                        <h3 className="text-2xl text-gray-500">The Gallery is currently empty.</h3>
                        <p className="text-gray-400">Completed projects will be displayed here.</p>
                    </div>
                ) : (
                    projects.map((project: any) => (
                        <div key={project._id} className="project-card completed"> {/* Class change karein */}
                            <div className="project-image">
                                <img
                                    src={getImageUrl(project.thumbnailUrl) || '...'}
                                    alt={project.title}
                                />
                                <div className="absolute top-2 right-2">
                                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">COMPLETED</span>
                                </div>
                            </div>
                            <div className="project-info">
                                <h3>{project.title}</h3>
                                <div className="project-stats">
                                    {/* Stats waisay hi rahenge */}
                                </div>

                                {/* --- READ-ONLY LINK --- */}
                                <Link to={`/project/${project?.canvasId}?view=gallery`} className="btn-contribute !bg-purple-600 hover:!bg-purple-700">
                                    View Artwork
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
};

export default GalleryPage;