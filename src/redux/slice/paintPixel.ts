import { createSlice } from "@reduxjs/toolkit";
import { batchCreateStrokes, clearCanvas, createStroke, exportCanvas, getCanvasData, getCanvasStats, getTileData, importCanvas } from "../action/painPixel";

// Async Thunks for API calls

// Initial state
const initialState = {
  // Canvas data
  canvasData: [],
  currentSessionId: null,

  // Tile data cache
  tileData: {},

  // Canvas statistics
  canvasStats: null,

  // Export/Import data
  exportData: null,

  // UI state
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

  // Loading states
  loading: {
    createStroke: false,
    batchCreateStrokes: false,
    getCanvasData: false,
    clearCanvas: false,
    getTileData: false,
    getCanvasStats: false,
    exportCanvas: false,
    importCanvas: false,
  },

  // Error states
  error: {
    createStroke: null,
    batchCreateStrokes: null,
    getCanvasData: null,
    clearCanvas: null,
    getTileData: null,
    getCanvasStats: null,
    exportCanvas: null,
    importCanvas: null,
  },
};

// Paint Pixel slice
const paintPixelSlice = createSlice({
  name: "paintPixel",
  initialState,
  reducers: {
    // Synchronous actions
    setCurrentSessionId: (state, action) => {
      state.currentSessionId = action.payload;
    },

    setBrushSize: (state, action) => {
      state.currentBrush.size = action.payload;
    },

    setBrushColor: (state, action) => {
      state.currentBrush.color = action.payload;
    },

    setBrushMode: (state, action) => {
      state.currentBrush.mode = action.payload;
    },

    setCanvasResolution: (state, action) => {
      state.currentCanvas.resolution = action.payload;
    },

    setCanvasSize: (state, action) => {
      state.currentCanvas.size = action.payload;
    },

    setZoomLevel: (state, action) => {
      state.currentCanvas.zoomLevel = action.payload;
    },

    setCanvasOffset: (state, action) => {
      state.currentCanvas.offset = action.payload;
    },

    clearTileCache: (state: any) => {
      state.tileData = {};
    },

    clearErrors: (state: any) => {
      Object.keys(state.error).forEach((key) => {
        state.error[key] = null;
      });
    },

    // Add stroke locally (for optimistic updates)
    addStrokeLocally: (state: any, action) => {
      state.canvasData.push(action.payload);
    },

    // Add multiple strokes locally
    addStrokesLocally: (state: any, action) => {
      state.canvasData.push(...action.payload);
    },
  },

  extraReducers: (builder) => {
    // Create Stroke
    builder
      .addCase(createStroke.pending, (state: any) => {
        state.loading.createStroke = true;
        state.error.createStroke = null;
      })
      .addCase(createStroke.fulfilled, (state: any, action) => {
        state.loading.createStroke = false;
        if (action.payload.success) {
          state.canvasData.push(action.payload.data);
          if (action.payload.sessionId) {
            state.currentSessionId = action.payload.sessionId;
          }
        }
      })
      .addCase(createStroke.rejected, (state, action) => {
        state.loading.createStroke = false;
        state.error.createStroke = action.payload as any;
      });

    // Batch Create Strokes
    builder
      .addCase(batchCreateStrokes.pending, (state: any) => {
        state.loading.batchCreateStrokes = true;
        state.error.batchCreateStrokes = null;
      })
      .addCase(batchCreateStrokes.fulfilled, (state: any, action) => {
        state.loading.batchCreateStrokes = false;
        if (action.payload.success) {
          state.canvasData.push(...action.payload.data);
          if (action.payload.sessionId) {
            state.currentSessionId = action.payload.sessionId;
          }
        }
      })
      .addCase(batchCreateStrokes.rejected, (state, action) => {
        state.loading.batchCreateStrokes = false;
        state.error.batchCreateStrokes = action.payload as any;
      });

    // Get Canvas Data
    builder
      .addCase(getCanvasData.pending, (state: any) => {
        state.loading.getCanvasData = true;
        state.error.getCanvasData = null;
      })
      .addCase(getCanvasData.fulfilled, (state, action) => {
        state.loading.getCanvasData = false;
        if (action.payload.success) {
          state.canvasData = action.payload.data;
        }
      })
      .addCase(getCanvasData.rejected, (state, action) => {
        state.loading.getCanvasData = false;
        state.error.getCanvasData = action.payload as any;
      });

    // Clear Canvas
    builder
      .addCase(clearCanvas.pending, (state: any) => {
        state.loading.clearCanvas = true;
        state.error.clearCanvas = null;
      })
      .addCase(clearCanvas.fulfilled, (state, action) => {
        state.loading.clearCanvas = false;
        if (action.payload.success) {
          state.canvasData = [];
          state.tileData = {};
        }
      })
      .addCase(clearCanvas.rejected, (state, action) => {
        state.loading.clearCanvas = false;
        state.error.clearCanvas = action.payload as any;
      });

    // Get Tile Data
    builder
      .addCase(getTileData.pending, (state: any) => {
        state.loading.getTileData = true;
        state.error.getTileData = null;
      })
      .addCase(getTileData.fulfilled, (state: any, action) => {
        state.loading.getTileData = false;
        if (action.payload.success) {
          const { tileX, tileY } = action.payload.tileInfo;
          const tileKey = `${tileX},${tileY}`;
          state.tileData[tileKey] = action.payload.data;
        }
      })
      .addCase(getTileData.rejected, (state, action) => {
        state.loading.getTileData = false;
        state.error.getTileData = action.payload as any;
      });

    // Get Canvas Stats
    builder
      .addCase(getCanvasStats.pending, (state: any) => {
        state.loading.getCanvasStats = true;
        state.error.getCanvasStats = null;
      })
      .addCase(getCanvasStats.fulfilled, (state, action) => {
        state.loading.getCanvasStats = false;
        if (action.payload.success) {
          state.canvasStats = action.payload.data;
        }
      })
      .addCase(getCanvasStats.rejected, (state, action) => {
        state.loading.getCanvasStats = false;
        state.error.getCanvasStats = action.payload as any;
      });

    // Export Canvas
    builder
      .addCase(exportCanvas.pending, (state: any) => {
        state.loading.exportCanvas = true;
        state.error.exportCanvas = null;
      })
      .addCase(exportCanvas.fulfilled, (state, action) => {
        state.loading.exportCanvas = false;
        if (action.payload.success) {
          state.exportData = action.payload;
        }
      })
      .addCase(exportCanvas.rejected, (state, action) => {
        state.loading.exportCanvas = false;
        state.error.exportCanvas = action.payload as any;
      });

    // Import Canvas
    builder
      .addCase(importCanvas.pending, (state: any) => {
        state.loading.importCanvas = true;
        state.error.importCanvas = null;
      })
      .addCase(importCanvas.fulfilled, (state, action) => {
        state.loading.importCanvas = false;
        if (action.payload.success) {
          // Refresh canvas data after import
          state.canvasData = [];
          state.tileData = {};
        }
      })
      .addCase(importCanvas.rejected, (state, action) => {
        state.loading.importCanvas = false;
        state.error.importCanvas = action.payload as any;
      });
  },
});

