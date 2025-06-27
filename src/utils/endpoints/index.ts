const config = {
  endpoints: {
    LOGOUT: "/auth/logout",
    LOGIN: "/auth/login",
    UPDATE_USER: "/auth/update-profile",
    CHANGE_PASSWORD: "/auth/change-password",
    GET_USER: "/auth",
    REGISTER: "/auth/register",
    VERIFY_EMAIL: "/auth/verify-email",
    DELETE_LOG: "/v1/questions/meta-data",
    OTP_VERIFY: "/auth/verify-otp",
    CREATE_PRACTICE: "/auth/create-practices",
    GET_PRACTICE: "/auth/get-practices",
    DELETE_PRACTICE: "/auth/practices",
    UPDATE_PRACTICE: "/auth/practices",
    CREATE_USER_BY_ADMIN: "/users",
    UPDATE_USER_BY_ADMIN: "/users",
    FETCH_ALL_USER_BY_ADMIN: "/users",
    DELETE_USER_BY_ADMIN: "/users",
    FETCH_LIBRARIES: "/libraries",
    FETCH_CONTENT: "/content",
    UPLOAD_MEDIA: "/content/upload-media",
  },
};

export { config };
