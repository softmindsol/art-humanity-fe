import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "@/redux/store";
import {
  selectTimelapseUrl,
  selectIsLoadingOperation,
  selectErrorForOperation,
  selectCanvasData,
} from "@/redux/slice/contribution"; // <-- apne project ke selectors import karein

export function useCanvas() {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });
  const [selectedContributionId, setSelectedContributionId] = useState<
    string | null
  >(null);
  const [isGeneratingTimelapse, _] = useState(false);
  const listItemRefs = useRef<Record<string, HTMLElement | null>>({});
  const {  loading } = useSelector(
    (state: RootState) => state.projects
  );


    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [loginDialogDismissed, setLoginDialogDismissed] = useState(false);

  // --- Read-only mode check ---
  const [searchParams] = useSearchParams();
  const isReadOnly = searchParams.get("view") === "gallery";

  const [isTimelapseOpen, setIsTimelapseOpen] = useState(false);

  // --- Redux state for Timelapse ---
  const timelapseUrl = useSelector(selectTimelapseUrl);
  const isGenerating = useSelector(
    selectIsLoadingOperation("generateTimelapse")
  );
  const generationError = useSelector(
    selectErrorForOperation("generateTimelapse")
  );

  // --- Canvas strokes & saving state ---
      const contributions = useSelector(selectCanvasData);
  const savedStrokes = useSelector(selectCanvasData);
  const isSaving = useSelector(selectIsLoadingOperation("createContribution"));
  const saveError = useSelector(selectErrorForOperation("createContribution"));

  // --- Cursor state ---
  const [cursors, setCursors] = useState<Record<string, any>>({});

  return {
    isSidebarOpen, setIsSidebarOpen,
    canvasContainerRef,
    socket,
    setSocket,
    canvasSize,
    setCanvasSize,
    tooltip,
    setTooltip,
    selectedContributionId,
    setSelectedContributionId,
    isGeneratingTimelapse,
    listItemRefs,
    loading,
    isJoinDialogOpen,
    setIsJoinDialogOpen,
    loginDialogDismissed,
    setLoginDialogDismissed,
    isReadOnly,
    isTimelapseOpen,
    setIsTimelapseOpen,
    timelapseUrl,
    isGenerating,
    generationError,
    savedStrokes,
    contributions,
    isSaving,
    saveError,
    cursors,
    setCursors,
  };
}
