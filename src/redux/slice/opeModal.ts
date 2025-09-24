import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthModalOpen: false,
  isDonationFormOpen: false,
  isDonationPromptOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openAuthModal: (state) => {
      state.isAuthModalOpen = true;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    },
    toggleAuthModal: (state) => {
      state.isAuthModalOpen = !state.isAuthModalOpen;
    },
    triggerDonationPrompt: (state) => {
      state.isDonationPromptOpen = !state.isDonationPromptOpen;
    },
    openDonationForm: (state) => {
      state.isDonationFormOpen = true;
    },
    closeDonationForm: (state) => {
      state.isDonationFormOpen = false;
    },
    resetDonationPrompt: (state) => {
      state.isDonationPromptOpen = false;
    },
  },
});

export const {
  openAuthModal,
  closeAuthModal,
  toggleAuthModal,
  openDonationForm,
  closeDonationForm,
  triggerDonationPrompt,
  resetDonationPrompt,
} = uiSlice.actions;

// Selector
export const selectIsAuthModalOpen = (state: any) => state?.ui?.isAuthModalOpen;
export const selectIsDonationModalOpen = (state: any) =>
  state?.ui?.isDonationFormOpen;
export const selectIsDonationPromptModalOpen = (state: any) =>
  state?.ui?.isDonationPromptOpen;

export default uiSlice.reducer;
