import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectAllProjects,
  selectProjectsLoading,
  selectProjectsError,
  selectProjectPagination,
  removeProjectFromList,
} from "@/redux/slice/project";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteProject,
  fetchActiveProjects,
  updateProjectStatus,
} from "@/redux/action/project";
import { getImageUrl } from "@/utils/publicUrl";
import useAppDispatch from "@/hook/useDispatch";
import useAuth from "@/hook/useAuth";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Trash2,
  CheckCircle,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react"; // Icons
import { useDebounce } from "@/hook/useDebounce";
import { SearchBar } from "@/components/common/SearchBar";
import { ProjectStatusFilter } from "@/components/common/ProjectStatusFilter";
import { Pagination } from "@/components/common/Pagination";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import ProjectTitle from "@/components/common/ProjectTitle";

const ActiveProjects: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const projects = useSelector(selectAllProjects);
  const isLoading = useSelector(selectProjectsLoading).fetching;
  const { totalPages } = useSelector(selectProjectPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { socket } = useSocket(); // Get the socket instance from your context

  const [dialogState, setDialogState] = useState<any>({
    isOpen: false,
    projectId: null,
    actionType: null, // 'PAUSE', 'CLOSE', ya 'DELETE'
    actionText: "",
  });
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms ka delay
  const error = useSelector(selectProjectsError).fetching;

  // --- Data Fetch Karne ke liye Master useEffect ---
  useEffect(() => {
    // Jab bhi page, filter, ya (debounced) search term badlega, yeh effect chalega
    // inside useEffect that fetches
    dispatch(
      fetchActiveProjects({
        page: currentPage,
        limit: 6, // keep consistent
        status: statusFilter,
        search: debouncedSearchTerm,
      }),
    );
  }, [currentPage, statusFilter, debouncedSearchTerm, dispatch]);

  // Naya handler jo sirf dialog ko kholega
  const openConfirmationDialog = (
    projectId: string,
    actionType: string,
    actionText: string,
  ) => {
    setDialogState({
      isOpen: true,
      projectId,
      actionType,
      actionText,
    });
  };

  // Asal action ko anjaam dene wala handler
  const handleConfirmAction = () => {
    const { projectId, actionType } = dialogState;
    if (!projectId || !actionType) return;

    // --- YAHAN PAR FIX HAI: Naye status field ke mutabiq actions ---
    if (actionType === "PAUSE") {
      dispatch(updateProjectStatus({ projectId, status: "Paused" }));
    } else if (actionType === "RESUME") {
      dispatch(updateProjectStatus({ projectId, status: "Active" }));
    } else if (actionType === "COMPLETE") {
      // 'CLOSE' ke bajaye 'COMPLETE'

      dispatch(updateProjectStatus({ projectId, status: "Completed" }));
    } else if (actionType === "DELETE") {
      dispatch(deleteProject(projectId));
    }

    setDialogState({
      isOpen: false,
      projectId: null,
      actionType: null,
      actionText: "",
    });
  };

  // --- REAL-TIME LISTENER FOR DELETED PROJECTS ---
  useEffect(() => {
    if (!socket) {
      console.log("[Socket] No socket instance available yet. Waiting...");
      return;
    }

    const handleProjectDeleted = (data: {
      projectId: string;
      message: string;
    }) => {
      dispatch(removeProjectFromList({ projectId: data.projectId }));
      toast.error(data.message);
    };
    socket.on("project_deleted", handleProjectDeleted);

    // This `return` function is the CLEANUP function.
    // React runs this when the component unmounts. This is the ONLY correct place for `socket.off`.
    return () => {
      socket.off("project_deleted", handleProjectDeleted);
    };
  }, [socket, dispatch]); // Dependencies are correct

  return (
    <div id="projects-content">
      {/* Hero Section */}
      <section className="relative w-full min-h-[100vh] flex items-center bg-black text-white overflow-hidden mb-12 project-hero">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/assets/project-hero-section.svg"
            alt="Hero Background"
            className="w-full h-full opacity-60 lg:opacity-100 object-[80%] object-cover md:object-cover"
          />
        </div>

        <div className="max-w-[1440px] mx-auto md:px-10 px-8 pb-12 pt-32 relative z-10 w-full">
          {/* Text Content */}
          <div className="w-full m-auto md:space-y-6 space-y-3">
            <span className="text-white text-base font-medium">
              Collections
            </span>
            <h1 className="text-[28px] md:text-[36px] lg:text-[46px] font-semibold leading-tight !text-white">
              Active Projects
            </h1>
            <p className="text-white text-sm lg:text-base xl:text-[22px] leading-relaxed mix-blend-lighten drop-shadow-md w-full lg:w-lg xl:w-2xl">
              Explore Projects That Are Currently In Progress And Open For
              Collaboration. Each Active Project Allows Contributors From Around
              The World To Add Their Ideas, Creativity, Or Skills, Helping Shape
              The Artwork As It Evolves. Whether You Contribute A Small Detail
              Or A Meaningful Section, Every Input Becomes Part Of A Larger
              Collective Vision, Turning Individual Efforts Into A Shared
              Creative Achievement.
            </p>
            <Link to="/gallery">
              <div className="relative w-fit p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
                <Button className="rounded-full md:!px-[27px] !px-[22px] py-[7px]  bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 text-sm lg:text-base font-semibold border-none relative z-10">
                  Explore Now
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-8 mb-12 px-6 container">
        <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center md:gap-4 gap-3">
          <h2 className="text-2xl md:text-3xl lg:text-[34px] !mb-0 font-semibold !text-white">
            Create Together,{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Live Projects
            </span>
          </h2>
          <div className="relative w-fit p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
            <Button className="rounded-full md:!px-[27px] !px-[22px] py-[7px] bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 md:text-base text-sm font-semibold border-none relative z-10">
              Explore Now
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <ProjectStatusFilter
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>
          {user?.role === "admin" && (
            <Link to="/create-project" className="w-full md:w-auto">
              <Button className="w-full md:w-auto rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white font-semibold border-none hover:opacity-90 transition-opacity px-6 py-2">
                Create a new project
              </Button>
            </Link>
          )}
        </div>
      </div>
      {isLoading ? (
        // Agar loading ho rahi hai, to yahan loader dikhayein
        <div className="flex justify-center items-center w-full py-20">
          <div className="w-16 h-16 border-4 border-[#d29000] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        // Agar error hai, to yahan error message dikhayein
        <div className="text-center py-20 text-red-600  p-4 rounded-lg">
          <h3 className="font-bold">Oops! Something went wrong.</h3>
          <p>{error}</p>
        </div>
      ) : (
        <section
          id="active-projects-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-6 gap-4 container !mt-5 px-6"
        >
          {projects.length === 0 ? (
            <div className="text-center w-full py-20 col-span-full">
              <h3 className="text-2xl !text-[#ffffff]">No projects found.</h3>
              {user?.role === "admin" && (
                <p className="!text-[#ffffff]">
                  You can create the first one from the Admin Dashboard.
                </p>
              )}
            </div>
          ) : (
            projects.map((project: any) => {
              const isProjectPaused = project.status === "Paused";

              return (
                <div
                  key={project._id}
                  className="bg-[#1A1A1A] rounded-[8.03px] border border-white/10 overflow-hidden flex flex-col p-2.5 hover:border-[#E23373]/50 transition-colors duration-300"
                >
                  {/* Image with Badge */}
                  <div className="relative group">
                    <img
                      src={
                        getImageUrl(project.thumbnailUrl) ||
                        "https://via.placeholder.com/400x250"
                      }
                      alt={project.title}
                      className="w-full aspect-[4/3] object-cover rounded-[8.03px] transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className={`absolute top-3 right-3 px-4 py-1 rounded-full text-xs font-semibold !text-white shadow-lg
                        ${
                          project.status === "Paused"
                            ? "bg-red-600"
                            : project.status === "Completed"
                              ? "bg-purple-600"
                              : "bg-gradient-to-r from-[#E23373] to-[#FEC133]"
                        }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="py-3 flex flex-col gap-2">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E23373] rounded-full relative"
                          style={{
                            width: `${project.stats?.percentComplete || 0}%`,
                          }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(226,51,115,0.8)]"></div>
                        </div>
                      </div>
                    </div>
                    <span className="!text-white text-xs font-medium text-right">
                      {project.stats?.percentComplete?.toFixed(1) || 0}%
                      Complete
                    </span>
                    {/* Title and Admin Actions */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex-1 min-w-0">
                        <ProjectTitle
                          project={project}
                          isAdmin={user?.role === "admin"}
                        />
                      </div>

                      {user?.role === "admin" && (
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Pause/Resume Button */}
                          <div className="p-[1px] rounded-lg bg-gradient-to-r from-[#E23373] to-[#FEC133]">
                            <button
                              className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center text-white hover:bg-[#252525] transition-colors"
                              onClick={() =>
                                openConfirmationDialog(
                                  project._id,
                                  project.status === "Paused"
                                    ? "RESUME"
                                    : "PAUSE",
                                  project.status === "Paused"
                                    ? "Resume"
                                    : "Pause",
                                )
                              }
                              title={
                                project.status === "Paused"
                                  ? "Resume Project"
                                  : "Pause Project"
                              }
                            >
                              {project.status === "Paused" ? (
                                <Play className="w-3.5 h-3.5 fill-white" />
                              ) : (
                                <Pause className="w-3.5 h-3.5 fill-white" />
                              )}
                            </button>
                          </div>

                          {/* Delete Button */}
                          <button
                            className="w-[34px] h-[34px] rounded-lg bg-[#BE0000] flex items-center justify-center text-white hover:bg-red-700 transition-colors shadow-sm"
                            onClick={() =>
                              openConfirmationDialog(
                                project._id,
                                "DELETE",
                                "DELETE PERMANENTLY",
                              )
                            }
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:gap-4 gap-2 py-3 mt-1">
                      <div className="text-center">
                        <p className="!text-[#AAB2C7] text-xs md:text-sm font-semibold tracking-wider mb-1">
                          Contributors
                        </p>
                        <p className="!text-white md:text-[20px] text-lg font-semibold">
                          {project.contributors?.length || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="!text-[#AAB2C7] text-xs md:text-sm font-semibold tracking-wider mb-1">
                          Pixels Painted
                        </p>
                        <p className="!text-white md:text-[20px] text-lg font-semibold">
                          {project.stats?.pixelCount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-1">
                      <Link
                        to={
                          isProjectPaused
                            ? "#"
                            : project.status === "Completed"
                              ? `/project/${project?.canvasId}?view=gallery`
                              : `/project/${project?.canvasId}`
                        }
                        onClick={(e) => {
                          if (isProjectPaused) e.preventDefault();
                        }}
                        className={`w-full relative group overflow-hidden`}
                      >
                        <div
                          className={`w-full md:py-3 py-2.5 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:bg-gradient-to-r hover:from-[#FEC133] hover:to-[#E23373] transition-colors duration-300 text-white font-semibold md:text-base text-sm tracking-wide flex justify-center items-center
                            ${isProjectPaused ? "opacity-50 cursor-not-allowed grayscale" : "hover:shadow-[0_0_20px_rgba(226,51,115,0.4)]"}`}
                        >
                          {project.status === "Completed"
                            ? "View Artwork"
                            : isProjectPaused
                              ? "Project Paused"
                              : "Enter Project"}
                        </div>
                      </Link>

                      {user?.role === "admin" &&
                        project.status !== "Completed" && (
                          <div className="w-full p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:shadow-[0_0_15px_rgba(226,51,115,0.2)] transition-shadow">
                            <button
                              className="w-full py-3 rounded-full bg-[#1A1A1A] text-white font-semibold md:text-base text-sm tracking-wide hover:bg-[#252525] transition-colors flex items-center justify-center gap-2"
                              onClick={() =>
                                openConfirmationDialog(
                                  project._id,
                                  "COMPLETE",
                                  "Mark as Complete",
                                )
                              }
                            >
                              {/* <CheckCircle className="w-3.5 h-3.5" /> */}
                              Mark as Done
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      <div className="mt-8">
        {!isLoading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
      <div className="px-4 sm:px-6 md:px-8 lg:px-14">
        <AlertDialog
          open={dialogState.isOpen}
          onOpenChange={(isOpen) => setDialogState({ ...dialogState, isOpen })}
        >
          <AlertDialogContent className="!bg-[#0F0D0D] border border-white/10 text-white font-montserrat w-[calc(100%-2rem)] sm:w-[90%] md:w-[85%] lg:w-[750px] !max-w-[650px] p-4 sm:p-6 md:p-8 rounded-[12px] !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !transform">
            <AlertDialogHeader className="!space-y-1 md:!space-y-2">
              <AlertDialogTitle className="text-lg md:text-xl lg:text-2xl font-semibold text-center leading-tight !text-white px-2 sm:px-0">
                {dialogState.actionType === "DELETE"
                  ? "Do you want to Delete the project?"
                  : `Do you want to ${dialogState.actionText?.toLowerCase()} your project?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-[#AAB2C7] text-sm md:text-base font-medium max-w-[700px] mx-auto leading-relaxed px-2 sm:px-4">
                {dialogState.actionType === "DELETE"
                  ? "Are you sure you want to delete this project? This action can't be undone."
                  : "This action will pause your project. This may effect your contributors"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:mt-4 mt-2 w-full">
              <AlertDialogCancel className="border-none p-[2px] h-10 sm:h-[48px] w-full sm:flex-1 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:bg-gradient-to-r hover:from-[#FEC133] hover:to-[#E23373] transition-colors duration-300 order-2 sm:order-1">
                <Button
                  variant="outline"
                  className="h-full w-full rounded-full bg-black text-white font-medium border-0 text-sm sm:text-base"
                >
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction
                className={`w-full sm:flex-1 h-10 sm:h-[48px] rounded-full border-none text-white transition-all font-medium hover:shadow-lg cursor-pointer order-1 sm:order-2 text-sm sm:text-base
                    ${
                      dialogState.actionType === "DELETE"
                        ? "bg-[#BE0000] hover:bg-[#d70f0f] hover:shadow-red-500/30"
                        : "bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90"
                    }`}
                onClick={handleConfirmAction}
              >
                {dialogState.actionType === "DELETE" ? "Delete" : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ActiveProjects;
