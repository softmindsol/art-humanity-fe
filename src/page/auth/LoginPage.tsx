import React, { useState } from "react";
import { useRegisterForm } from "@/hook/useRegisterForm";
import { Eye, EyeOff } from "lucide-react";
import googleImage from "@/assets/images/google-icon.svg";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { googleLoading } = useSelector((state: RootState) => state.auth);

  // We can reuse the hook's login logic
  const {
    loginData,
    handleLoginChange,
    handleLoginSubmit,
    showSigninPassword,
    setShowSigninPassword,
    handleGoogleLogin,
    loginLoading,
    loginErrors,
  } = useRegisterForm({ onClose: () => navigate("/") });

  // Local state for Remember Me since it might not be in the hook
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex !items-center justify-center bg-[#0F0D0D] overflow-y-auto">
      {/* Left Side - Image */}
      <div className="hidden lg:flex">
        <div className="" />
        {/* Placeholder for the login specific image */}
        <img
          src="/assets/login-img.svg"
          alt="Collaborative Art"
          // className="m-6 object-cover rounded-[12px]"
          className="m-6 max-h-[600px] object-cover rounded-[12px]"
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-[680px] 2xl:w-[800px] flex items-center justify-start px-4 py-8 md:p-12 lg:px-12 xl:px-6">
        <div className="w-full  space-y-3 xl:space-y-4">
          <div className="">
            <h3 className="!text-white text-lg lg:text-xl xl:text-[26px] !font-semibold">
              Log In
            </h3>
            <h1 className="text-xl lg:text-2xl xl:text-[32px] !font-semibold !text-white tracking-tight">
              Join MurArt
            </h1>
            <p className="max-w-xl w-full text-white font-semibold text-sm lg:text-base xl:text-lg">
              Login to your account to contribute to the world's largest
              collaborative art project
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="lg:space-y-4 space-y-3">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm lg:text-base font-semibold text-white">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Enter your Email"
                className="w-full bg-[#2E2E2E] text-sm border border-gray-800 rounded-[8px] px-4 py-3 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-1 focus:ring-[#FEC133] transition-all"
              />
              {loginErrors.email && (
                <p className="text-red-500 text-xs">{loginErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm lg:text-base font-semibold text-white">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSigninPassword ? "text" : "password"}
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="••••••••"
                  className="w-full bg-[#2E2E2E] text-sm border border-gray-800 rounded-[8px] px-4 py-3 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-1 focus:ring-[#FEC133] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSigninPassword(!showSigninPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showSigninPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-red-500 text-xs">{loginErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#2E2E2E] accent-[#FEC133]"
                />
                <span className="text-white text-sm">Remember Me</span>
              </label>
              <Link
                to="/forgot-password"
                className="!text-[#E23373] hover:!underline text-sm font-medium"
              >
                Forget Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loginLoading}
              className="w-full lg:h-12 h-11 bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 text-white font-semibold rounded-full text-base border-0 transition-transform active:scale-[0.98]"
            >
              {loginLoading ? "Logging In..." : "Login"}
            </Button>

            <div className="relative flex items-center gap-4 ">
              <div className="h-[1px] bg-[#272727] flex-1"></div>
              <span className="!text-white text-base font-semibold">Or</span>
              <div className="h-[1px] bg-[#272727] flex-1"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full h-12 bg-[#2E2E2E] hover:bg-[#252525] border border-gray-800 text-white rounded-[8px] flex items-center justify-center gap-3 text-sm transition-colors font-medium disabled:opacity-50"
            >
              <div className="size-7 md:size-8 bg-white rounded-full flex items-center justify-center">
                <img
                  src={googleImage}
                  alt="Google"
                  className="md:size-6 size-5"
                />
              </div>
              {googleLoading ? "Signing in..." : "Sign up with Google"}
            </button>

            <p className="text-left text-white font-semibold md:text-base text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="!text-[#E23373] hover:!underline">
                Signup
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
