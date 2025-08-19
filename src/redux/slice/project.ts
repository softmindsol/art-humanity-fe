import { createSlice } from "@reduxjs/toolkit";
import { createProject, fetchActiveProjects, fetchProjectById, joinProject } from "../action/project";

const initialState:any = {
  projects: [], // Saare projects ki list
  currentProject: null, // Jo project abhi khula hua hai
  loading: {
    creating: false,
    fetching: false,
    fetchingById: false,
    joining: false, // Nayi loading state
  },
  error: {
    creating: null,
    fetching: null,
    fetchingById: null,
    joining: null, // Nayi error state
  },
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    // Create Project
    builder
      .addCase(createProject.pending, (state) => {
        state.loading.creating = true;
        state.error.creating = null;
      })
      .addCase(createProject.fulfilled, (state:any, action) => {
        state.loading.creating = false;
        state.projects.push(action.payload) ;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading.creating = false;
        state.error.creating = action.payload as any;
      });

    // Fetch All Projects
    builder
      .addCase(fetchActiveProjects.pending, (state) => {
        state.loading.fetching = true;
        state.error.fetching = null;
      })
      .addCase(fetchActiveProjects.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.projects = action.payload;
      })
      .addCase(fetchActiveProjects.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error.fetching = action.payload as any;
      });

    // Fetch Project By ID
    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.loading.fetchingById = true;
        state.error.fetchingById = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading.fetchingById = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading.fetchingById = false;
        state.error.fetchingById = action.payload as any;
      });

        builder
          .addCase(joinProject.pending, (state) => {
            state.loading.joining = true;
            state.error.joining = null;
          })
          .addCase(joinProject.fulfilled, (state, action) => {
            state.loading.joining = false;
            // 'currentProject' ko backend se aane wale naye data se update karein
            state.currentProject = action.payload;
          })
          .addCase(joinProject.rejected, (state, action) => {
            state.loading.joining = false;
            state.error.joining = action.payload as any;
          });
  }, 
});

export const { clearCurrentProject } = projectSlice.actions;

// Selectors
export const selectAllProjects = (state: any) => state.projects.projects;
export const selectCurrentProject = (state: any) =>
  state.projects.currentProject;
export const selectProjectsLoading = (state: any) => state.projects.loading;
export const selectProjectsError = (state: any) => state.projects.error;

export default projectSlice.reducer;
