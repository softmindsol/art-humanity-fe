import { useEffect, useState, } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/api/api";
import useAuth from "@/hook/useAuth";

interface PublicRouteProps {
  children: any;
}
 
const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user } = useAuth();
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
      <div className="flex-col gap-4 w-full flex h-screen items-center justify-center">
        <div className="w-20 h-20 border-4 border-transparent text-[#FEC133] text-4xl animate-spin flex items-center justify-center border-t-[#FEC133] rounded-full">
          <div className="w-16 h-16 border-4 border-transparent text-[#E23373] text-2xl animate-spin flex items-center justify-center border-t-[#E23373] rounded-full"></div>
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
