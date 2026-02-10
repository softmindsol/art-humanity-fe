// src/pages/ProjectPage.js

import Toolbox from "@/components/toolbox/ToolboxInfo";
import Toolbox2 from "@/components/toolbox/Toolbox";

import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import KonvaCanvas from "../../components/common/KonvaCanvas";
import { Code, Film, Square } from "lucide-react"; // Grid icon imported

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCanvasState } from "@/hook/useCanvasState";
import {
  clearCanvas,
  fetchContributionsByTiles,
  generateTimelapseVideo,
} from "@/redux/action/contribution";
import InfoBox from "@/components/toolbox/InfoBox";
import {
  appendStrokesToContribution,
  clearAllContributionsFromState,
  clearCanvasData,
  clearTimelapseUrl,
  removeContributionFromState,
  removeContributionOptimistically,
  removeMultipleContributionsFromState,
  selectCanvasData,
  selectErrorForOperation,
  selectIsLoadingOperation,
  selectTimelapseUrl,
  updateContributionInState,
} from "@/redux/slice/contribution";
import ContributionSidebar from "@/components/canvas/ContributionSidebar";
import { joinProject } from "@/redux/action/project";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import useAuth from "@/hook/useAuth";
import useAppDispatch from "@/hook/useDispatch";
import { openAuthModal } from "@/redux/slice/opeModal";
import { io } from "socket.io-client"; // Socket client import karein
import { addContributionFromSocket } from "@/redux/slice/contribution"; // Naya action import karein
import { useSelector } from "react-redux";
import {
  addContributorToState,
  removeContributorFromState,
  selectCurrentProject,
  updateProjectStatusInState,
} from "@/redux/slice/project";
import type { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hook/useDebounce";
import { getContributionBoundingBox } from "@/utils/contributionUtils";
import { MdTimelapse } from "react-icons/md";

const TILE_SIZE = 512; // Optimal tile size for performance

interface CursorData {
  position: {
    x: number;
    y: number;
  };
  user?: {
    name?: string;
    color?: string;
  };
}
const ProjectPage = ({ projectName, projectId, totalContributors }: any) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<any>(null);
  const [canvasStats, setCanvasStats] = useState({
    zoom: 1,
    worldPos: { x: 0, y: 0 },
  });
  const [displaySize, setDisplaySize] = useState(1024); // Shuru mein size 1024px hoga
  const debouncedCanvasStats = useDebounce(canvasStats, 300); // Debounce panning/zooming
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isContributionSaving, setIsContributionSaving] = useState(false);
  const [selectedContributionId, setSelectedContributionId] = useState(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [loginDialogDismissed, setLoginDialogDismissed] = useState(false);
  const [isTimelapseOpen, setIsTimelapseOpen] = useState(false);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });
  const [isGeneratingTimelapse, _] = useState(false);
  const [isTimelapseFullscreen, setIsTimelapseFullscreen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<any>(null);

  // --- REFS ---
  const canvasContainerRef = useRef<any>(null);
  const listItemRefs = useRef<any>({});
  const [cursors, setCursors] = useState<Record<string, any>>({});
  const mainContentRef = useRef<HTMLDivElement>(null);
  const loadedTilesRef = useRef(new Set()); // Keep track of loaded tiles
  const topControlsRef = useRef<HTMLDivElement>(null);

  // --- REDUX SELECTORS ---
  const currentProject = useSelector(selectCurrentProject);
  const contributions = useSelector(selectCanvasData);
  const { loading } = useSelector((state: RootState) => state.projects);
  const timelapseUrl = useSelector(selectTimelapseUrl);
  const isGenerating = useSelector(
    selectIsLoadingOperation("generateTimelapse"),
  );
  const generationError = useSelector(
    selectErrorForOperation("generateTimelapse"),
  );
  const isReadOnly = useMemo(
    () => new URLSearchParams(window.location.search).get("view") === "gallery",
    [],
  );
  const savedStrokes = useSelector(selectCanvasData);
  const isSaving = useSelector(
    selectIsLoadingOperation("batchCreateContributions"),
  );
  const saveError = useSelector(
    selectErrorForOperation("batchCreateContributions"),
  );
  const isClearingCanvas = useSelector(selectIsLoadingOperation("clearCanvas"));

  const handleContributionSelect = useCallback(
    (contributionId: any) => {
      // Agar user ne wahi contribution dobara click ki hai, to usay deselect kar do
      if (selectedContributionId === contributionId) {
        setSelectedContributionId(null);
        return;
      }

      // Nayi ID ko set karein (highlight ke liye)
      setSelectedContributionId(contributionId);

      // Sidebar -> Canvas navigation ke liye:
      // Foran focus target set karein
      const targetContribution = contributions.find(
        (c: any) => c._id === contributionId,
      );
      if (targetContribution) {
        const bbox = getContributionBoundingBox(targetContribution);
        console.log("[Step 1] Calculated BBox:", bbox);
        if (bbox) {
          // --- YEH LINES ADD KAREIN ---
          // Animation ko fail hone se bachane ke liye ek minimum size dein
          if (bbox.width === 0) {
            bbox.width = 10; // Minimum 10 pixels
          }
          if (bbox.height === 0) {
            bbox.height = 10; // Minimum 10 pixels
          }
          setFocusTarget(bbox);
        } else {
          console.error("[Step 1] Bounding box is NULL. Canvas cannot focus.");
        }
      }
    },
    [selectedContributionId, contributions],
  ); // Dependencies zaroori hain

  useEffect(() => {
    // Yeh effect sirf tab chalega jab 'selectedContributionId' badlega
    if (
      selectedContributionId &&
      listItemRefs.current[selectedContributionId]
    ) {
      // Sidebar ko kholein (agar band hai)
      setIsSidebarOpen(true);

      // Thora sa delay dein taake sidebar khul jaye, phir scroll karein
      const timer = setTimeout(() => {
        const element = listItemRefs.current[selectedContributionId];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300); // 300ms ka delay

      return () => clearTimeout(timer);
    }
  }, [selectedContributionId]);
  const handleClearHighlight = useCallback(() => {
    // Agar pehle se koi cheez selected hai, to usay deselect kar do
    if (selectedContributionId) {
      setSelectedContributionId(null);
    }
  }, [selectedContributionId]); // Dependency array zaroori hai
  const handleGenerateTimelapse = () => {
    if (!projectId) {
      toast.error("Project ID is not available.");
      return;
    }
    setIsTimelapseOpen(true); // Modal kholein
    dispatch(generateTimelapseVideo({ projectId }));
  };

  // Modal band hone par Redux state saaf karein
  const handleModalClose = (isOpen: any) => {
    if (!isOpen) {
      dispatch(clearTimelapseUrl());
      setIsTimelapseFullscreen(false); // Reset fullscreen state when modal closes
    }
    setIsTimelapseOpen(isOpen);
  };

  const { tilesRef, isClearAlertOpen, setIsClearAlertOpen } = useCanvasState();

  // Canvas se click handle karne wala function
  const handleCanvasClick = (contributionId: any) => {
    console.log(`Canvas clicked. Setting selected ID to: ${contributionId}`);
    setSelectedContributionId(contributionId);
  };
  const handleToggleCanvasSize = () => {
    // Agar mojooda size 1024 hai, to 2560 kar do, warna 1024 kar do
    setDisplaySize((prevSize) => (prevSize === 1024 ? 2560 : 1024));
  };

  const handleSidebarContributionSelect = useCallback((contributionId: any) => {
    setSelectedContributionId(contributionId);
    const targetContribution = contributions.find(
      (c: any) => c._id === contributionId,
    );
    if (targetContribution) {
      // 3. Calculate its bounding box
      const bbox = getContributionBoundingBox(targetContribution);
      if (bbox) {
        // 4. Set the bounding box as our focus target
        setFocusTarget(bbox);
      }
    }
  }, []);

  // --- TILING DATA FETCHING LOGIC ---
  useEffect(() => {
    // Agar project ya canvas ka container tayyar nahi hai, to kuch na karein
    if (!currentProject || !canvasContainerRef.current) return;

    const { width, height } = currentProject;
    const { zoom, worldPos } = debouncedCanvasStats;
    const { offsetWidth, offsetHeight } = canvasContainerRef.current;

    // Screen par nazar anay wale area ki virtual coordinates calculate karein
    const startX = -worldPos.x / zoom;
    const startY = -worldPos.y / zoom;
    const endX = startX + offsetWidth / zoom;
    const endY = startY + offsetHeight / zoom;

    // In coordinates ko tile numbers mein convert karein
    const firstTileX = Math.max(0, Math.floor(startX / TILE_SIZE));
    const firstTileY = Math.max(0, Math.floor(startY / TILE_SIZE));
    const lastTileX = Math.min(
      Math.ceil(width / TILE_SIZE) - 1,
      Math.floor(endX / TILE_SIZE),
    );
    const lastTileY = Math.min(
      Math.ceil(height / TILE_SIZE) - 1,
      Math.floor(endY / TILE_SIZE),
    );

    const tilesToLoad = [];
    // Loop chala kar un tamam tiles ki list banayein jo load karne hain
    for (let y = firstTileY; y <= lastTileY; y++) {
      for (let x = firstTileX; x <= lastTileX; x++) {
        const tileId = `${x}-${y}`;
        // Sirf un tiles ko load karein jo pehle se load nahi hue
        if (!loadedTilesRef.current.has(tileId)) {
          tilesToLoad.push(tileId);
        }
      }
    }

    // Agar load karne ke liye naye tiles hain, to hi API call karein
    if (tilesToLoad.length > 0) {
      console.log("Fetching data for new tiles:", tilesToLoad.join(","));
      // Naye tiles ko "loaded" mark kar dein taake dobara na mangwaye ja sakein
      tilesToLoad.forEach((tileId) => loadedTilesRef.current.add(tileId));
      // Sahi format mein API call dispatch karein
      dispatch(
        fetchContributionsByTiles({ projectId, tiles: tilesToLoad.join(",") }),
      );
    }
  }, [debouncedCanvasStats, currentProject, projectId, dispatch]);

  // Project badalne par purana data saaf karein
  useEffect(() => {
    return () => {
      dispatch(clearAllContributionsFromState()); // Redux mein ek naya reducer
      loadedTilesRef.current.clear();
    };
  }, [projectId, dispatch]);

  const handleClearCanvas = () => {
    dispatch(clearCanvas({ projectId }));
    tilesRef.current.forEach((tile: any) => {
      tile.context.fillStyle = "#ffffff";
      tile.context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      tile.isDirty = true;
    });
  };
  // --- NEW HANDLERS to pass down as props ---

  const handleContributionHover = useCallback((contribution: any, pos: any) => {
    const artistName = contribution.userId?.fullName || " Artist";
    setTooltip({
      visible: true,
      x: pos.x,
      y: pos.y,
      text: `Contribution by: ${artistName}`,
    });
  }, []); // tooltip state ko direct set kar rahe hain, isliye dependency ki zaroorat nahi

  const handleContributionLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleCanvasStateChange = useCallback((newState: any) => {
    setCanvasStats((prev) => ({ ...prev, ...newState }));
  }, []); // Empty dependency array, yeh function kabhi nahi badlega

  const showLoginDialog = !!currentProject && !user && !loginDialogDismissed;
  const showJoinDialog = isJoinDialogOpen && !showLoginDialog;
  const isCurrentUserAContributor = useMemo(() => {
    if (!user || !currentProject?.contributors) {
      return false;
    }

    return currentProject.contributors.some((contributor: any) => {
      if (typeof contributor === "string") {
        return contributor === user._id;
      }
      if (typeof contributor === "object" && contributor?._id) {
        return contributor._id === user._id;
      }
      return false;
    });
  }, [currentProject, user]);

  const handleJoin = async () => {
    try {
      if (!user?._id) {
        toast.error("User ID is missing.");
        return;
      }

      await dispatch(joinProject({ projectId, userId: user._id })).unwrap();

      toast.success("You have joined the project! You can now contribute.");
    } catch (error: any) {
      console.error("Failed to join project:", error);
      // If your backend sends message in error.response.data.message or error.message
      const msg = error || "Failed to join the project. Please try again.";
      toast.error(msg);
    }
  };

  const handleGuestCanvasInteraction = useCallback(() => {
    console.log("A guest is trying to draw. Opening login modal.");
    setLoginDialogDismissed(false);
    // dispatch(openAuthModal()); // Auth modal ke liye
  }, [dispatch]);

  useEffect(() => {
    if (currentProject && user && !isCurrentUserAContributor && !isReadOnly) {
      setIsJoinDialogOpen(true);
    }
    if (isCurrentUserAContributor) {
      setIsJoinDialogOpen(false);
    }
  }, [currentProject, user, isCurrentUserAContributor]);

  useEffect(() => {
    if (isTimelapseOpen) {
      dispatch(generateTimelapseVideo({ projectId }));
    }
  }, [isTimelapseOpen, projectId, dispatch]);

  useEffect(() => {
    if (
      selectedContributionId &&
      listItemRefs.current[selectedContributionId]
    ) {
      // Step 3: Agar selected ID hai, to us element par scroll karo.
      listItemRefs.current[selectedContributionId].scrollIntoView({
        behavior: "smooth", // Smooth scrolling
        block: "center", // Element ko screen ke center mein laao
      });
    }
  }, [selectedContributionId]); // Yeh effect sirf tab chalega jab selection badlega.

  useLayoutEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setCanvasSize({
          width: canvasContainerRef.current.offsetWidth,
          height: canvasContainerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    console.log(`Fetching strokes for projectId: ${projectId}`);
    // dispatch(getContributionsByProject({ projectId }));

    // ya jab `projectId` badlega (naye data fetch hone se pehle).
    return () => {
      console.log("Cleaning up canvas for new project...");

      // 1. Redux store se purane strokes saaf karein
      dispatch(clearCanvasData());

      // 2. Component ke local state (tiles) ko saaf karein
      tilesRef.current.clear();

      // // 4. Viewport ko turant saaf karein taaki user ko blank canvas dikhe
      // const viewport = viewportCanvasRef.current;
      // if (viewport) {
      //     const ctx = viewport.getContext('2d')!;
      //     ctx.clearRect(0, 0, viewport.width, viewport.height);
      // }
    };
  }, [projectId, dispatch]);

  useEffect(() => {
    if (!projectId) return;

    const newSocket = io(import.meta.env.VITE_BASE, {
      // Connection ke waqt query parameters mein userId bhejein
      query: {
        userId: user?._id,
      },
    });
    setSocket(newSocket);

    newSocket.emit("join_project", projectId);

    // --- MOJOODA LISTENER ---
    newSocket.on("drawing_received", (newContribution) => {
      // YEH CONSOLE.LOG CHECK KAREIN
      console.log(
        "Received new contribution via socket on other client:",
        newContribution,
      );
      dispatch(addContributionFromSocket(newContribution));
    });

    // (2) Jab doosre user ka cursor move ho
    newSocket.on("cursor_update", (data) => {
      const { socketId, user, position } = data;
      // Naye cursor data ko state mein add/update karein
      setCursors((prevCursors) => ({
        ...prevCursors,
        [socketId]: { user, position },
      }));
    });

    // (3) Jab koi user chala jaye
    newSocket.on("user_left", (socketId) => {
      // Us user ke cursor ko state se hata dein
      setCursors((prevCursors: any) => {
        const newCursors = { ...prevCursors };
        delete newCursors[socketId];
        return newCursors;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [projectId, user, dispatch]);

  // === "SCROLL TO VIEW" ki LOGIC BHI YAHAN HAI ===
  useEffect(() => {
    // Yeh effect sirf tab chalega jab selection badlega
    if (selectedContributionId) {
      // (1) Sidebar ko kholein
      setIsSidebarOpen(true);

      // (2) Scroll karein
      const timer = setTimeout(() => {
        const element = listItemRefs.current[selectedContributionId];
        if (element) {
          console.log(
            `ProjectPage useEffect: Scrolling to ${selectedContributionId}`,
          );
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          console.warn(
            `ProjectPage useEffect: Element for ${selectedContributionId} not found.`,
          );
        }
      }, 300); // Animation ke liye delay

      return () => clearTimeout(timer);
    }
  }, [selectedContributionId]);

  useLayoutEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setCanvasSize({
          width: canvasContainerRef.current.offsetWidth,
          height: canvasContainerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  useEffect(() => {
    if (!socket) return;

    if (
      currentProject.status ===
      "Paused" /*|| currentProject.status === 'Completed'*/
    ) {
      navigate(`/projects`);
      toast.warning(
        "The project is no longer active. Redirecting to projects page.",
      );
    }
    const handleDeleteEvent = ({
      contributionId,
    }: {
      contributionId: string;
    }) => {
      console.log(
        `[Socket] Received delete event for contribution: ${contributionId}`,
      );
      // Socket se anay par UI foran update karein
      dispatch(removeContributionOptimistically({ contributionId }));
    };
    const handleContributorJoined = ({
      newContributor,
    }: {
      newContributor: any;
    }) => {
      console.log(`[Socket] New contributor joined:`, newContributor);
      // Jab naya contributor join kare, to usay Redux state mein add kar dein
      dispatch(addContributorToState(newContributor));
    };
    // --- YAHAN PAR ISTEMAL HO RAHA HAI ---
    const handleContributorRemoved = ({
      removedUserId,
    }: {
      removedUserId: string;
    }) => {
      console.log(
        `[Socket] Received event: Contributor ${removedUserId} was removed.`,
      );

      // Reducer ko dispatch karein taake UI update ho
      dispatch(removeContributorFromState({ removedUserId }));

      // Agar main khud remove hua hoon, to user ko batayein
      if (user?._id === removedUserId) {
        toast.warning(
          "Your contributor access for this project has been revoked.",
        );
      }
    };
    const handleContributionDeleted = ({
      contributionId,
    }: {
      contributionId: string;
    }) => {
      console.log(
        `[Socket] Received delete event for contribution: ${contributionId}`,
      );

      // Redux action ko dispatch karein taake UI foran update ho
      dispatch(removeContributionFromState({ contributionId }));

      // (Optional) Ek chota sa toaster dikhayein
      toast.info("A contribution was removed by an admin.");
    };
    const handleCanvasCleared = (data: { projectId: string }) => {
      // Safety check: Yaqeeni banayein ke event isi project ke liye hai
      if (data.projectId === projectId) {
        console.log(
          `[Socket] Received event: Canvas for project ${data.projectId} was cleared.`,
        );

        // Redux action ko dispatch karein taake UI foran update ho
        dispatch(clearAllContributionsFromState());

        // User ko ek saaf message dikhayein
        toast.warning("The canvas has been cleared by an admin.");
      }
    };
    const handleContributionsPurged = ({
      deletedContributionIds,
    }: {
      deletedContributionIds: string[];
    }) => {
      console.log(
        `[Socket] Received event: ${deletedContributionIds.length} contributions were purged.`,
      );

      // Reducer ko dispatch karein taake UI foran update ho
      dispatch(removeMultipleContributionsFromState(deletedContributionIds));

      toast.info(
        "A removed user's contributions have been cleared from the canvas.",
      );
    };

    const handleStatusUpdate =
      (newStatus: string) => (data: { projectId: string; message: string }) => {
        // Only act if the event is for the project we are currently viewing
        if (data.projectId === projectId) {
          console.log(`[Socket] Received project status change: ${newStatus}`);
          if (newStatus === "Paused") {
            toast.warning(
              "The project has been paused by an admin. Contributions are now disabled.",
            );
            navigate(`/projects`);
          }
          if (newStatus === "Completed") {
            toast.warning("The project has been Completed by an admin.");
            navigate(`/gallery`);
          }
          // Dispatch the action to update the status in the Redux state
          dispatch(
            updateProjectStatusInState({ projectId, status: newStatus }),
          );

          // Show a notification
          toast.info(data.message);
        }
      };
    const handleVoteUpdate = (data: { contribution: any }) => {
      console.log(
        `[Socket] Received vote update for contribution ${data.contribution._id}`,
      );

      // Dispatch the action to update the specific contribution in the Redux store
      dispatch(updateContributionInState(data.contribution));
    };
    const handleStrokesAdded = (data: {
      contributionId: string;
      newStrokes: any[];
    }) => {
      console.log(
        `[Socket] Received ${data.newStrokes.length} new strokes for contribution ${data.contributionId}`,
      );
      // Dispatch the new, efficient reducer
      dispatch(appendStrokesToContribution(data));
    };

    const onProjectPaused = handleStatusUpdate("Paused");
    const onProjectCompleted = handleStatusUpdate("Completed");
    const onProjectResumed = handleStatusUpdate("Active");

    socket.on("strokes_added", handleStrokesAdded);
    socket.on("vote_updated", handleVoteUpdate);
    socket.on("project_paused", onProjectPaused);
    socket.on("project_completed", onProjectCompleted);
    socket.on("project_resumed", onProjectResumed);
    socket.on("contributions_purged", handleContributionsPurged);
    socket.on("canvas_cleared", handleCanvasCleared);
    socket.on("contribution_deleted", handleContributionDeleted);
    socket.on("contributor_removed", handleContributorRemoved);
    socket.on("contributor_joined", handleContributorJoined);
    socket.on("contribution_deleted", handleDeleteEvent);

    return () => {
      socket.off("contribution_deleted", handleDeleteEvent);
      socket.off("contributor_joined", handleContributorJoined);
      socket.off("contributor_removed", handleContributorRemoved);
      socket.off("contribution_deleted", handleContributionDeleted);
      socket.off("canvas_cleared", handleCanvasCleared);
      socket.off("contributions_purged", handleContributionsPurged);
      socket.off("project_paused", onProjectPaused);
      socket.off("project_completed", onProjectCompleted);
      socket.off("project_resumed", onProjectResumed);
      socket.off("vote_updated", handleVoteUpdate);
      socket.off("strokes_added", handleStrokesAdded);
    };
  }, [socket, dispatch, user]);

  useLayoutEffect(() => {
    if (topControlsRef.current) {
      topControlsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  return (
    // Design ke mutabiq page ka background color
    <div
      ref={mainContentRef}
      className="relative min-h-screen bg-[#141414] p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-4 text-center mt-24">
          <h1 className="text-[28px] lg:text-[44.8px] font-serif !text-[#ffffff]">
            {projectName}
          </h1>
          <p className="text-[#8D6E63] !text-[#ffffff] italic lg:text-[19.2px]">
            {currentProject?.description}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column: Toolbox */}
          {!isReadOnly && <Toolbox boundaryRef={mainContentRef} />}
          {/* {!isReadOnly && <Toolbox2 boundaryRef={mainContentRef} />} */}

          {/* Right Column: Canvas & Actions */}
          <div className="flex-1 flex flex-col items-center">
            {/* Top Action Buttons */}

            <div className="flex justify-center gap-3">
              <button
                onClick={handleToggleCanvasSize}
                className="bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:bg-gradient-to-r hover:from-[#FEC133] hover:to-[#E23373] transition-colors duration-300 hidden text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2 rounded-full cursor-pointer xl:flex items-center gap-2"
                title={`Current display size: ${displaySize}px. Click to toggle.`}
              >
                <Code size={16} />
                Toggle Size
              </button>
              {user?.role == "admin" && (
                <div className="bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:bg-gradient-to-r hover:from-[#FEC133] hover:to-[#E23373] transition-colors duration-300 rounded-full p-0.5">
                  <button
                    onClick={handleGenerateTimelapse}
                    disabled={isGeneratingTimelapse}
                    className="bg-black text-white border-none text-[12px] md:text-[16px] p-2 md:px-4 md:py-2 rounded-full cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <MdTimelapse size={18} className="rotate-90" />
                    {isGeneratingTimelapse
                      ? "Generating..."
                      : "Create Timelapse"}
                  </button>
                </div>
              )}
              {user?.role == "admin" &&
                currentProject?.status !== "Completed" && (
                  <AlertDialog
                    open={isClearAlertOpen}
                    onOpenChange={setIsClearAlertOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        // 1. Button ko disable karein agar drawing save ho rahi hai
                        disabled={isContributionSaving || isClearingCanvas}
                        // 2. Title attribute se user ko wajah batayein (hover karne par dikhega)
                        title={
                          isSaving
                            ? "Cannot clear while a drawing is being saved"
                            : "Clear the entire canvas"
                        }
                        // 3. Styling add karein taake user ko pata chale ke button disabled hai
                        className="bg-[#BE0000] hover:bg-[#BE0000d0] transition-colors  text-white border-none text-[12px] md:text-[16px] px-2 py-2 md:px-4 md:py-2 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Clear Canvas
                      </button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="bg-[#0F0D0D] border border-white/10 text-white !font-sans rounded-[12px] shadow-2xl max-w-[500px] p-8">
                      <AlertDialogHeader className="gap-2">
                        <AlertDialogTitle className="text-2xl sm:text-[28px] font-semibold !text-white text-center">
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-[#E0E0E0] text-base leading-relaxed pt-2">
                          This action cannot be undone. This will permanently
                          delete all the drawings for the project{" "}
                          <strong className="text-white">{projectName}</strong>{" "}
                          from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex gap-4 sm:justify-center mt-6 w-full">
                        {/* Cancel Button */}
                        <AlertDialogCancel className="w-full sm:w-[180px] PY-1 rounded-full border border-white/20 bg-transparent hover:bg-white/5 hover:text-white text-white transition-colors uppercase tracking-wide text-sm font-semibold">
                          Cancel
                        </AlertDialogCancel>

                        {/* Continue Button (Destructive Action) */}
                        <AlertDialogAction
                          onClick={handleClearCanvas}
                          className="bg-[#BE0000] text-white hover:bg-[#B71C1C] px-5 py-1  text-sm font-medium rounded-full border-none transition-all min-w-[160px] cursor-pointer"
                        >
                          Yes, Clear Canvas
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
            </div>

            <div className="text-[1rem] lg:w-[93%] w-full bg-[#0F0D0D] text-[#ffffff] px-4 py-4 rounded-[5px] shadow-md mt-4 mb-6">
              <p>
                Use the mouse wheel to zoom, right-click to pan, and left click
                to draw when zoomed in to at least 100%.{" "}
                <span className="">
                  Drag the drawings tools and canvas info boxes to wherever you
                  like. Use the scale reference on the right and bottom sides of
                  the viewport to keep scale while drawing.
                </span>{" "}
              </p>
            </div>
            <div className="canvas-count !bg-[#0F0D0D]  w-[90%]   ">
              <div className="stat-item">
                <span className="stat-label  !text-[14.4px] !text-[#ffffff]">
                  Total Contributors:
                </span>
                <span
                  className="stat-value  !text-[14.4px] !text-[#ffffff]"
                  id="contributor-count"
                >
                  {totalContributors}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label !text-[14.4px] !text-[#ffffff]">
                  Pixels Painted:
                </span>
                <span
                  className="stat-value !text-[14.4px] !text-[#ffffff]"
                  id="pixel-count"
                >
                  {currentProject?.stats?.pixelCount}/104,857,600
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label !text-[14.4px] !text-[#ffffff]">
                  Canvas Size:
                </span>
                <span className="stat-value !text-[14.4px] !text-[#ffffff]">
                  2560px by 2560px
                </span>
              </div>
            </div>

            <div className="w-full md:w-2xl lg:w-4xl xl:w-6xl mx-auto overflow-x-auto mt-6 rounded-[12px] bg-[#0F0D0D] p-10  flex items-center justify-center">
              <div
                ref={canvasContainerRef}
                // className=' h-full w-[90%] xl:w-[1024px] min-h-[1024px] mt-6 bg-white relative overflow-hidden'
                className="relative mt-6 overflow-hidden bg-white"
                style={{
                  width: `${displaySize}px`,
                  height: `${displaySize}px`,

                  // border: '4px solid #4d2d2d',
                  maxWidth: "100%",
                }}
              >
                {canvasSize.width > 0 && (
                  <KonvaCanvas
                    socket={socket} // Naya prop
                    projectId={projectId}
                    userId={user?._id}
                    width={2560}
                    height={2560}
                    virtualWidth={currentProject.width}
                    virtualHeight={currentProject.height}
                    onStateChange={handleCanvasStateChange} // Callback function pass karein
                    selectedContributionId={selectedContributionId}
                    onContributionHover={handleContributionHover}
                    onContributionLeave={handleContributionLeave}
                    // onContributionSelect={setSelectedContributionId}
                    // onContributionSelect={handleCanvasClick}
                    setIsContributionSaving={setIsContributionSaving}
                    onGuestInteraction={handleGuestCanvasInteraction}
                    isContributor={isCurrentUserAContributor}
                    focusTarget={focusTarget} // <-- Pass the new state as a prop
                    onFocusComplete={() => setFocusTarget(null)} // <-- Add a callback to reset
                    isReadOnly={isReadOnly} // Naya prop pass karein
                    onContributionSelect={handleContributionSelect}
                    onClearHighlight={handleClearHighlight}
                    viewportWidth={canvasSize.width}
                    viewportHeight={canvasSize.height}
                  />
                )}
                {Object.entries(cursors as Record<string, CursorData>).map(
                  ([socketId, data]) => (
                    <div
                      key={socketId}
                      className="absolute z-50 pointer-events-none"
                      style={{
                        left: `${data.position.x}px`,
                        top: `${data.position.y}px`,
                        transition: "left 0.1s linear, top 0.1s linear", // Thori si smoothness ke liye
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ color: data.user?.color || "blue" }}
                      >
                        <path
                          d="M4 4l7.071 17.071-1.414 1.414-4.243-4.243-1.414-1.414L4 4z"
                          fill="currentColor"
                        />
                      </svg>
                      <span
                        className="bg-black text-white text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: data.user?.color || "blue",
                          marginLeft: "5px",
                        }}
                      >
                        {data.user?.name || "Guest"}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
            {!isReadOnly && (
              <InfoBox
                zoom={canvasStats.zoom}
                worldPos={canvasStats.worldPos}
                strokeCount={savedStrokes?.length || 0}
                isSaving={isContributionSaving}
                saveError={saveError}
                boundaryRef={mainContentRef} // <-- YEH PROP ADD KAREIN
              />
            )}
            {tooltip.visible && (
              <div
                className="absolute z-[100] bg-black text-white text-xs px-2 py-1 rounded-sm pointer-events-none"
                style={{
                  top: tooltip.y + 20, // Position below the cursor
                  left: tooltip.x + 20, // Position to the right of the cursor
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showJoinDialog} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="bg-[#0F0D0D] border border-white/10 text-white !font-sans rounded-[12px] shadow-2xl max-w-lg p-8">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-2xl sm:text-[28px] font-semibold !text-white text-center">
              Join as a Contributor
            </DialogTitle>
            <DialogDescription className="text-center text-[#E0E0E0] text-base leading-relaxed pt-2">
              By clicking "Agree and Continue", you agree to the project's terms
              of contribution. Your artwork will become part of this
              collaborative canvas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 sm:justify-center mt-6 w-full">
            <DialogClose asChild>
              <button className="relative rounded-full p-[1px] bg-gradient-to-r from-[#E23373] to-[#FEC133] group overflow-hidden shrink-0 min-w-[120px]">
                <div className="bg-[#0F0D0D] rounded-full px-6 py-2.5 h-full w-full group-hover:bg-white/10 transition-colors flex items-center justify-center">
                  <span className="text-white font-medium text-sm">Cancel</span>
                </div>
              </button>
            </DialogClose>
            <Button
              onClick={handleJoin}
              disabled={loading.joining}
              className="bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white hover:opacity-90 px-8 py-2.5 h-auto text-sm font-medium rounded-full border-none transition-all disabled:opacity-50 min-w-[160px]"
            >
              {loading.joining ? "Joining..." : "Agree and Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- "LOGIN TO CONTRIBUTE" DIALOG --- */}
      <Dialog
        open={showLoginDialog}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setLoginDialogDismissed(true); // Agar dialog band ho, to usay dismiss mark kar dein
          }
        }}
      >
        <DialogContent className="bg-[#0F0D0D] border border-white/10 text-white !font-sans rounded-[12px] shadow-2xl max-w-[480px] p-8">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-2xl sm:text-[28px] font-semibold !text-white text-center">
              Want to Contribute?
            </DialogTitle>
            <DialogDescription className="text-center text-[#E0E0E0] text-base leading-relaxed pt-2">
              To paint, vote, or join this project, you need to be logged in.
              You can continue to browse as a guest.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 sm:justify-center mt-6 w-full">
            {/* DialogClose ab "Stay as Guest" ka kaam karega */}
            <DialogClose asChild>
              <button className="relative rounded-full p-[1px] bg-gradient-to-r from-[#E23373] to-[#FEC133] group overflow-hidden shrink-0 min-w-[140px]">
                <div className="bg-[#0F0D0D] rounded-full px-6 py-2.5 h-full w-full group-hover:bg-white/10 transition-colors flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    Stay as Guest
                  </span>
                </div>
              </button>
            </DialogClose>
            <Button
              onClick={() => {
                navigate("/login");
                setLoginDialogDismissed(true);
              }}
              className="bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white hover:opacity-90 px-8 py-2.5 h-auto text-sm font-medium rounded-full border-none transition-all disabled:opacity-50 min-w-[160px]"
            >
              Login or Sign Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContributionSidebar
        projectId={projectId}
        contributions={contributions}
        selectedContributionId={selectedContributionId}
        isContributor={isCurrentUserAContributor} // <-- ADD THIS PROP
        // onContributionSelect={setSelectedContributionId}
        canvasStats={canvasStats}
        infoBoxData={{
          strokeCount: savedStrokes.length,
          isSaving: isSaving,
          saveError: saveError,
        }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        listItemRefs={listItemRefs}
        onGuestVoteAttempt={handleGuestCanvasInteraction}
        isReadOnly={isReadOnly} // Naya prop pass karein
        // onContributionSelect={handleSidebarContributionSelect} // Sidebar ko apna alag function dein
        onContributionSelect={handleContributionSelect} // <-- Sidebar se click ke liye
      />
      <Dialog open={isTimelapseOpen} onOpenChange={handleModalClose}>
        <DialogContent
          className={`
            bg-[#0F0D0D] border-2 border-gray-500 z-[9999] text-white p-0
            transition-all duration-300 ease-in-out
            ${
              isTimelapseFullscreen
                ? "fixed inset-0 w-full h-full max-w-full  max-h-full rounded-none" // Fullscreen styles
                : "sm:max-w-xl md:max-w-2xl lg:max-w-4xl !h-[95vh]" // Default modal styles
            }
        `}
        >
          <DialogHeader>
            <DialogTitle className="text-lg lg:text-2xl !text-white text-center pt-3">
              Project Timelapse
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-[400px] flex justify-center items-center p-4">
            {isGenerating && (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg">Generating your timelapse...</p>
                <p className="text-sm text-gray-400">
                  This might take a moment.
                </p>
              </div>
            )}

            {!isGenerating && generationError && (
              <div className="text-center text-red-400">
                {/* <h3 className="text-xl font-bold !text-white mb-2">Error!</h3> */}
                {/* <p>Failed to generate the timelapse.</p> */}
                <p className="text-lg text-white mt-1">{generationError}</p>
              </div>
            )}

            {/* Case 3: Success State (Video Ready) */}
            {!isGenerating && timelapseUrl && (
              <video
                key={timelapseUrl}
                src={`${import.meta.env.VITE_BASE}${timelapseUrl}`}
                controls
                autoPlay
                muted
                playsInline
                className={`
                        w-full h-auto rounded-lg
                        ${
                          isTimelapseFullscreen
                            ? "max-h-screen" // Allow full screen height
                            : "max-h-[80vh]" // Default max height
                        }
                    `}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectPage;
