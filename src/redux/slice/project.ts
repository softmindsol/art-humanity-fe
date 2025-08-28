import { createSlice } from "@reduxjs/toolkit";
import {
  addContributors,
  createProject,
  fetchActiveProjects,
  fetchContributors,
  fetchGalleryProjects,
  fetchProjectById,
  joinProject,
  removeContributor,
  updateProjectStatus,
} from "../action/project";

const initialState: any = {
  projects: [], // Saare projects ki list
  galleryProjects: [], // Yeh Gallery ke liye hai
  currentProject: null, // Jo project abhi khula hua hai
  currentProjectContributors: [],

  loading: {
    fetchingContributors: false,
    removingContributor: false,
    creating: false,
    fetching: false,
    fetchingById: false,
    updatingStatus: false,
    fetchingGallery: false, // Nayi loading state

    joining: false, // Nayi loading state
  },
  error: {
    creating: null,
    fetching: null,
    fetchingById: null,
    updatingStatus: null,
    joining: null, // Nayi error state
    fetchingGallery: null, // Nayi loading state
    fetchingContributors: null,
    removingContributor: null,
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
      .addCase(createProject.fulfilled, (state: any, action) => {
        state.loading.creating = false;
        state.projects.push(action.payload);
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
        const updatedProjectFromServer = action.payload;

        console.log("updatedProjectFromServer:", updatedProjectFromServer);

        if (state.currentProject?._id === updatedProjectFromServer._id) {
          // Hum poora object nayi value se replace kar rahe hain
          state.currentProject = updatedProjectFromServer;
        }
      })
      .addCase(joinProject.rejected, (state, action) => {
        state.loading.joining = false;
        state.error.joining = action.payload as any;
      });
    // --- NEW CASES FOR UPDATING STATUS ---
    builder
      .addCase(updateProjectStatus.pending, (state) => {
        state.loading.updatingStatus = true;
        state.error.updatingStatus = null;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        state.loading.updatingStatus = false;
        const updatedProject = action.payload;
        // Find the project in the list and update it
        const index = state.projects.findIndex(
          (p: any) => p._id === updatedProject._id
        );
        if (index !== -1) {
          state.projects[index] = updatedProject;
        }
      })
      .addCase(updateProjectStatus.rejected, (state, action) => {
        state.loading.updatingStatus = false;
        state.error.updatingStatus = action.payload as any;
      });
    builder
      .addCase(fetchGalleryProjects.pending, (state) => {
        state.loading.fetchingGallery = true;
        state.error.fetchingGallery = null;
      })
      .addCase(fetchGalleryProjects.fulfilled, (state, action) => {
        state.loading.fetchingGallery = false;
        state.galleryProjects = action.payload; // Nayi state ko update karein
      })
      .addCase(fetchGalleryProjects.rejected, (state, action) => {
        state.loading.fetchingGallery = false;
        state.error.fetchingGallery = action.payload as any;
      });

    // === FETCH CONTRIBUTORS ke liye extraReducers ADD KAREIN ===
    builder
      .addCase(fetchContributors.pending, (state) => {
        state.loading.fetchingContributors = true;
        state.error.fetchingContributors = null;
      })
      .addCase(fetchContributors.fulfilled, (state, action) => {
        state.loading.fetchingContributors = false;
        state.currentProjectContributors = action.payload;
      })
      .addCase(fetchContributors.rejected, (state, action) => {
        state.loading.fetchingContributors = false;
        state.error.fetchingContributors = action.payload as any;
      });

       builder

         .addCase(addContributors.pending, (state) => {
           state.loading.addingContributors = true;
         })
         .addCase(addContributors.fulfilled, (state, action) => {
           state.loading.addingContributors = false;

           // action.payload mein ab poora updated project object hai
           const updatedProject = action.payload;

           // --- YEH HAI ASAL FIX ---
           // Safety check: Yaqeeni banayein ke state mein jo project hai, wahi update ho raha hai
           if (
             state.currentProject &&
             state.currentProject._id === updatedProject._id
           ) {
             // 1. currentProject ko nayi value se replace karein
             state.currentProject = updatedProject;

             // 2. currentProjectContributors ko bhi isi naye data se update karein
             state.currentProjectContributors = updatedProject.contributors;
           }
         })
         .addCase(addContributors.rejected, (state, action) => {
           state.loading.addingContributors = false;
           state.error.addingContributors = action.payload as any;
         });

    // === REMOVE CONTRIBUTOR ke liye extraReducers ADD KAREIN ===
    builder
      .addCase(removeContributor.pending, (state) => {
        state.loading.removingContributor = true;
        state.error.removingContributor = null;
      })
      .addCase(removeContributor.fulfilled, (state, action) => {
        state.loading.removingContributor = false;

        // --- YEH HAI ASAL FIX ---
        // action.payload ab { userIdToRemove: 'some_id' } jaisa object hai
        const { userIdToRemove }:any = action.payload;

        console.log(`[Reducer] Attempting to remove user: ${userIdToRemove}`); // Debugging ke liye

        // 1. Pehli list (jo objects ka array hai) ko update karein
        if (state.currentProjectContributors) {
          state.currentProjectContributors =
            state.currentProjectContributors.filter(
              (contributor: any) => contributor._id !== userIdToRemove
            );
        }

        // 2. Doosri list (jo sirf IDs ka array ho sakti hai) ko bhi update karein
        //    Yeh data consistency ke liye bohat zaroori hai!
        if (state.currentProject && state.currentProject.contributors) {
          state.currentProject.contributors =
            state.currentProject.contributors.filter((contributorOrId: any) => {
              // Check karein ke array mein object hai ya sirf ID
              const id =
                typeof contributorOrId === "string"
                  ? contributorOrId
                  : contributorOrId._id;
              return id !== userIdToRemove;
            });
        }
      })
      .addCase(removeContributor.rejected, (state, action) => {
        state.loading.removingContributor = false;
        state.error.removingContributor = action.payload as any;
      });
  }, 
}); 

export const { clearCurrentProject } = projectSlice.actions;

// Selectors
export const selectAllProjects = (state: any) => state?.projects?.projects;
export const selectCurrentProject = (state: any) =>
  state?.projects?.currentProject;
export const selectProjectsLoading = (state: any) => state?.projects?.loading;
export const selectProjectsError = (state: any) => state?.projects?.error;
export const selectGalleryProjects = (state: any) => state?.projects?.galleryProjects;
export const selectProjectContributors = (state: any) => state.projects.currentProjectContributors;
export const selectContributorsLoading = (state: any) => state.projects.loading.fetchingContributors;
export default projectSlice.reducer;
