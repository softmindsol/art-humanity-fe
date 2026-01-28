import React, { useState } from 'react';
import { useRegisterForm } from '@/hook/useRegisterForm';
import { Eye, EyeOff } from 'lucide-react';
import googleImage from '@/assets/images/google-icon.svg';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

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
        loginErrors
    } = useRegisterForm({ onClose: () => navigate('/') });

    // Local state for Remember Me since it might not be in the hook
    const [rememberMe, setRememberMe] = useState(false);

    return (
        <div className="min-h-screen flex bg-black overflow-y-auto">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:flex-1 relative">
                <div className="" />
                 {/* Placeholder for the login specific image */}
                <img 
                    src="/assets/login-img.svg" 
                    alt="Collaborative Art" 
                    className="2xl:w-[calc(100%-20px)] w-[calc(100%-30px)] h-[calc(100vh-60px)] m-6 object-cover rounded-[12px]"
                />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-[680px] 2xl:w-[800px] flex items-center justify-center px-4 py-8 md:p-12 lg:px-10">
                <div className="w-full max-w-2xl space-y-4 xl:space-y-8">
                    <div className="space-y-2">
                        <h3 className="!text-white text-[20px] lg:text-[26px] font-semibold">Log In</h3>
                        <h1 className="text-[26px] lg:text-[32px] font-semibold !text-white tracking-tight">Join MurArt</h1>
                        <p className="text-white font-semibold text-[14px] lg:text-lg">
                            Login to your account to contribute to the world's largest collaborative art project
                        </p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[14px] lg:text-base font-semibold text-white">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                placeholder="Enter your Email"
                                className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                            />
                            {loginErrors.email && <p className="text-red-500 text-xs mt-1">{loginErrors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[14px] lg:text-base font-semibold text-white">Password</label>
                            <div className="relative">
                                <input
                                    type={showSigninPassword ? 'text' : 'password'}
                                    name="password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    placeholder="••••••••"
                                    className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSigninPassword(!showSigninPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showSigninPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password}</p>}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-[#2E2E2E] text-[#E23373] focus:ring-[#E23373] focus:ring-offset-0"
                                />
                                <span className="text-gray-300 text-sm">Remember Me</span>
                            </label>
                            <Link to="/forgot-password" className="!text-[#E23373]  text-sm font-medium !underline">
                                Forget Password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full h-12 bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 text-white font-semibold rounded-full text-base border-0 transition-transform active:scale-[0.98]"
                        >
                            {loginLoading ? 'Logging In...' : 'Login'}
                        </Button>

                        <div className="relative flex items-center gap-4 ">
                            <div className="h-[1px] bg-gray-800 flex-1"></div>
                            <span className="!text-white text-base font-semibold">Or</span>
                            <div className="h-[1px] bg-gray-800 flex-1"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            className="w-full h-12 bg-[#2E2E2E] hover:bg-[#252525] border border-gray-800 text-white rounded-[8px] flex items-center justify-center gap-3 transition-colors font-medium disabled:opacity-50"
                        >
                            <img src={googleImage} alt="Google" className="w-5 h-5" />
                            {googleLoading ? 'Signing in...' : 'Sign up with Google'}
                        </button>

                        <p className="text-left text-white font-semibold text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="!text-[#E23373] hover:underline">
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
