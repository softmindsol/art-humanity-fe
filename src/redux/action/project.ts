import {  createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/api/api"; // Maan rahe hain ke aapke paas ek configured axios instance hai
import { config } from "@/utils/endpoints";

// Naya project create karne ke liye
export const createProject = createAsyncThunk(
  "projects/create",
  async (projectData: any, { rejectWithValue }) => {
    try {
      // Aapke route `/create` ko call karega
      const response = await api.post(
        `${config?.endpoints?.PROJECT_CREATE}`,
        projectData
      );
      return response.data.data; // ApiResponse ke andar se 'data' nikalein
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || "Failed to create project"
      );
    }
  }
);

// Saare active projects laane ke liye
export const fetchActiveProjects = createAsyncThunk(
  "projects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      // Aapke route `/` ko call karega
      const response = await api.get(
        `${config?.endpoints?.FETCH_ACTIVE_PROJECT}`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || "Failed to fetch projects"
      ); 
    }
  }
);

// Ek project ID se laane ke liye
export const fetchProjectById = createAsyncThunk(
  "projects/fetchById",
  async (projectId: string, { rejectWithValue }) => {
    try {
     
        
      const response = await api.get(
        `${config?.endpoints?.FETCH_PROJECT_BY_ID}/${projectId}`
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || "Project not found"
      );
    }
  }
);

export const joinProject = createAsyncThunk(
  "projects/joinProject",
  async (
    { projectId,userId }: { projectId: string; userId: string | undefined },
    { rejectWithValue }
  ) => {
    try {
      // Naya API endpoint: POST /api/projects/:projectId/join
      const response = await api.post(
        `${config?.endpoints?.JOIN_AS_CONTRIBUTOR}/${projectId}/join`,
        { userId }
      );

      // Backend ab poora, updated project object wapas bhejega
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || "Failed to join project"
      );
    }
  }
);