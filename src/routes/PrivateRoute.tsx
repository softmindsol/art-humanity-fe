import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/api/api";
import useAuth from "@/hook/useAuth";

interface ProtectedRouteProps {
  children: any;
  allowedRoles?: string[];
  requiredPath?: string; // ✅ new
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get(`/auth/${user?._id}`, { withCredentials: true });
        if (user !== null) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [user]);

  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (isAuthenticated === null) {
    return (
      <div className="flex-col gap-4 w-full flex h-screen items-center justify-center">
        <div className="w-20 h-20 border-4 border-transparent text-[#E23373] text-4xl animate-spin flex items-center justify-center border-t-[#E23373] rounded-full">
          <div className="w-16 h-16 border-4 border-transparent text-[#FEC133] text-2xl animate-spin flex items-center justify-center border-t-[#FEC133] rounded-full"></div>
        </div>
      </div>
    );
  }

  // ✅ If user is NOT authenticated, redirect to login
  // if (!isAuthenticated) {
  //     return <Navigate to="/" state={{ from: location }} replace />;
  // }
  // ✅ Block based on permission role
  // if (allowedRoles && !allowedRoles.includes(user?.permission)) {
  //     return <Navigate to="/unauthorized" replace />;
  // }

  // if (
  //     requiredPath &&
  //     user?.permission !== "Super Admin" &&
  //     !user?.navigationAccess?.includes(requiredPath)
  // ) {
  //     return <Navigate to="/unauthorized" replace />;
  // }

  // ✅ Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
