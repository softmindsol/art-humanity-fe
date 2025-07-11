import api from "@/api/api";
import type { formData } from "@/types/auth";
import { signInWithPopup } from "firebase/auth";
import { config } from "@/utils/endpoints";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { auth, provider } from "../../firebase";

export const registerUser = createAsyncThunk(
  "user/register",
  async (formData: formData, thunkAPI) => {
    try {
      const response = await api.post(
        `${config?.endpoints?.REGISTER}`,
        formData
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  "user/verifyEmail",
  async ({ token }: { token: string | undefined }, thunkAPI) => {
    try {
      const response = await api.post(`${config?.endpoints?.VERIFY_EMAIL}`, {
        token,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const loginUser = createAsyncThunk(
  "user/login",
  async ({ email, password }: any, thunkAPI) => {
    try {
      const response = await api.post(`${config?.endpoints?.LOGIN}`, {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (
    { formData, userId }: { formData: FormData; userId: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(
        `${config?.endpoints?.UPDATE_USER}/${userId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

export const refreshToken = createAsyncThunk(
  "user/refreshToken",
  async (_, thunkAPI) => {
    try {
      const response = await api.get(`/auth/refresh-token`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// export const getUserById = createAsyncThunk(
//   "user/getById",
//   async ({ userId }: { userId: string }, thunkAPI) => {
//     try {
//       const response = await api.get(
//         `${config?.endpoints?.GET_USER}/${userId}`
//       );
//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

// export const changePassword = createAsyncThunk(
//   "user/changePassword",
//   async (
//     {
//       userId,
//       currentPassword,
//       newPassword,
//       twoFactorEnabled,
//     }: {
//       userId: string;
//       currentPassword?: string;
//       newPassword?: string;
//       twoFactorEnabled: boolean;
//     },
//     { rejectWithValue }
//   ) => {
//     try {
//       const response = await api.post(
//         `${config?.endpoints?.CHANGE_PASSWORD}/${userId}`,
//         {
//           currentPassword,
//           newPassword,
//           twoFactorEnabled,
//         }
//       );
//       return response.data;
//     } catch (err: any) {
//       return rejectWithValue(
//         err.response?.data?.message || "Password change failed"
//       );
//     }
//   }
// );

// export const verifyOtp = createAsyncThunk(
//   "user/verifyOtp",
//   async (
//     { email, otp }: { email: string; otp: string },
//     { rejectWithValue }
//   ) => {
//     try {
//       const response = await api.post(`${config?.endpoints.OTP_VERIFY}`, {
//         email,
//         otp,
//       });
//       return response.data;
//     } catch (err: any) {
//       return rejectWithValue(
//         err.response?.data?.message || "OTP verification failed"
//       );
//     }
//   }
// );

export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async ({ email }: { email: string }, thunkAPI) => {
    try {
      const response = await api.post(`${config?.endpoints?.FORGOT_PASSWORD}`, {
        email,
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || error.message);
    }
  }
);
export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async (
    { token, password }: { token: string; password: string },
    thunkAPI
  ) => {
    try {
      const response = await api.post(
        `${config?.endpoints?.RESET_PASSWORD}/${token}`,
        {
          password,
        }
      );
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data || error.message);
    }
  }
);

export const getUserById = createAsyncThunk(
  "auth/getUserById",
  async (id: any, thunkAPI) => {
    try {
      const response = await api.get(`${config?.endpoints?.GET_USER}/${id}`);
      return response.data.data; // backend returns { success: true, data: {...} }
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response.data.message || "Failed to fetch user"
      );
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (_, thunkAPI) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      // Axios request to backend
      const response = await api.post(
        `${config?.endpoints?.GOOGLE_AUTH}`,
        { token },
        { headers: { "Content-Type": "application/json" } }
      );

      return response.data.user; // Assuming backend returns { success: true, user: {...} }
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        return thunkAPI.rejectWithValue(error.response.data.message);
      }
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);
