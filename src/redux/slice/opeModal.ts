import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthModalOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
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
    }
  },
});

export const { openAuthModal, closeAuthModal, toggleAuthModal } = uiSlice.actions;

// Selector
export const selectIsAuthModalOpen = (state: any) => state.ui.isAuthModalOpen;

export default uiSlice.reducer;