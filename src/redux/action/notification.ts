import api from "@/api/api";
import { config } from "@/utils/endpoints";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Actions
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async ({ userId }: { userId: string | undefined }, _) => {
    const response = await api.post(`${config?.endpoints?.GET_NOTIFICATIONS}`, {
      userId,
    });
    return response.data.data;
  }
);
export const markNotificationsAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async ({ userId }: { userId: string | undefined }, _) => {
    await api.patch(`${config?.endpoints?.MARK_NOTIFICATIONS_AS_READ}`, {
      userId,
    });
  }
);

export const markSingleNotificationRead = createAsyncThunk(
  "notifications/markSingleRead",
  async (
    {
      notificationId,
      userId,
    }: { notificationId: string; userId: string | undefined },
    { rejectWithValue }
  ) => {
    try {
      // Naye API endpoint ko call karein
      const response = await api.patch(
        `/notifications/${notificationId}/read`,
        { userId }
      );
      // Backend se jo updated notification aayi hai, usay return karein
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);