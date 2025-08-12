import api from "@/api/api";
import { config } from "@/utils/endpoints";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Create a single stroke
export const createStroke = createAsyncThunk(
  "paintPixel/createStroke",
  async (strokeData: any, thunkAPI) => {
    try {
      const response = await api.post(`/stroke`, strokeData);
      console.log("hello")
      return response.data; // backend returns { success: true, data: {...} }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create stroke"
      );
    }
  }
);

export const generateTimelapseVideo = createAsyncThunk(
  "paintPixel/generateTimelapse",
  async ({ sessionId }: { sessionId: string }, thunkAPI) => {
    try {
      // API endpoint ko call karein. Response mein video ka URL aayega.
      const response = await api.get(`/timelapse/${sessionId}`);
      console.log("Timelapse generation response:", response.data);
      return response.data; // Yeh { success: true, videoUrl: '...' } return karega
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to generate timelapse"
      );
    }
  }
);

export const getCanvasData = createAsyncThunk(
  "paintPixel/getCanvasData",
  async ({ canvasId }: { canvasId: string }, thunkAPI) => {
    try {
      const response = await api.get(`/canvas/${canvasId}`);
      return response.data.data; // Backend se strokes ka array return hoga
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch canvas data"
      );
    }
  }
);

// Batch create multiple strokes
export const batchCreateStrokes = createAsyncThunk(
  "paintPixel/batchCreateStrokes",
  async (strokesData: any, thunkAPI) => {
    try {
      const response = await api.post(`/strokes/batch`, { strokes: strokesData });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to batch create strokes"
      );
    }
  }
);

// Get canvas data
// export const getCanvasData = createAsyncThunk(
//   "paintPixel/getCanvasData",
//   async ({ sessionId, canvasResolution = 1, limit = 1000, offset = 0 }: any, thunkAPI) => {
//     try {
//       const params = new URLSearchParams({
//         canvasResolution: canvasResolution.toString(),
//         limit: limit.toString(),
//         offset: offset.toString(),
//       });
//       const response = await api.get(`/canvas/${sessionId}?${params}`);
//       return response.data;
//     } catch (error: any) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data?.message || "Failed to fetch canvas data"
//       );
//     }
//   }
// );

// Clear canvas
export const clearCanvas = createAsyncThunk(
  "paintPixel/clearCanvasAPI",
  async ({ canvasId }: { canvasId: string }, thunkAPI) => {
    try {
      // Call the new DELETE endpoint
      const response = await api.delete(`/canvas/${canvasId}/clear`);
      return response.data; // Should return { success: true, ... }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to clear canvas"
      );
    }
  }
);

// Get tile data
export const getTileData = createAsyncThunk(
  "paintPixel/getTileData",
  async ({ sessionId, tileX, tileY, tileSize = 64 }: any, thunkAPI) => {
    try {
      const params = new URLSearchParams({
        tileSize: tileSize.toString(),
      });
      const response = await api.get(`${config?.endpoints?.GET_USER}/tile/${sessionId}/${tileX}/${tileY}?${params}`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch tile data"
      );
    }
  }
);

// Get canvas statistics
export const getCanvasStats = createAsyncThunk(
  "paintPixel/getCanvasStats",
  async (sessionId: any, thunkAPI) => {
    try {
      const response = await api.get(`${config?.endpoints?.GET_USER}/stats/${sessionId}`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch canvas stats"
      );
    }
  }
);

// Export canvas
export const exportCanvas = createAsyncThunk(
  "paintPixel/exportCanvas",
  async ({ sessionId, format = "json" }: any, thunkAPI) => {
    try {
      const params = new URLSearchParams({ format });
      const response = await api.get(`${config?.endpoints?.GET_USER}/export/${sessionId}?${params}`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to export canvas"
      );
    }
  }
);

// Import canvas
export const importCanvas = createAsyncThunk(
  "paintPixel/importCanvas",
  async ({ data, overwrite = false }: any, thunkAPI) => {
    try {
      const response = await api.post(`${config?.endpoints?.GET_USER}/import`, { data, overwrite });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to import canvas"
      );
    }
  }
);
