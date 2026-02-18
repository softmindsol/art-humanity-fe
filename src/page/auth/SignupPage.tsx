import React from 'react';
import { useRegisterForm } from '@/hook/useRegisterForm';
import { Eye, EyeOff } from 'lucide-react';
import googleImage from '@/assets/images/google-icon.svg';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    
    const { googleLoading } = useSelector((state: RootState) => state.auth);

    // Pass a dummy onClose or a navigation function if the hook expects it for other actions.
    const {
        formData,
        errors,
        loading,
        handleChange,
        handleSubmit,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        handleGoogleLogin,
    } = useRegisterForm({ onClose: () => navigate('/') });

    return (
        <div className="min-h-screen flex bg-black overflow-y-auto">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:flex-1 relative">
                <div className="" />
                 {/* Using a placeholder fractal/art image that matches the vibe */}
                <img 
                    src="/assets/signup-img.svg" 
                    alt="Collaborative Art" 
                    className="m-8 object-cover rounded-[12px]"
                />
            </div>
 
            {/* Right Side - Form */}
            <div className="w-full lg:w-[680px] 2xl:w-[800px] flex items-center justify-center px-4 py-8 md:p-12 lg:px-10">
                <div className="w-full max-w-2xl space-y-4 xl:space-y-8">
                    <div className="space-y-2">
                        <h3 className="!text-white text-[20px] lg:text-[26px] !font-semibold">Signup</h3>
                        <h1 className="text-[26px] lg:text-[32px] !font-semibold !text-white tracking-tight">Join MurArt</h1>
                        <p className="text-white font-semibold text-[14px] lg:text-lg">
                            Create an account to contribute to the world's largest collaborative art project
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[14px] lg:text-base font-semibold text-white">Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                />
                                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-[14px] lg:text-base font-semibold text-white">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your Email"
                                    className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-[14px] lg:text-base font-semibold text-white">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-[14px] lg:text-base font-semibold text-white">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 text-white font-semibold rounded-full text-base border-0 transition-transform active:scale-[0.98]"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
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
                            {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                        </button>

                        <p className="text-left text-white font-semibold md:text-base text-sm">
                            Already have an account?{' '}
                            {/* In the future this will link to /login, for now we can leave it or link to home/modal trigger */}
                            <Link to="/login" className="!text-[#E23373] hover:!underline">
                                Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
