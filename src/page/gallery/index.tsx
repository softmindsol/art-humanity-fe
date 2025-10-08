// src/pages/GalleryPage.tsx

import React, { useEffect, useState, useMemo } from 'react'; // useMemo import karein
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    selectGalleryProjects,
    selectProjectsLoading,
    selectProjectsError,
    setGalleryCurrentPage,
    selectGalleryPagination
} from '@/redux/slice/project';
import { fetchGalleryProjects } from '@/redux/action/project';
import { getImageUrl } from '@/utils/publicUrl';
import useAppDispatch from '@/hook/useDispatch';
import { toast } from 'sonner';
import api from '@/api/api';
import { Pagination } from '@/components/common/Pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CheckoutForm from '@/components/stripe/CheckoutForm';

// Redux se user ka poora profile haasil karein
import type { RootState } from '@/redux/store';
import { Button } from '@/components/ui/button';
import { addSuccessfulPaymentToHistory } from '@/redux/slice/auth';
import PaymentSuccessModal from '@/components/modal/PaymentSuccessModal';

const GalleryPage: React.FC = () => {
    const dispatch = useAppDispatch();
    // profile ko Redux se haasil karein
    const { user, profile } = useSelector((state: RootState) => state.auth);

    const projects = useSelector(selectGalleryProjects);
    const isLoading = useSelector(selectProjectsLoading).fetchingGallery;
    const error = useSelector(selectProjectsError).fetchingGallery;
    const { currentPage, totalPages } = useSelector(selectGalleryPagination);
    const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [paymentState, setPaymentState] = useState<{
        isOpen: boolean;
        clientSecret: string | null;
        projectToDownload: any | null;
    }>({
        isOpen: false,
        clientSecret: null,
        projectToDownload: null,
    });

    // --- SUCCESS MODAL KE LIYE NAYI STATE ---
    const [successState, setSuccessState] = useState({
        isOpen: false,
        project: null as any | null,
    });
    const handleBuyClick = async (project: any) => {
        if (!user) {
            toast.error("Please log in to make a purchase.");
            // dispatch(openAuthModal()); // Optional: open login modal
            return;
        }

        setPaymentLoading(project._id);

        try {
            const response = await api.post('/payments/create-payment-intent', { projectId: project._id, userId: user._id });
            setPaymentState({
                isOpen: true,
                clientSecret: response.data.data.clientSecret,
                projectToDownload: project,
            });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Could not initiate payment.");
        } finally {
            // API call mukammal hone ke baad (chahe kamyab ho ya fail), loader OFF karein
            setPaymentLoading(null);
        }
    };

    const handlePaymentSuccess = () => {
        const project = paymentState.projectToDownload;

        // --- YEH HAI ASAL NAYI LOGIC ---
        // Step 1: Ek "dummy" payment object banayein jo hamare backend
        //         ke populated object jaisa dikhta ho
        const optimisticPaymentRecord = {
            _id: `temp_${Date.now()}`, // Ek temporary ID
            projectId: {
                _id: project._id,
                canvasId: project.canvasId,
                title: project.title,
            },
            status: 'succeeded',
            // Aap yahan aur bhi fields (amount, type) add kar sakte hain
        };

        // Step 2: Naye reducer ko dispatch karein
        dispatch(addSuccessfulPaymentToHistory(optimisticPaymentRecord));
        // --- NAYI LOGIC KHATAM ---
        handleDownload(paymentState.projectToDownload);
        setPaymentState({ isOpen: false, clientSecret: null, projectToDownload: null });
        // --- NAYI LOGIC: SUCCESS MODAL KHOLEIN ---
        setSuccessState({
            isOpen: true,
            project: project,
        });

    };

    const handleDownload = async (project: any) => {
        if (downloading === project._id) return;
        setDownloading(project._id);
        toast.info("Preparing your download...");
        try {
            const response = await api.get(`/image/download/${project._id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${project.canvasId || 'artwork'}.png`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Download started!");
        } catch (err: any) {
            console.error("Download failed:", err);
            toast.error(err.response?.data?.message || "Failed to download image.");
        } finally {
            setDownloading(null);
        }
    };
    // --- YEH HAI ASAL NAYI LOGIC ---
    // Step 1: Component ke top level par ek Set banayein jo tamam khareede hue project IDs rakhega.
    const purchasedProjectIds = useMemo(() => {
        // Agar payment history nahi hai, to ek khaali Set wapas karein
        if (!profile?.paymentHistory) {
            return new Set<string>();
        }

        // Tamam "succeeded" payments se projectId nikaal kar ek Set banayein
        // Set ka istemal check karne ko bohat tezz bana deta hai (O(1) complexity)
        return new Set<string>(
            profile.paymentHistory
                .filter((p: any) => p.status === 'succeeded' && p.projectId?._id)
                .map((p: any) => p.projectId._id)
        );
    }, [profile]); // Yeh calculation sirf tab dobara hogi jab profile badlega

    useEffect(() => {
        dispatch(fetchGalleryProjects({ page: currentPage, limit: 9 }));
    }, [currentPage, dispatch]);

    const handlePageChange = (newPage: number) => {
        dispatch(setGalleryCurrentPage(newPage));
    };



    if (error) {
        return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    }

    return (
        <div id="gallery-content" className="projects-content">
            <section className="projects-header page-header">
                <h2 className='!text-[28px] md:!text-[32px]'>Project Gallery</h2>
                <p className='!text-[14px] !w-full md:!text-[19.2px]' style={{ color: '#8d6e63' }}>Explore our collection of completed collaborative canvases.</p>
            </section>
            {
                (isLoading &&projects.length === 0) && <div className="flex justify-center items-center h-full w-full py-20">
                    <div className="w-16 h-16 border-4 border-[#d29000] border-t-transparent rounded-full animate-spin"></div>
                </div>
            }
            <section className="projects-grid mt-5">
                {!isLoading && projects.length === 0 ? (
                    <div className="text-center w-full py-20 col-span-full">
                        <h3 className="text-2xl text-gray-500">The Gallery is currently empty.</h3>
                    </div>
                ) : (
                    projects.map((project: any) => {
                        const hasPurchased = purchasedProjectIds.has(project._id);


                        return (
                            <div key={project._id} className="project-card completed">
                                <div className="project-image">
                                    <img src={getImageUrl(project.thumbnailUrl) || '...'} alt={project.title} />
                                    <div className="absolute top-2 right-2">
                                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">COMPLETED</span>
                                    </div>
                                </div>
                                <div className="project-info">
                                    <h3>{project.title}</h3>
                                    <div className="flex flex-col items-center gap-2 mt-4">
                                        <Link
                                            to={`/project/${project?.canvasId}?view=gallery`}
                                            className="btn-contribute flex-1 hover:!text-white !text-[16px] !bg-purple-600 hover:!bg-purple-700"
                                        >
                                            View Artwork
                                        </Link>

                                        {/* --- YAHAN CONDITIONAL BUTTON HAI --- */}
                                        {hasPurchased ? (
                                            <Button
                                                onClick={() => handleDownload(project)}
                                                disabled={downloading === project._id}
                                                className="btn-contribute cursor-pointer flex-1 !bg-green-600 hover:!bg-green-700 disabled:opacity-50"
                                            >
                                                {downloading === project._id ? 'Preparing...' : 'Download Again'}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleBuyClick(project)}
                                                // Button ko disable karein agar is project ke liye payment load ho rahi hai
                                                disabled={paymentLoading === project._id}
                                                className="btn-contribute cursor-pointer flex-1 !bg-blue-600 hover:!bg-blue-700 disabled:opacity-50"
                                            >
                                                {
                                                    // Text ko aql-mand tareeqe se badlein
                                                    paymentLoading === project._id
                                                        ? 'Processing...'
                                                        : `Buy & Download ($${project.price.toFixed(2)})`
                                                }
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </section>

            <div className="mt-8">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            <Dialog open={paymentState.isOpen} onOpenChange={(isOpen) => setPaymentState({ ...paymentState, isOpen })}>
                <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif] max-w-lg">
                    <DialogHeader>
                        <DialogTitle className='!text-white'>Complete Your Purchase</DialogTitle>
                    </DialogHeader>
                    {paymentState.clientSecret && paymentState.projectToDownload && (
                        <CheckoutForm
                            clientSecret={paymentState.clientSecret}
                            onPaymentSuccess={handlePaymentSuccess}
                            projectPrice={paymentState.projectToDownload.price}
                        />
                    )}
                </DialogContent>
            </Dialog>
            <PaymentSuccessModal
                isOpen={successState.isOpen}
                onClose={() => setSuccessState({ isOpen: false, project: null })}
                paymentType="purchase"
                project={successState.project}
                onDownload={handleDownload} // Download function pass karein
            />
        </div>
    );
};

export default GalleryPage;