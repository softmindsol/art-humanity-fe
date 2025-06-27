// hooks/useAuth.ts
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

const useAuth = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => !!state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);

  return { user, isAuthenticated, loading };
};

export default useAuth;
