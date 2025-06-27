// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import authModalReducer from "../slice/auth";

export const store = configureStore({
  reducer: {
    auth: authModalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
