import { createSlice } from "@reduxjs/toolkit";
import { fetchNotifications, markNotificationsAsRead, markSingleNotificationRead } from "../action/notification";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    status: "idle",
  },
  reducers: {
    addNotification: (state:any, action) => {
      // Nayi notification ko list ke shuru mein add karein
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state: any, action) => {
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n: any) => !n.isRead).length;
      })
      .addCase(markNotificationsAsRead.fulfilled, (state: any) => {
        state.unreadCount = 0;
        state.notifications.forEach((item: any) => (item.isRead = true));
      })
      .addCase(
        markSingleNotificationRead.fulfilled,
        (state: any, action: any) => {
          // action.payload mein updated notification hai
          const updatedNotification = action.payload;

          // State mein us notification ko dhoondein
          const index = state.notifications.findIndex(
            (notif: any) => notif._id === updatedNotification._id
          );

          // Agar mil jaye, to usay replace kar dein aur unread count update karein
          if (index !== -1) {
            // Pehle check karein ke kya yeh waqai unread thi
            const wasUnread = !state.notifications[index].isRead;
            state.notifications[index] = updatedNotification;

            // Agar unread thi, to count kam karein
            if (wasUnread) {
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          }
        }
      );
  },
});

// Selectors
export const selectAllNotifications = (state: any) => state.notifications.notifications;
export const selectUnreadCount = (state: any) => state.notifications.unreadCount;
export const { addNotification } = notificationSlice.actions;

export default notificationSlice.reducer;
