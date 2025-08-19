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
                await api.get(`/auth/${user?.id}`, { withCredentials: true });
                if (user !== null) {
                    setIsAuthenticated(true);
                }

                else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, [user]);

    if (!user) {
        return <Navigate to='/' replace />;
    }
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
                <div className="flex flex-col items-center text-center text-gray-600 dark:text-gray-300">
                    <Loader2 className="animate-spin w-8 h-8 mb-2" />
                    <p>Checking authentication...</p>
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
