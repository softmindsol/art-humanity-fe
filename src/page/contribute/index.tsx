import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectAllProjects,
    selectProjectsLoading,
    selectProjectsError
} from '@/redux/slice/project';
import { fetchActiveProjects } from '@/redux/action/project';
import type { AppDispatch } from '@/redux/store';

const ActiveProjects: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    // Redux store se data nikalein
    const projects = useSelector(selectAllProjects);
    const isLoading = useSelector(selectProjectsLoading).fetching;
    const error = useSelector(selectProjectsError).fetching;

    // Step 1: Component load hote he saare projects fetch karein
    useEffect(() => {
        dispatch(fetchActiveProjects());
    }, [dispatch]); // Dependency array mein dispatch zaroori hai

    // Helper component for loading state
    const LoadingSpinner = () => (
        <div className="flex justify-center items-center w-full py-20">
            <div className="w-16 h-16 border-4 border-[#d29000] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // Helper component for error state
    const ErrorMessage = ({ message }: { message: string }) => (
        <div className="text-center py-20 text-red-600 bg-red-50 p-4 rounded-lg">
            <h3 className="font-bold">Oops! Something went wrong.</h3>
            <p>{message}</p>
        </div>
    );

    return (
        <div id="projects-content" className="projects-content">
            <section className="projects-header page-header">
                <h2>Active Projects</h2>
                <p style={{ color: '#8d6e63' }}>Enter a project, or sign up to contribute!</p>
            </section>

            {/* Create Project Button (ab iski zaroorat shayad homepage par na ho, lekin rakhte hain) */}
            <section className='flex items-center justify-center'>
                <div>
                    <Link
                        to="/create-project"
                        className="inline-block bg-[#d29000] !text-white px-5 py-2.5 rounded font-bold border-2 border-[#5c3b00] shadow-[2px_2px_0_#5c3b00] mt-4 no-underline"
                    >
                        Create a New Project
                    </Link>
                </div>
            </section>

            <section className="projects-grid mt-8">
                {/* Step 2: Conditional Rendering */}
                {isLoading && <LoadingSpinner />}

                {error && <ErrorMessage message={error} />}

                {!isLoading && !error && projects.length === 0 && (
                    <div className="text-center w-full py-20">
                        <h3 className="text-2xl text-gray-500">No active projects found.</h3>
                        <p className="text-gray-400">Why not be the first to create one?</p>
                    </div>
                )}

                {/* Step 3: Projects ko map karke display karein */}
                {!isLoading && !error && projects.map((project: any) => (
                    <div key={project._id} className="project-card active medieval-theme">
                        <div className="project-image">
                            {/* Thumbnail image ko project data se lein */}
                            <img
                                src={project.thumbnailUrl || 'https://via.placeholder.com/400x250'}
                                alt={project.title}
                                style={{ display: 'block' }} // Image ko hamesha dikhayein
                            />
                            <div className="project-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${project.stats?.percentComplete || 0}%` }}></div>
                                </div>
                                <div className="progress-text">{project.stats?.percentComplete || 0}% Complete</div>
                            </div>
                        </div>
                        <div className="project-info">
                            <h3>{project.title}</h3>
                            <div className="project-stats">
                                <div className="stat">
                                    {/* Contributor count ko project data se lein */}
                                    <span className="stat-value">{project.contributors?.length || 0}</span>
                                    <span className="stat-label">Contributors</span>
                                </div>
                                <div className="stat">
                                    {/* Pixel count ko project data se lein */}
                                    <span className="stat-value">{project.stats?.pixelCount || 0}</span>
                                    <span className="stat-label">Pixels Painted</span>
                                </div>
                            </div>
                            {/* Link ko dynamic banayein taaki woh sahi canvas page par jaye */}
                            <Link to={`/canvas/${project._id}`} className="btn-contribute">
                                Enter Project
                            </Link>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default ActiveProjects;