// Export actions
export const {
  setCurrentSessionId,
  setBrushSize,
  setBrushColor,
  setBrushMode,
  setCanvasResolution,
  setCanvasSize,
  setZoomLevel,
  setCanvasOffset,
  clearTileCache,
  clearErrors,
  addStrokeLocally,
  addStrokesLocally,
} = paintPixelSlice.actions;

// Selectors
export const selectCanvasData = (state: any) => state?.paintPixel?.canvasData;
export const selectCurrentSessionId = (state: any) =>
  state?.paintPixel?.currentSessionId;
export const selectTileData = (state:any) => state?.paintPixel?.tileData;
export const selectCanvasStats = (state: any) => state?.paintPixel?.canvasStats;
export const selectExportData = (state: any) => state?.paintPixel?.exportData;
export const selectCurrentBrush = (state: any) => state?.paintPixel?.currentBrush;
export const selectCurrentCanvas = (state: any) => state?.paintPixel?.currentCanvas;
export const selectLoading = (state: any) => state?.paintPixel?.loading;
export const selectErrors = (state: any) => state?.paintPixel?.error;

// Get specific tile data
export const selectTileDataByCoordinates =
  (tileX: any, tileY: any) => (state: any) => {
    const tileKey = `${tileX},${tileY}`;
    return state?.paintPixel?.tileData[tileKey] || [];
  };

// Check if any operation is loading
export const selectIsAnyLoading = (state:any) => {
  return Object.values(state?.paintPixel?.loading).some((loading) => loading);
};

// Get specific loading state
export const selectIsLoadingOperation = (operation: any) => (state: any) => {
  return state?.paintPixel?.loading[operation] || false;
};

// Get specific error
export const selectErrorForOperation = (operation: any) => (state: any) => {
  return state?.paintPixel?.error[operation];
};

export default paintPixelSlice.reducer;
