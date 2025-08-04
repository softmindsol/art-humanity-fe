import { useEffect, useState, } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import api from "@/api/api";
import type { RootState } from "@/redux/store";

interface PublicRouteProps {
  children: any;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const user = useSelector((state: RootState) => state?.auth?.user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/refresh-token", { withCredentials: true });
        if (user !== null) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [user]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center text-center text-gray-600 dark:text-gray-300">
          <Loader2 className="animate-spin w-8 h-8 mb-2" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // ✅ If authenticated, block access to public pages and redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Otherwise show public route content (e.g. login/registration)
  return <>{children}</>;
};

export default PublicRoute;
