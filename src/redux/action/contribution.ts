import api from "@/api/api";
import { config } from "@/utils/endpoints";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Create a single stroke
export const createStroke = createAsyncThunk(
  "paintPixel/createStroke",
  async (strokeData: any, thunkAPI) => {
    try {
      const response = await api.post(`/stroke`, strokeData);
      console.log("hello");
      return response.data; // backend returns { success: true, data: {...} }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create stroke"
      );
    }
  }
);

export const createContribution = createAsyncThunk(
  "paintPixel/createContribution",
  // Payload ab ek object hoga: { projectId, strokes }
  async (
    contributionData: { projectId: string; strokes: any[]; userId:string },
    thunkAPI
  ) => {
    try {
      // Naya API endpoint: POST /api/contributions
      const response = await api.post(`/contributions`, contributionData);
      // Backend ab poora contribution object wapas bhejega
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create contribution"
      ); 
    }
  }
);
 
export const getContributionsByProject = createAsyncThunk(
  "paintPixel/getContributionsByProject",
  // Step 1: Payload object ab 'sortBy' bhi accept karega.
  async (
    { projectId, sortBy }: { projectId: string; sortBy?: string },
    thunkAPI
  ) => {
    try {
      // Step 2: API call mein 'sortBy' parameter ko shamil karein.
      let url = `/contributions/project/${projectId}`;
      if (sortBy) {
        url += `?sortBy=${sortBy}`;
      }

      const response = await api.get(url);
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch contributions"
      );
    }
  }
);


// --- NAYA VOTE THUNK ---
export const voteOnContribution = createAsyncThunk(
  "paintPixel/voteOnContribution",
  // Payload ab ek object hoga: { contributionId, voteType }
  async (
    {
      contributionId,
      voteType,
      userId,
    }: { contributionId: string; voteType: "up" | "down"; userId:string | null },
    thunkAPI
  ) => {
    try {
      // Naya API endpoint: POST /api/contributions/:id/vote
      const response = await api.post(`/contributions/${contributionId}/vote`, {
        voteType,
        userId,
      });

      // Backend ab poora, updated contribution object wapas bhejega
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to register vote"
      );
    }
  }
);

export const deleteContribution = createAsyncThunk(
  "paintPixel/deleteContribution",
  async ({ contributionId }: { contributionId: string }, thunkAPI) => {
    try {
      const response = await api.delete(`/contributions/${contributionId}`);
      return response.data.data; // Yeh { contributionId: '...' } wapas bhejega
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const generateTimelapseVideo = createAsyncThunk(
  "paintPixel/generateTimelapse",
  async ({ projectId }: { projectId: string }, thunkAPI) => {
    try {
      // API endpoint ko call karein. Response mein video ka URL aayega.
      const response = await api.get(`/timelapse/${projectId}`); // URL badal jayega
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
      const response = await api.post(`/strokes/batch`, {
        strokes: strokesData,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to batch create strokes"
      );
    }
  }
);

// Clear canvas
export const clearCanvas = createAsyncThunk(
  "paintPixel/clearCanvasAPI",
  async ({ projectId }: { projectId: string }, thunkAPI) => {
    try {
      // Call the new DELETE endpoint
      const response = await api.delete(
        `/contributions/project/${projectId}/clear`
      );
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
      const response = await api.get(
        `${config?.endpoints?.GET_USER}/tile/${sessionId}/${tileX}/${tileY}?${params}`
      );
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
      const response = await api.get(
        `${config?.endpoints?.GET_USER}/stats/${sessionId}`
      );
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
      const response = await api.get(
        `${config?.endpoints?.GET_USER}/export/${sessionId}?${params}`
      );
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
      const response = await api.post(`${config?.endpoints?.GET_USER}/import`, {
        data,
        overwrite,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to import canvas"
      );
    }
  }
);
