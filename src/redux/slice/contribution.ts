// redux/slice/paintPixel.js

import { createSlice } from "@reduxjs/toolkit";
// Naye aur zaroori thunks ko import karein
import {
  createContribution,
  getContributionsByProject,
  generateTimelapseVideo,
  clearCanvas,
  voteOnContribution,
  deleteContribution,
} from "../action/contribution";

// Naya, saaf suthra initialState
const initialState = {
  // canvasData ab contributions ka array store karega
  canvasData: [],
  timelapseVideoUrl: null,

  currentBrush: {
    size: 3,
    color: { r: 0, g: 0, b: 0, a: 1 },
    mode: "brush",
  },
  currentCanvas: {
    resolution: 1,
    size: 1024,
    zoomLevel: 1,
    offset: { x: 0, y: 0 },
  },

  // Nayi, simplified loading states
  loading: {
    createContribution: false,
    getContributions: false,
    voteOnContribution: false,
    deleteContribution: false,
    clearCanvas: false,
    generateTimelapse: false,
  },

  // Nayi, simplified error states
  error: {
    createContribution: null,
    getContributions: null,
    clearCanvas: null,
    generateTimelapse: null,
    voteOnContribution: null,
    deleteContribution: null,
  },
};

const paintPixelSlice = createSlice({
  name: "paintPixel",
  initialState,
  reducers: {
    // Synchronous reducers
    setBrushSize: (state, action) => {
      state.currentBrush.size = action.payload;
    },
    setBrushColor: (state, action) => {
      state.currentBrush.color = action.payload;
    },
    setBrushMode: (state, action) => {
      state.currentBrush.mode = action.payload;
    },
    setZoomLevel: (state, action) => {
      state.currentCanvas.zoomLevel = action.payload;
    },
    setCanvasOffset: (state, action) => {
      state.currentCanvas.offset = action.payload;
    },
    clearTimelapseUrl: (state) => {
      state.timelapseVideoUrl = null;
    },
    clearCanvasData: (state) => {
      state.canvasData = [];
    },
  },

  extraReducers: (builder) => {

    // Create Contribution
    builder
      .addCase(createContribution.pending, (state) => {
        state.loading.createContribution = true;
        state.error.createContribution = null;
      })
      .addCase(createContribution.fulfilled, (state: any, action) => {
        state.loading.createContribution = false;
        state.canvasData.push(action.payload);
      })
      .addCase(createContribution.rejected, (state, action) => {
        state.loading.createContribution = false;
        state.error.createContribution = action.payload as any;
      });

    // Get Contributions By Project
    builder
      .addCase(getContributionsByProject.pending, (state) => {
        state.loading.getContributions = true;
        state.error.getContributions = null;
      })
      .addCase(getContributionsByProject.fulfilled, (state, action) => {
        state.loading.getContributions = false;
        state.canvasData = action.payload;
      })
      .addCase(getContributionsByProject.rejected, (state, action) => {
        state.loading.getContributions = false;
        state.error.getContributions = action.payload as any;
      });

       builder
         .addCase(deleteContribution.pending, (state:any) => {
            state.loading.getContributions = false;
            // state.error.getContributions = action.payload as any;
         })
         .addCase(deleteContribution.fulfilled, (state, action) => {
           state.loading.deleteContribution = false;
           const { contributionId } = action.payload;
           // canvasData array se deleted contribution ko nikaal dein
           state.canvasData = state.canvasData.filter(
             (contrib: any) => contrib._id !== contributionId
           );
         })
         .addCase(deleteContribution.rejected, (state, action) => {
          state.loading.getContributions = false;
          state.error.getContributions = action.payload as any;
         });

        builder
          .addCase(voteOnContribution.pending, (state) => {
            state.loading.voteOnContribution = true;
            state.error.voteOnContribution = null;
          })
          .addCase(voteOnContribution.fulfilled, (state: any, action) => {
            state.loading.voteOnContribution = false;

            const responseData = action.payload;

            // --- NAYI LOGIC YAHAN HAI ---
            // Check karein ke kya contribution delete ho gaya tha
            if (responseData.wasDeleted) {
              // Agar haan, to usay `canvasData` array se nikaal dein
              state.canvasData = state.canvasData.filter(
                (contrib: any) => contrib._id !== responseData.contributionId
              );
            }
            // Agar delete nahi hua, to purani logic istemal karein
            else {
              const updatedContribution = responseData;
              const index = state.canvasData.findIndex(
                (contrib: any) => contrib._id === updatedContribution._id
              );
              if (index !== -1) {
                state.canvasData[index] = updatedContribution;
              }
            }
          })
          .addCase(voteOnContribution.rejected, (state, action) => {
            state.loading.voteOnContribution = false;
            state.error.voteOnContribution = action.payload as any;
          });

    // Generate Timelapse
    builder
      .addCase(generateTimelapseVideo.pending, (state) => {
        state.loading.generateTimelapse = true;
        state.error.generateTimelapse = null;
        state.timelapseVideoUrl = null;
      })
      .addCase(generateTimelapseVideo.fulfilled, (state, action) => {
        state.loading.generateTimelapse = false;
        if (action.payload.success) {
          state.timelapseVideoUrl = action.payload.videoUrl;
        }
      })
      .addCase(generateTimelapseVideo.rejected, (state, action) => {
        state.loading.generateTimelapse = false;
        state.error.generateTimelapse = action.payload as any;
      });

    // Clear Canvas
    builder
      .addCase(clearCanvas.pending, (state) => {
        state.loading.clearCanvas = true;
        state.error.clearCanvas = null;
      })
      .addCase(clearCanvas.fulfilled, (state) => {
        state.loading.clearCanvas = false;
        state.canvasData = [];
      })
      .addCase(clearCanvas.rejected, (state, action) => {
        state.loading.clearCanvas = false;
        state.error.clearCanvas = action.payload as any;
      });
  },
});

// Export actions
export const {
  setBrushSize,
  setBrushColor,
  setBrushMode,
  setZoomLevel,
  setCanvasOffset,
  clearTimelapseUrl,
  clearCanvasData,
} = paintPixelSlice.actions;

// Selectors
export const selectCanvasData = (state: any) => state.paintPixel.canvasData;
export const selectCurrentBrush = (state: any) => state.paintPixel.currentBrush;
export const selectCurrentCanvas = (state: any) =>
  state.paintPixel.currentCanvas;
export const selectIsLoadingOperation = (operation: any) => (state: any) =>
  state.paintPixel.loading[operation];
export const selectErrorForOperation = (operation: any) => (state: any) =>
  state.paintPixel.error[operation];
export const selectTimelapseUrl = (state: any) =>
  state.paintPixel.timelapseVideoUrl;

export default paintPixelSlice.reducer;
