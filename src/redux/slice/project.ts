import { createSlice } from "@reduxjs/toolkit";
import {
  addContributors,
  createProject,
  deleteProject,
  fetchActiveProjects,
  fetchContributors,
  fetchGalleryProjects,
  fetchProjectById,
  joinProject,
  removeContributor,
  updateProjectStatus,
} from "../action/project";
import type { RootState } from "../store";

const initialState: any = {
  projects: [], // Saare projects ki list
  galleryProjects: [], // Yeh Gallery ke liye hai
  currentProject: null, // Jo project abhi khula hua hai
  currentProjectContributors: [],

  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
  },
  galleryPagination: {
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
  },
  filters: {
    status: "all", // 'all', 'active', 'paused'
    search: "", // Search query
  },
  loading: {
    fetchingContributors: false,
    removingContributor: false,
    creating: false,
    fetching: false,
    fetchingById: false,
    updatingStatus: false,
    fetchingGallery: false, // Nayi loading state
    deleting: false, // <-- Nayi loading state

    joining: false, // Nayi loading state
  },
  error: {
    creating: null,
    fetching: null,
    fetchingById: null,
    updatingStatus: null,
    deleting: null, // <-- Naya error state
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
    // Yeh reducer pagination ke page ko change karega
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    // Yeh reducer status filter ko change karega
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
      state.pagination.currentPage = 1; // Filter badalne par hamesha pehle page par wapas jao
    },
    // Yeh reducer search term ko change karega
    setSearchTerm: (state, action) => {
      state.filters.search = action.payload;
      state.pagination.currentPage = 1; // Search karne par bhi pehle page par wapas jao
    },

    addContributorToState: (state, action) => {
      const newContributor = action.payload;

      // Safety check: Yaqeeni banayein ke user pehle se list mein nahi hai
      const exists = state.currentProjectContributors.some(
        (c: any) => c._id === newContributor._id
      );
      if (!exists) {
        state.currentProjectContributors.push(newContributor);
      }
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    setGalleryCurrentPage: (state, action) => {
      state.galleryPagination.currentPage = action.payload;
    },
    removeContributorFromState: (state, action) => {
      const { removedUserId } = action.payload;

      // --- YAHAN PAR FIX HAI ---
      // Hum 'currentProject' ko ek naye object se replace karenge
      // taake Redux is change ko foran detect kar le.

      if (state.currentProject) {
        // 1. Ek naya, filtered contributors ka array banayein
        const newContributors = state.currentProject.contributors.filter(
          (c: any) => (typeof c === "string" ? c : c._id) !== removedUserId
        );

        // 2. 'currentProject' ko ek bilkul naye object se update karein
        state.currentProject = {
          ...state.currentProject,
          contributors: newContributors,
        };
      }

      // populated list ko bhi update karein (yeh pehle se theek hai)
      if (state.currentProjectContributors) {
        state.currentProjectContributors =
          state.currentProjectContributors.filter(
            (c: any) => c._id !== removedUserId
          );
      }
    },
    incrementPixelCount: (state, action) => {
      const { pixelCountToAdd } = action.payload;

      // Sirf tab update karein jab currentProject mojood ho
      if (state.currentProject && state.currentProject.stats) {
        // Purane count mein naye pixels add karein
        state.currentProject.stats.pixelCount += pixelCountToAdd;

        // (Optional, but good) Percentage ko bhi foran update karein
        const totalPixels =
          state.currentProject.width * state.currentProject.height;
        if (totalPixels > 0) {
          const newPercentage =
            (state.currentProject.stats.pixelCount / totalPixels) * 100;
          state.currentProject.stats.percentComplete = Math.min(
            100,
            newPercentage
          );
        }
      }
    },

    updateProjectStatusInState: (state, action) => {
      const { projectId, status } = action.payload;

      console.log(projectId, status);
      // 1. Update the project in the main `projects` list (for the ActiveProjects page)
      const projectIndex = state.projects.findIndex(
        (p: any) => p._id === projectId
      );
      if (projectIndex !== -1) {
        // Create a new object to ensure immutability and trigger re-renders
        state.projects[projectIndex] = {
          ...state.projects[projectIndex],
          status: status,
        };
      }

      // 2. Update the `currentProject` if the user is currently on that page
      if (state.currentProject && state.currentProject._id === projectId) {
        // Create a new object here as well
        state.currentProject = {
          ...state.currentProject,
          status: status,
        };
      }
    },

    // Yeh real-time project deletion ke liye hai
    removeProjectFromList: (state, action) => {
      const { projectId } = action.payload;
      state.projects = state.projects.filter((p: any) => p._id !== projectId);
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

    builder
      .addCase(deleteProject.pending, (state) => {
        state.loading.deleting = true;
        state.error.deleting = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading.deleting = false;
        // action.payload mein { projectId: '...' } hai
        const { projectId } = action.payload;
        // Project ko 'projects' array se filter karke nikaal dein
        state.projects = state.projects.filter((p: any) => p._id !== projectId);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading.deleting = false;
        state.error.deleting = action.payload as any;
      });

    // Fetch All Projects
    builder
      .addCase(fetchActiveProjects.pending, (state) => {
        state.loading.fetching = true;
        state.error.fetching = null;
      })
      .addCase(fetchActiveProjects.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.projects = action?.payload?.projects;
        state.pagination.currentPage = action?.payload?.currentPage;
        state.pagination.totalPages = action?.payload?.totalPages;
        state.pagination.totalProjects = action?.payload?.totalProjects;
      })
      .addCase(fetchActiveProjects.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error.fetching = action?.payload as any;
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
        // Agar woh project abhi khula hua hai, to usay bhi update karein
        if (
          state.currentProject &&
          state.currentProject._id === updatedProject._id
        ) {
          state.currentProject = updatedProject;
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

        // --- YAHAN PAR FIX HAI ---
        // Backend se anay wale data se state update karein
        state.galleryProjects = action.payload.projects;
        state.galleryPagination.currentPage = action.payload.currentPage;
        state.galleryPagination.totalPages = action.payload.totalPages;
        state.galleryPagination.totalProjects = action.payload.totalProjects;
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

        // --- THIS IS THE COMPLETE AND CORRECTED LOGIC ---
        // action.payload ab { userIdToRemove: 'some_id' } jaisa object hai
        const { userIdToRemove } = action.payload;

        // 1. Populated contributors ki list (UI ke liye) ko update karein
        if (state.currentProjectContributors) {
          state.currentProjectContributors =
            state.currentProjectContributors.filter(
              (contributor: any) => contributor._id !== userIdToRemove
            );
        }

        // 2. 'currentProject' (jo data ka main source hai) ko bhi IMMUTABLY update karein
        if (state.currentProject && state.currentProject.contributors) {
          // Ek naya, filtered contributors ka array banayein
          const newContributors = state.currentProject.contributors.filter(
            (contributorOrId: any) => {
              const id =
                typeof contributorOrId === "string"
                  ? contributorOrId
                  : contributorOrId._id;
              return id !== userIdToRemove;
            }
          );

          // 'currentProject' ko ek bilkul naye object se update karein
          // Yeh 'useMemo' ko trigger karne ke liye zaroori hai
          state.currentProject = {
            ...state.currentProject,
            contributors: newContributors,
          };
        }
      })
      .addCase(removeContributor.rejected, (state, action) => {
        state.loading.removingContributor = false;
        state.error.removingContributor = action.payload as any;
      });
  },
});

export const {
  removeContributorFromState,
  clearCurrentProject,
  addContributorToState,
  setCurrentPage,
  setGalleryCurrentPage,
  setStatusFilter,
  setSearchTerm,
  updateProjectStatusInState,
  removeProjectFromList,
  incrementPixelCount,
} = projectSlice.actions;

// Selectors
export const selectAllProjects = (state: RootState) =>
  state?.projects?.projects;
export const selectCurrentProject = (state: RootState) =>
  state?.projects?.currentProject;
export const selectProjectsLoading = (state: RootState) =>
  state?.projects?.loading;
export const selectProjectsError = (state: RootState) => state?.projects?.error;
export const selectGalleryProjects = (state: RootState) =>
  state?.projects?.galleryProjects;
export const selectProjectContributors = (state: RootState) =>
  state.projects.currentProjectContributors;
export const selectContributorsLoading = (state: RootState) =>
  state.projects.loading.fetchingContributors;
export const selectProjectPagination = (state: RootState) =>
  state.projects.pagination;
export const selectProjectFilters = (state: RootState) =>
  state.projects.filters;
export const selectGalleryPagination = (state: RootState) =>
  state.projects.galleryPagination;

export default projectSlice.reducer;
