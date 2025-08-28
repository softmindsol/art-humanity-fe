import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
  //   verifyEmail,
  loginUser,
  //   logoutUser,
  //   getUser,
  refreshToken,
  googleLogin,
  getUserById,
  fetchAllRegisteredUsers,
} from "../action/auth";


interface Profile {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
  avatar: string | null;
}
interface User {
  id: string;
  email: string;
  fullName: string;
  token: string;
  avatar?: string | null;
  role: string;
}


interface initialStateType {
  user: User | null;
  profile: Profile | null; // ✅ New: store profile data
  loading: boolean;
  googleAuthUser: [] | null;
  googleLoading: boolean;
  error: string | null;
  successMessage: string | null;
  allUsers: any[]; // ✅ New: store all registered users
}


const initialState: initialStateType = {
  allUsers: [],
  user: null,
  googleAuthUser: null,
  profile: null, // ✅ New: store profile data
  loading: false,
  googleLoading: false,
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
      .addCase(registerUser.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload.message;
      })

      // Fetch All Users
      .addCase(fetchAllRegisteredUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllRegisteredUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchAllRegisteredUsers.rejected, (state, action: any) => {
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
      .addCase(loginUser.rejected, (state, action: any) => {
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
      })

      .addCase(googleLogin.pending, (state) => {
        state.googleLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.googleLoading = false;
        state.user = action.payload;
      })
      .addCase(googleLogin.rejected, (state: any, action) => {
        state.googleLoading = false;
        state.error = action.payload;
      })
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;
