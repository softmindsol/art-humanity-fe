// src/pages/GalleryPage.tsx

import React, { useEffect, useState, useMemo } from "react"; // useMemo import karein
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import {
  selectGalleryProjects,
  selectProjectsLoading,
  selectProjectsError,
  setGalleryCurrentPage,
  selectGalleryPagination,
} from "@/redux/slice/project";
import { fetchGalleryProjects } from "@/redux/action/project";
import { getImageUrl } from "@/utils/publicUrl";
import useAppDispatch from "@/hook/useDispatch";
import { toast } from "sonner";
import api from "@/api/api";
import { Pagination } from "@/components/common/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CheckoutForm from "@/components/stripe/CheckoutForm";

// Redux se user ka poora profile haasil karein
import type { RootState } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { addSuccessfulPaymentToHistory } from "@/redux/slice/auth";
import PaymentSuccessModal from "@/components/modal/PaymentSuccessModal";

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
      const response = await api.post("/payments/create-payment-intent", {
        projectId: project._id,
        userId: user._id,
      });
      setPaymentState({
        isOpen: true,
        clientSecret: response.data.data.clientSecret,
        projectToDownload: project,
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not initiate payment.",
      );
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
      status: "succeeded",
      // Aap yahan aur bhi fields (amount, type) add kar sakte hain
    };

    // Step 2: Naye reducer ko dispatch karein
    dispatch(addSuccessfulPaymentToHistory(optimisticPaymentRecord));
    // --- NAYI LOGIC KHATAM ---
    handleDownload(paymentState.projectToDownload);
    setPaymentState({
      isOpen: false,
      clientSecret: null,
      projectToDownload: null,
    });
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
      const response = await api.get(`/image/download/${project._id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${project.canvasId || "artwork"}.png`);
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
        .filter((p: any) => p.status === "succeeded" && p.projectId?._id)
        .map((p: any) => p.projectId._id),
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
    <div className="min-h-screen bg-[#0F0D0D] font-montserrat text-white">
      {/* Hero Section */}
      <section className="relative w-full min-h-[75vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute h-full inset-0 z-0">
          <img
            src="/assets/gallery-art-image.svg"
            alt="Gallery Hero"
            className="w-full h-full opacity-60 lg:opacity-100 object-[80%] object-cover md:object-cover"
          />
        </div>

        <div className="max-w-[1440px] mx-auto md:px-10 px-8 pb-12 pt-32 relative z-10 w-full">
          {/* Content Container */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left xl:space-y-6 space-y-4">
            <span className="text-[#FFFFFF] text-sm md:text-base font-medium">
              Collections
            </span>

            <h1 className="text-2xl lg:text-3xl xl:text-4xl !text-white !font-semibold leading-[1.1] lg:leading-[1.1] ">
              Project Gallery
            </h1>

            <p className="!text-white !font-medium text-sm lg:text-base 2xl:text-lg max-w-[756px] leading-relaxed drop-shadow-md">
              Explore Our Collection Of Completed Collaborative Canvases And
              Step Into A World Where Creativity Knows No Borders. Each
              Masterpiece You'll Find Here Is The Result Of Countless Artists
              Contributing Their Unique Vision, Style, And Imagination To A
              Shared Digital Space. From Subtle Strokes To Bold Concepts, Every
              Detail Adds Depth, Character, And Emotion—Proving That Art Doesn't
              Need A Single Creator To Feel Whole.
            </p>

            <Link to="/gallery">
              <div className="relative p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
                <Button className="rounded-full !px-[25px] py-[7px] bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 md:text-base text-sm font-semibold border-none relative z-10">
                  Explore Now
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Grid Section */}
      <section
        id="gallery-grid"
        className="max-w-[1440px] mx-auto px-6 lg:px-8 py-8 md:py-12"
      >
        {/* Section Header */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center md:mb-10 gap-3">
          <h2 className="lg:text-[34px] md:text-3xl text-2xl font-bold !text-white">
            Our Completed{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E23373] to-[#FEC133]">
              Gallery Artwork
            </span>
          </h2>
          <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-[#E13372] to-[#FEC133]">
            <div className="px-8 py-2 rounded-full bg-[#0F0D0D] text-white tracking-widest text-xs font-semibold uppercase">
              Artworks
            </div>
          </div>
        </div>

        {isLoading && projects.length === 0 && (
          <div className="flex justify-center items-center py-40">
            <div className="w-16 h-16 border-4 border-[#E23373] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!isLoading && projects.length === 0 ? (
          <div className="text-center w-full py-40">
            <h3 className="text-2xl text-gray-500 font-medium">
              The Gallery is currently empty.
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 gap-4">
            {projects.map((project: any) => {
              const hasPurchased = purchasedProjectIds.has(project._id);
              const contributorsCount = project.contributors
                ? project.contributors.length
                : 0;
              // Use stats.pixelCount if available, otherwise estimate or specific property
              const pixelsPainted = project.stats
                ? project.stats.pixelCount
                : project.width * project.height;

              return (
                <div
                  key={project._id}
                  className="bg-[#1E1E1E] rounded-2xl md:p-4 p-2 border border-white/5 flex flex-col gap-4 hover:border-[#E23373]/30 transition-all duration-300"
                >
                  {/* Image Area */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-800 group">
                    <img
                      src={
                        getImageUrl(project.thumbnailUrl) ||
                        "/assets/placeholder-art.svg"
                      }
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Completed Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-gradient-to-r from-[#E23373] to-[#FEC133] p-[1px] rounded-full">
                        <div className="!text-white px-2  rounded-full">
                          <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] lg:text-base sm:text-sm text-xs font-semibold">
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar (Visual) */}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col lg:gap-4 gap-2 px-2 pb-2">
                    <div className="">
                      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E23373] w-[15%] rounded-full"></div>{" "}
                        {/* Mocking 15% from design, or 100% since it's gallery */}
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="lg:text-[15px] text-[13px] text-white font-medium">
                          100% Complete
                        </span>
                      </div>
                    </div>
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-center !text-white">
                      {project.title}
                    </h3>

                    {/* Stats */}
                    <div className="flex justify-center gap-12 text-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-[#AAB2C7]">
                          Contributor
                        </span>
                        <span className="lg:text-[20px] text-base font-semibold text-white">
                          {contributorsCount || 4}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-[#AAB2C7]">
                          Pixel Painted
                        </span>
                        <span className="lg:text-[20px] text-base font-semibold text-white">
                          {pixelsPainted || 11014}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 mt-2">
                      <Link
                        to={`/project/${project?.canvasId}?view=gallery`}
                        className="w-full"
                      >
                        <Button className="w-full rounded-full lg:text-base text-sm bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white hover:opacity-90 border-none font-semibold lg:h-10">
                          View Artwork
                        </Button>
                      </Link>

                      {hasPurchased ? (
                        <Button
                          onClick={() => handleDownload(project)}
                          disabled={downloading === project._id}
                          className="w-full rounded-full lg:text-base text-sm bg-transparent border border-[#5d4037] text-white hover:bg-white/5 lg:h-10"
                        >
                          {downloading === project._id
                            ? "Preparing..."
                            : "Download Again"}
                        </Button>
                      ) : (
                        <div className="p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] w-full">
                          <Button
                            onClick={() => handleBuyClick(project)}
                            disabled={paymentLoading === project._id}
                            className="w-full rounded-full lg:text-base text-sm bg-[#1E1E1E] text-white hover:bg-[#2a2a2a] lg:h-10 border-none"
                          >
                            {paymentLoading === project._id
                              ? "Processing..."
                              : `Buy & Download`}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </section>

      {/* Modals */}
      <Dialog
        open={paymentState.isOpen}
        onOpenChange={(isOpen) => setPaymentState({ ...paymentState, isOpen })}
      >
        <DialogContent className="bg-[#1a1a1a] border border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold !text-white">
              Complete Your Purchase
            </DialogTitle>
          </DialogHeader>
          {paymentState.clientSecret && paymentState.projectToDownload && (
            <div className="-mt-2">
              <CheckoutForm
                clientSecret={paymentState.clientSecret}
                onPaymentSuccess={handlePaymentSuccess}
                projectPrice={paymentState.projectToDownload.price}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <PaymentSuccessModal
        isOpen={successState.isOpen}
        onClose={() => setSuccessState({ isOpen: false, project: null })}
        paymentType="purchase"
        project={successState.project}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default GalleryPage;
