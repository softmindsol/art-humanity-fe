import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/api/api"; // Maan rahe hain ke aapke paas ek configured axios instance hai
import { config } from "@/utils/endpoints";

// Naya project create karne ke liye
export const createProject = createAsyncThunk(
  "projects/create",
  async (projectData: any, { rejectWithValue }) => {
    console.log("projectData:", projectData);
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

interface FetchActiveProjectsArgs {
  page?: number;
  limit?: number;
  status?: "active" | "paused" | "all";
  search?: string;
}


// Saare active projects laane ke liye
export const fetchActiveProjects = createAsyncThunk(
  "projects/fetchAll",
  async (args: FetchActiveProjectsArgs = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (args.page) params.append("page", args.page.toString());
      if (args.limit) params.append("limit", args.limit.toString());
      if (args.status && args.status !== "all") params.append("status", args.status);
      if (args.search) params.append("search", args.search);
      // Aapke route `/` ko call karega
      const response = await api.get(config.endpoints.FETCH_ACTIVE_PROJECT, {
        params: {
          page: args.page,
          limit: args.limit,
          status: args.status === "all" ? undefined : args.status,
          search: args.search || undefined,
        },
      });
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
  async (canvasId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `${config?.endpoints?.FETCH_PROJECT_BY_ID}/${canvasId}`
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
    { projectId, userId }: { projectId: string; userId: string | undefined },
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

export const updateProjectStatus = createAsyncThunk(
  "projects/updateStatus",
  async (
    {
      projectId,
      statusUpdate,
    }: {
      projectId: string;
      statusUpdate: { isPaused?: boolean; isClosed?: boolean };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch(
        `${config?.endpoints?.FETCH_PROJECT_BY_ID}/${projectId}/status`,
        statusUpdate
      );
      return response.data.data; // Return the updated project object
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || "Failed to update project status"
      );
    }
  }
);


interface FetchGalleryProjectsArgs {
  page?: number;
  limit?: number;
}

export const fetchGalleryProjects = createAsyncThunk(
  "projects/fetchGallery",
  async (args: FetchGalleryProjectsArgs = {}, { rejectWithValue }) => {
    try {
      // Naya API endpoint: GET /api/projects/view/gallery

       const params = new URLSearchParams();
       if (args.page) params.append("page", args.page.toString());
       if (args.limit) params.append("limit", args.limit.toString());
      const response = await api.get(
        `${
          config?.endpoints?.FETCH_PROJECT_BY_ID
        }/view/gallery?${params.toString()}`
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || "Failed to fetch gallery projects"
      );
    }
  }
);

export const fetchContributors = createAsyncThunk(
  "projects/fetchContributors",
  async ({projectId}:{projectId: string}, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${projectId}/contributors`);
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      // Backend se { projectId: '...' } wapas aayega
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || "Failed to delete project"
      );
    }
  }
);
interface AddContributorsArgs {
  projectId: string;
  userIdsToAdd: string[];
  ownerId:string
}

export const addContributors = createAsyncThunk(
  "project/addContributors",
  async (
    { projectId, userIdsToAdd, ownerId }: AddContributorsArgs,
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `${config.endpoints.JOIN_AS_CONTRIBUTOR}/${projectId}/contributors`,
        {
          userIdsToAdd,
          ownerId,
        }
      );
      return response.data.data; // Updated contributors list return karein
    } catch (error: any) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Contributor ko remove karne ke liye
export const removeContributor = createAsyncThunk(
  "projects/removeContributor",
  async (
    {
      projectId,
      userIdToRemove,
      userId,
    }: { projectId: string; userIdToRemove: string; userId: any },
    thunkAPI
  ) => {
    try {

      // NOTE: Humne backend route `PATCH /projects/contributors/remove` banaya tha.
       const response = await api.patch(
         `${config?.endpoints?.REMOVE_CONTRIBUTOR}/remove-contributor`,
         {
           projectId,
           userIdToRemove,
           userId,
         }
       );
      // Hum sirf remove kiye gaye user ki ID wapas bhejenge taake slice usay state se nikaal sake
      return response.data.data; 
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);
