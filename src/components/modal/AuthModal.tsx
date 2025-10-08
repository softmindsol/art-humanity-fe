import React, { useState } from 'react';
import googleImage from '../../assets/images/google-icon.svg';
import { useRegisterForm } from '@/hook/useRegisterForm';
import { Eye, EyeOff } from 'lucide-react';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import AnimatedDots from '../common/AnimatedDots';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'sign-in' | 'sign-up'>('sign-in');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { googleLoading } = useSelector((state: RootState) => state.auth);

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
        showSigninPassword,
        setShowSigninPassword,
        handleLoginSubmit,
        handleLoginChange,
        loginData,
        loginErrors,
        loginLoading,
        handleGoogleLogin
    } = useRegisterForm({ onClose });

    // Disable modal if either login or sign-up is loading
    const isModalDisabled = loginLoading || loading;

    if (!isOpen) return null;

    return (
        <div className="auth-modal fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="auth-modal-content relative bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-md">

                {/* Overlay while loading */}
                {isModalDisabled && (
                    <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center">
                        <p className="text-white text-lg flex items-center gap-2">
                            Processing
                            <AnimatedDots />
                        </p>
                    </div>
                )}

                {/* Close Button */}
                <span
                    className={`auth-modal-close absolute top-2 right-3 text-2xl cursor-pointer ${isModalDisabled ? 'pointer-events-none opacity-50' : ''}`}
                    onClick={onClose}
                >
                    &times;
                </span>

                {/* Header */}
                <div className="auth-modal-header mb-4">
                    <h2 className="text-xl font-bold">Join MurArt</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Create an account to contribute to the world's largest collaborative art project
                    </p>
                </div>

                {/* Tabs */}
                {!showForgotPassword && (
                    <div className="auth-tabs flex mb-4 border-b">
                        <div
                            className={`auth-tab flex-1 text-center py-2 cursor-pointer ${activeTab === 'sign-up' ? 'font-bold border-b-2 border-black dark:border-white' : ''}`}
                            onClick={() => setActiveTab('sign-up')}
                        >
                            Sign Up
                        </div>
                        <div
                            className={`auth-tab flex-1 text-center py-2 cursor-pointer ${activeTab === 'sign-in' ? 'font-bold border-b-2 border-black dark:border-white' : ''}`}
                            onClick={() => setActiveTab('sign-in')}
                        >
                            Sign In
                        </div>
                    </div>
                )}

                {/* Forgot Password */}
                {showForgotPassword ? (
                    <ForgotPasswordForm onBackToSignIn={() => setShowForgotPassword(false)} />
                ) : activeTab === 'sign-in' ? (
                    <form className="auth-form" onSubmit={handleLoginSubmit}>
                        {/* Email */}
                        <div className="form-group mb-3">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                placeholder="Enter your email"
                                required
                                disabled={isModalDisabled}
                                className="w-full px-3 py-2 border rounded"
                            />
                            {loginErrors.email && <p className="error text-red-500">{loginErrors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="form-group relative mb-3">
                            <label>Password</label>
                            <input
                                type={showSigninPassword ? 'text' : 'password'}
                                name="password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                placeholder="Enter your password"
                                required
                                disabled={isModalDisabled}
                                className="w-full px-3 py-2 border rounded"
                            />
                            <span
                                className="eye-icon absolute right-3 top-10 cursor-pointer"
                                onClick={() => setShowSigninPassword(!showSigninPassword)}
                            >
                                {showSigninPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                            {loginErrors.password && <p className="error text-red-500">{loginErrors.password}</p>}
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            className="auth-submit w-full py-2 bg-black text-white rounded mb-3 disabled:opacity-50"
                            disabled={isModalDisabled}
                        >
                            {loginLoading ? 'Signing in...' : 'Sign In'}
                        </button>

                        {/* Divider */}
                        <div className="auth-divider text-center my-2"><span>or</span></div>

                        {/* Google Sign-in */}
                        <button
                            type="button"
                            className="social-auth-btn flex items-center justify-center w-full py-2 border rounded mb-2 disabled:opacity-50"
                            onClick={handleGoogleLogin}
                            disabled={isModalDisabled || googleLoading}
                        >
                            <img src={googleImage} alt="Google" className="w-5 h-5 mr-2" />
                            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                        </button>

                        {/* Forgot Password */}
                        <div className="auth-footer text-center mt-2">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-[#5d4037] hover:underline cursor-pointer"
                                disabled={isModalDisabled}
                            >
                                Forgot password?
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Sign Up Form */
                    <form className="auth-form h-[450px] !overflow-y-auto" onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                            <label>Display Name</label>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Enter your full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                disabled={isModalDisabled}
                                className="w-full px-3 py-2 border rounded"
                            />
                            {errors.fullName && <p className="error text-red-500">{errors.fullName}</p>}
                        </div>

                        <div className="form-group mb-3">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isModalDisabled}
                                className="w-full px-3 py-2 border rounded"
                            />
                            {errors.email && <p className="error text-red-500">{errors.email}</p>}
                        </div>

                        <div className="form-group relative mb-3">
                            <label>Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isModalDisabled}
                                className="w-full px-3 py-2 border rounded"
                            />
                            <span
                                className="eye-icon absolute right-3 top-10 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                            {errors.password && <p className="error text-red-500">{errors.password}</p>}
                        </div>

                        <div className="form-group relative mb-3">
                            <label>Confirm Password</label>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Enter your confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={isModalDisabled}
                                className="w-full px-3 py-2 border rounded"
                            />
                            <span
                                className="eye-icon absolute right-3 top-10 cursor-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                            {errors.confirmPassword && <p className="error text-red-500">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            className="auth-submit w-full py-2 bg-black text-white rounded mb-3 disabled:opacity-50"
                            disabled={isModalDisabled}
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>

                        <div className="auth-divider text-center my-2"><span>or</span></div>

                        <button
                            type="button"
                            className="social-auth-btn flex items-center justify-center w-full py-2 border rounded disabled:opacity-50"
                            onClick={handleGoogleLogin}
                            disabled={isModalDisabled || googleLoading}
                        >
                            <img src={googleImage} alt="Google" className="w-5 h-5 mr-2" />
                            {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
