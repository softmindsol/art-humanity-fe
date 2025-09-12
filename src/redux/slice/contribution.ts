// redux/slice/paintPixel.js

import { createSlice } from "@reduxjs/toolkit";
// Naye aur zaroori thunks ko import karein
import {
  getContributionsByProject,
  generateTimelapseVideo,
  clearCanvas,
  voteOnContribution,
  deleteContribution,
  batchCreateContributions,
  fetchContributionsByTiles,
} from "../action/contribution";

// Naya, saaf suthra initialState
const initialState = {
  // canvasData ab contributions ka array store karega
  canvasData: [],
  timelapseVideoUrl: null,
  pendingStrokes: [],

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
  pagination: {
    currentPage: 0,
    totalPages: 1,
    totalContributions: 0,
  },
  // Nayi, simplified loading states
  loading: {
    createContribution: false,
    getContributions: false,
    voteOnContribution: false,
    deleteContribution: false,
    batchCreateContributions: false, // <--- YEH LINE ADD KAREIN

    clearCanvas: false,
    generateTimelapse: false,
  },

  // Nayi, simplified error states
  error: {
    createContribution: null,
    getContributions: null,
    clearCanvas: null,
    batchCreateContributions: null, // <--- YEH LINE ADD KAREIN

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
    setCurrentBrush: (state, action) => {
      // mode: 'brush', 'eraser', ya 'line' ho sakta hai
      state.currentBrush = { ...state.currentBrush, ...action.payload };
    },

    updateVoteFromSocket: (state: any, action) => {
      const { wasDeleted, contributionId, ...updatedContribution } =
        action.payload;

      if (wasDeleted) {
        // Agar contribution delete ho gayi hai, to usay state se nikaal dein
        state.canvasData = state.canvasData.filter(
          (c: any) => c._id !== contributionId
        );
      } else {
        // Warna, us contribution ko dhoond kar update karein
        const index = state.canvasData.findIndex(
          (c: any) => c._id === updatedContribution._id
        );
        if (index !== -1) {
          state.canvasData[index] = updatedContribution;
        }
      }
    },
    // Yeh reducer socket se anay wale data ke liye hai
    addContributionFromSocket: (state: any, action) => {
      const newContribution = action.payload;
      const exists = state.canvasData.some(
        (c: any) => c._id === newContribution._id
      );
      if (!exists) {
        state.canvasData.push(newContribution);
      }
    },
    clearTimelapseUrl: (state) => {
      state.timelapseVideoUrl = null;
    },
    clearCanvasData: (state) => {
      state.canvasData = [];
    },
    addMultipleContributionsOptimistically: (state: any, action) => {
      // action.payload mein temporary contributions ka poora array aayega
      state.canvasData.push(...action.payload);
    },
    removeOptimisticContributions: (state, action) => {
      const tempIdsToRemove = new Set(action.payload);
      state.canvasData = state.canvasData.filter(
        (c: any) => !tempIdsToRemove.has(c._id)
      );
    },
    removeContributionOptimistically: (state, action) => {
      const { contributionId } = action.payload;
      state.canvasData = state.canvasData.filter(
        (c: any) => c._id !== contributionId
      );
    },
    // --- YEH ACTION AB PENDING STROKES MEIN ADD KAREGA ---
    addPendingContribution: (state: any, action: any) => {
      state.pendingStrokes.push(action.payload) as any;
    },
    // --- YEH ACTION PENDING STROKES KO SAAF KAREGA ---
    clearPendingStrokes: (state) => {
      state.pendingStrokes = [];
    },
    removeContributionFromState: (state, action) => {
      const { contributionId } = action.payload;
      state.canvasData = state.canvasData.filter(
        (c: any) => c._id !== contributionId
      );
    },
    clearAllContributionsFromState: (state) => {
      state.canvasData = [];
    },
    removeMultipleContributionsFromState: (state, action) => {
      const idsToRemove = new Set(action.payload);

      // This line will no longer crash because state.canvasData is guaranteed to be an array
      const newCanvasData = state.canvasData.filter(
        (contribution: any) => !idsToRemove.has(contribution._id)
      );

      state.canvasData = newCanvasData;
    },
  },

  extraReducers: (builder) => {
    // Create Contribution
    builder

      .addCase(getContributionsByProject.pending, (state) => {
        state.loading.getContributions = true;
        state.error.getContributions = null;
      })
      .addCase(
        getContributionsByProject.fulfilled,
        (state: any, action: any) => {
          const { contributions, currentPage, totalPages, totalContributions } =
            action.payload;

          // Check if it's the first page or subsequent pages, and update the canvasData accordingly
          if (currentPage === 1) {
            state.canvasData = contributions; // Reset the data for the first page
          } else {
            state.canvasData = [...state.canvasData, ...contributions]; // Append for next pages
          }

          // Update pagination information
          state.pagination = { currentPage, totalPages, totalContributions };

          state.loading.getContributions = false;
        }
      )
      .addCase(getContributionsByProject.rejected, (state, action) => {
        state.loading.getContributions = false;
        state.error.getContributions = action.payload as any;
      })

      // --- THIS IS THE FIX ---
      .addCase(batchCreateContributions.pending, (state) => {
        state.loading.batchCreateContributions = true;
        state.error.batchCreateContributions = null;
      })
      // .addCase(
      //   batchCreateContributions.fulfilled,
      //   (state: any, action: any) => {
      //     state.loading.batchCreateContributions = false; // <-- YEH NAYI LINE HAI

      //     const savedContributions = action.payload; // These are the real contributions from the server

      //     // 1. Find and remove the temporary optimistic updates
      //     const tempIds = new Set(savedContributions.map((c: any) => c.tempId));
      //     state.canvasData = state.canvasData.filter(
      //       (c: any) => !tempIds.has(c._id)
      //     );

      //     // 2. Add the final, saved contributions from the server
      //     state.canvasData.push(...savedContributions);
      //   }
      // )
      // .addCase(batchCreateContributions.rejected, (state, action: any) => {
      //   state.loading.batchCreateContributions = false; // <-- YEH NAYI LINE HAI

      //   // we should roll back the optimistic update.
      //   const failedTempIds = new Set(
      //     action.meta.arg.contributions.map((c: any) => c.tempId)
      //   );
      //   state.canvasData = state.canvasData.filter(
      //     (c: any) => !failedTempIds.has(c._id)
      //   );
      // });
      // .addCase(batchCreateContributions.fulfilled, (state: any, action) => {
      //   // `action.payload` is the array of real contributions from the server,
      //   // and each one has a `tempId`.
      //   const savedContributions = action.payload;

      //   savedContributions.forEach((realContrib: any) => {
      //     // Find the index of the temporary, optimistic contribution in our state
      //     const index = state.canvasData.findIndex(
      //       (optimisticContrib: any) =>
      //         optimisticContrib._id === realContrib.tempId
      //     );

      //     if (index !== -1) {
      //       // If we found it, replace the temporary one with the real one
      //       state.canvasData[index] = realContrib;
      //     } else {
      //       // As a fallback (in case the optimistic one wasn't found), add it.
      //       state.canvasData.push(realContrib);
      //     }
      //   });

      //   state.loading.saving = false; // Or whatever your loading state is
      // })

      .addCase(batchCreateContributions.fulfilled, (state: any, action) => {
        // action.payload mein server se anay wali contributions hain
        const savedContributions = action.payload;

        // In nayi, kamyab contributions ko state mein add kar do
        state.canvasData.push(...savedContributions);
        // Aur pending strokes ko saaf kar dein
        state.pendingStrokes = [];
        // loading state ko update karein (agar hai)
        state.loading.saving = false;
      })

      .addCase(batchCreateContributions.rejected, (state: any, action: any) => {
        state.pendingStrokes = [];

        // It's also important to remove the temporary card if the server fails
        const failedTempIds = new Set(
          action.meta.arg.contributions.map((c: any) => c.tempId)
        );
        state.canvasData = state.canvasData.filter(
          (c: any) => !failedTempIds.has(c._id)
        );
        state.loading.saving = false;
      });

    builder
      .addCase(deleteContribution.pending, (state: any) => {
        state.loading.getContributions = false;
        // state.error.getContributions = action.payload as any;
      })
      .addCase(deleteContribution.fulfilled, (state, action) => {
        state.loading.deleteContribution = false;
        const { contributionId } = action.payload;
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
        state.timelapseVideoUrl = null; // Purana URL saaf karein
      })
      .addCase(generateTimelapseVideo.fulfilled, (state, action) => {
        state.loading.generateTimelapse = false;
        // action.payload mein { videoUrl: '...' } aayega
        state.timelapseVideoUrl = action.payload.videoUrl;
      })
      .addCase(generateTimelapseVideo.rejected, (state, action) => {
        state.loading.generateTimelapse = false;
        state.error.generateTimelapse = action.payload as any;
        console.log("state.error.generateTimelapse:", action.payload);
        console.log("state.error.message:", action.payload);
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

      builder
        // --- YEH NAYA CASE HAI ---
        .addCase(
          fetchContributionsByTiles.fulfilled,
          (state: any, action: any) => {
            const newContributions = action.payload;

            // Naye data ko purane data ke saath merge karein, duplicates ko rokein
            const existingIds = new Set(
              state.canvasData.map((c: any) => c._id)
            );
            const uniqueNewContributions = newContributions.filter(
              (c:any) => !existingIds.has(c._id)
            );

            state.canvasData.push(...uniqueNewContributions);
          }
        );
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
  updateVoteFromSocket,
  addContributionFromSocket,
  setCurrentBrush,
  addMultipleContributionsOptimistically, // Isay export karein
  removeContributionOptimistically,
  addPendingContribution,
  clearPendingStrokes,
  removeContributionFromState,
  clearAllContributionsFromState,
  removeMultipleContributionsFromState 
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
export const selectPaginationInfo = (state: any) => state.paintPixel.pagination;
export const selectPendingStrokes = (state: any) =>
  state.paintPixel.pendingStrokes;

export default paintPixelSlice.reducer;
