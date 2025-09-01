const config = {
  endpoints: {
    LOGOUT: "/auth/logout",
    LOGIN: "/auth/login",
    UPDATE_USER: "/auth/update-profile",
    CHANGE_PASSWORD: "/auth/change-password",
    CHANGE_EMAIL: "/auth/change-email",
    GET_USER: "/auth",
    REGISTER: "/auth/register",
    VERIFY_EMAIL: "/auth/verify-email",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    GOOGLE_AUTH: "/auth/firebase-login",
    LOGOUT_AUTH: "/auth/logout",
    PROJECT_CREATE: "/projects/create",
    FETCH_ACTIVE_PROJECT: "/projects/all-active-project",
    FETCH_PROJECT_BY_ID: "/projects",
    JOIN_AS_CONTRIBUTOR: "/projects",
    LEAVE_PROJECT: "/projects",
    FETCH_CONTRIBUTORS: "/projects",
    REMOVE_CONTRIBUTOR: "/projects",
    GET_NOTIFICATIONS: "/notifications/all",
    MARK_NOTIFICATIONS_AS_READ: "/notifications/mark-as-read",
  },
};

export { config };
