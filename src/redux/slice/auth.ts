import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
//   verifyEmail,
  loginUser,
//   logoutUser,
//   getUser,
  refreshToken,
} from "../action/auth";

interface initialStateType {
  user: [] | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: initialStateType = {
  user: null,
  loading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(registerUser.rejected, (state, action:any) => {
        state.loading = false;
        state.error = action.payload.message;
      })

    //   // Verify
    //   .addCase(verifyEmail.fulfilled, (state, action) => {
    //     state.successMessage = action.payload.message;
    //   })

      // Login
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.data;
        state.successMessage = "Login successful";
      })
      .addCase(loginUser.rejected, (state, action:any) => {
        state.error = action.payload.message;
      })

      // Logout
    //   .addCase(logoutUser.fulfilled, (state) => {
    //     state.user = null;
    //     state.successMessage = "Logout successful";
    //   })

      // Get user
    //   .addCase(getUser.fulfilled, (state, action) => {
    //     state.user = action.payload.data;
    //   })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state) => {
        state.successMessage = "Token refreshed";
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;
