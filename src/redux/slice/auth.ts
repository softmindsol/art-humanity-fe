import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  refreshToken,
  googleLogin,
  getUserById,
  fetchAllRegisteredUsers,
  // NEW:
  requestEmailChange,
  updateUser,
} from "../action/auth";

interface Profile {
  _id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
  avatar: string | null;
  paymentHistory?: any[];
}

interface User {
  _id: string;
  email: string;
  fullName: string;
  token: string;
  avatar?: string | null;
  role: string;
  paymentHistory?: any[];
}

interface initialStateType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  googleAuthUser: [] | null;
  googleLoading: boolean;
  error: string | null;
  successMessage: string | null;
  allUsers: any[];
  // NEW flags
  emailChangeLoading: boolean;
  profileUpdateLoading: boolean;
}

const initialState: initialStateType = {
  allUsers: [],
  user: null,
  googleAuthUser: null,
  profile: null,
  loading: false,
  googleLoading: false,
  error: null,
  successMessage: null,
  // NEW
  emailChangeLoading: false,
  profileUpdateLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    addSuccessfulPaymentToHistory: (state, action) => {
      const newPayment = action.payload;

      // Yaqeeni banayein ke profile aur paymentHistory mojood hain
      if (state.profile && state.profile.paymentHistory) {
        // Nayi payment ko history ke shuru mein add karein
        state.profile.paymentHistory.unshift(newPayment);
      } else if (state.profile) {
        // Agar paymentHistory mojood nahi, to usay banayein
        state.profile.paymentHistory = [newPayment];
      }
    },
    resetAuthState: (state) => {
      state.loading = false;
      state.googleLoading = false;
      state.emailChangeLoading = false;
      state.profileUpdateLoading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action: any) => {
        state.loading = false;
        state.successMessage =
          action.payload?.message ?? "Registered successfully";
      })
      .addCase(registerUser.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message ?? "Registration failed";
      })

      // Fetch All Users
      .addCase(fetchAllRegisteredUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRegisteredUsers.fulfilled, (state, action: any) => {
        state.loading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchAllRegisteredUsers.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message ?? "Failed to fetch users";
      })

      // Login
      .addCase(loginUser.fulfilled, (state, action: any) => {
        state.user = action.payload?.data ?? action.payload;
        state.successMessage = "Login successful";
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action: any) => {
        state.error = action.payload?.message ?? "Login failed";
      })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state) => {
        state.successMessage = "Token refreshed";
      })

      // Google login
      .addCase(googleLogin.pending, (state) => {
        state.googleLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action: any) => {
        state.googleLoading = false;
        state.user = action.payload;
      })
      .addCase(googleLogin.rejected, (state, action: any) => {
        state.googleLoading = false;
        state.error = action.payload ?? "Google login failed";
      })

      // Get profile by id
      .addCase(getUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action: any) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(getUserById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // >>> NEW: Request Email Change
      .addCase(requestEmailChange.pending, (state) => {
        state.emailChangeLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(requestEmailChange.fulfilled, (state, action: any) => {
        state.emailChangeLoading = false;
        state.successMessage =
          action.payload?.message ??
          "Email change requested. Check your new email for verification.";
        // Optimistically reflect changes in profile
        if (state.profile && action.meta && action.meta.arg) {
          const { newEmail } = action.meta.arg as { newEmail: string };
          state.profile.email = newEmail;
          state.profile.isVerified = false; // server set false; reflect in UI
        }
      })
      .addCase(requestEmailChange.rejected, (state, action: any) => {
        state.emailChangeLoading = false;
        state.error =
          action.payload?.message ?? "Failed to request email change";
      })

      // >>> NEW: Update profile (name/password/avatar)
      .addCase(updateUser.pending, (state) => {
        state.profileUpdateLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateUser.fulfilled, (state, action: any) => {
        state.profileUpdateLoading = false;
        state.successMessage =
          action.payload?.message ?? "Profile updated successfully";
        const updated = action.payload?.data;
        // keep state in sync if API returns the updated user
        if (updated) {
          // Only overwrite known fields to avoid losing local shape
          state.profile = {
            _id: updated._id || updated.id || state.profile?._id || "",
            email: updated.email ?? state.profile?.email ?? "",
            fullName: updated.fullName ?? state.profile?.fullName ?? "",
            isVerified:
              typeof updated.isVerified === "boolean"
                ? updated.isVerified
                : state.profile?.isVerified ?? false,
            createdAt: updated.createdAt ?? state.profile?.createdAt ?? "",
            avatar: updated.avatar ?? state.profile?.avatar ?? null,
          };
        }
        // also, if `user` is present (logged-in header info), keep name/avatar aligned
        if (state.user && updated) {
          state.user.fullName = updated.fullName ?? state.user.fullName;
          if (typeof updated.avatar !== "undefined") {
            state.user.avatar = updated.avatar;
          }
        }
      })
      .addCase(updateUser.rejected, (state, action: any) => {
        state.profileUpdateLoading = false;
        state.error = action.payload?.message ?? "Failed to update profile";
      });
  },
});

export const { resetAuthState, addSuccessfulPaymentToHistory } = authSlice.actions;
export default authSlice.reducer;
