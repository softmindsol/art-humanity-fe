import React, { useEffect, useState } from 'react';
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
import { toast } from 'sonner';
import api from '@/api/api';

const GalleryPage: React.FC = () => {
    const [downloading, setDownloading] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const projects = useSelector(selectGalleryProjects);
    const isLoading = useSelector(selectProjectsLoading).fetchingGallery;
    const error = useSelector(selectProjectsError).fetchingGallery;
  
    useEffect(() => {
        console.log("useEffect is running, dispatching fetchGalleryProjects..."); // <-- YEH LINE BHI ADD KAREIN

        dispatch(fetchGalleryProjects());
    }, [dispatch]);

    const handleDownload = async (project: any) => {
        if (downloading === project._id) return; // Agar pehle se download ho raha hai to kuch na karein

        setDownloading(project._id);
        toast.info("Preparing your download... This may take a moment for large canvases.");

        try {
            const response = await api.get(
                `/image/download/${project._id}`,
                {
                    responseType: 'blob', // Yeh bohat zaroori hai! Is se browser ko pata chalta hai ke file aa rahi hai.
                }
            );

            // File ko download karne ke liye ek temporary link banayein
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${project.canvasId || 'artwork'}.png`);

            // Link ko click karke download shuru karein
            document.body.appendChild(link);
            link.click();

            // Link ko DOM se hata dein
            link?.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Download started!");

        } catch (err: any) {
            console.error("Download failed:", err);
            toast.error(err.response?.data?.message || "Failed to download image.");
        } finally {
            setDownloading(null); // Loading state ko reset karein
        }
    };
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

                                <div className="flex items-center gap-2 mt-4"> {/* (3) Button group */}
                                    <Link
                                        to={`/project/${project?.canvasId}?view=gallery`}
                                        className="btn-contribute flex-1 !bg-purple-600 hover:!bg-purple-700"
                                    >
                                        View Artwork
                                    </Link>

                                    {/* --- YAHAN NAYA BUTTON ADD KAREIN --- */}
                                    {/* <button
                                        onClick={() => handleDownload(project)}
                                        disabled={downloading === project._id}
                                        className="btn-contribute flex-1 !bg-green-600 hover:!bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {downloading === project._id ? 'Preparing...' : 'Download'}
                                    </button> */}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
};

export default GalleryPage;