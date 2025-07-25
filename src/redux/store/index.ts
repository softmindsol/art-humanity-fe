// store/index.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authModalReducer from "../slice/auth";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // uses localStorage by default

// Combine your reducers (if you have more later)
const rootReducer = combineReducers({
  auth: authModalReducer,
});

// Persist config
const persistConfig = {
  key: "root", // key name in storage
  storage,
  whitelist: ["auth"], // add slices you want to persist
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
