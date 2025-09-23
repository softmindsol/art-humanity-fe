import api from "@/api/api";
import type { FetchTilesArgs } from "@/types/canvas";
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

export const batchCreateContributions = createAsyncThunk(
  "paintPixel/batchCreateContributions",
  async (batchData: { projectId: string; contributions: any[] }, thunkAPI) => {
    try {
      const response = await api.post(`/contributions/batch`, batchData);
      return response.data.data; // Backend se save hue contributions ka array aayega
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to batch create contributions"
      );
    }
  }
);
 
export const getContributionsByProject = createAsyncThunk(
  "paintPixel/getContributionsByProject",
  // (1) Payload ke types mein `userId` ko (optional string ke tor par) add karein
  async (
    {
      projectId,
      sortBy,
      page,
      limit,
      userId,
    }: {
      projectId: string;
      sortBy?: string;
      page?: number;
      limit?: number;
      userId?: string;
    },
    thunkAPI
  ) => {
    try {
      const params = new URLSearchParams();
      if (sortBy) params.append("sortBy", sortBy);
      if (page) params.append("page", page.toString());
      if (limit) params.append("limit", limit.toString());
      // (2) Agar userId mojood hai, to usay bhi query parameters mein shamil karein
      if (userId) params.append("userId", userId);

      const queryString = params.toString();
      let url = `/contributions/${projectId}`;
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log(`Fetching contributions with URL: ${url}`); // Debugging ke liye

      const response = await api.get(url);
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch contributions"
      );
    }
  }
);

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
      // Naye API endpoint ko call karein
      const response = await api.get(`/timelapse/${projectId}`);
      console.log("Timelapse generation response:", response.data);
      
      // Response mein { success: true, data: { videoUrl: '...' } } aayega
      return response.data; 
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

export const addStrokes = createAsyncThunk(
  "contributions/addStrokes",
  async (
    { contributionId, strokes }: { contributionId: string; strokes: any[] },
    { rejectWithValue }
  ) => {
    try {
      // Call our new PATCH endpoint
      const response = await api.patch(
        `/contributions/${contributionId}/strokes`,
        { strokes }
      );
      // The backend will return the fully updated contribution object
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Could not save your drawing."
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
        `/contributions/${projectId}/clear-canvas`
      );
      return response.data; // Should return { success: true, ... }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to clear canvas"
      );
    }
  }
);

export const fetchContributionsByTiles = createAsyncThunk(
  "contributions/fetchByTiles",
  async ({ projectId, tiles }: FetchTilesArgs, { rejectWithValue }) => {
    try {
      // Naye "smart" API endpoint ko call karein
      const response = await api.get(
        `/contributions/project/${projectId}?tiles=${tiles}`
      );
      return response.data.data.contributions; // Sirf contributions ka array return karein
    } catch (error: any) {
      console.error("Failed to fetch contributions for tiles:", error);
      return rejectWithValue(
        error.response?.data?.message || "Could not load artwork for this area."
      );
    } 
  }
);