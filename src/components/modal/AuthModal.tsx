import React, { useState } from 'react';
import googleImage from '../../assets/images/google-icon.svg';
import { useRegisterForm } from '@/hook/useRegisterForm';
import { Eye, EyeOff } from 'lucide-react';
import ForgotPasswordForm from './ForgotPasswordForm';
import { googleLogin } from '../../redux/action/auth';
import useAppDispatch from '@/hook/useDispatch';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

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
      

    } = useRegisterForm({onClose});







    if (!isOpen) return null;

    return (
        <div className="auth-modal">
            <div className="auth-modal-content">
                <span className="auth-modal-close" onClick={onClose}>&times;</span>
                <div className="auth-modal-header">
                    <h2>Join Project Art of Humanity</h2>
                    <p>Create an account to contribute to the world's largest collaborative art project</p>
                </div>

                {!showForgotPassword && (
                    <div className="auth-tabs">
                        <div
                            className={`auth-tab ${activeTab === 'sign-up' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sign-up')}
                        >
                            Sign Up
                        </div>
                        <div
                            className={`auth-tab ${activeTab === 'sign-in' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sign-in')}
                        >
                            Sign In
                        </div>
                    </div>
                )}

                {showForgotPassword ? (
                    <ForgotPasswordForm onBackToSignIn={() => setShowForgotPassword(false)} />
                ) : activeTab === 'sign-in' ? (
                    <form className="auth-form" onSubmit={handleLoginSubmit}>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                required
                            />
                            {loginErrors.email && <p className="error text-red-500">{loginErrors.email}</p>}
                        </div>
                        <div className="form-group relative">
                            <label>Password</label>
                            <input
                                type={showSigninPassword ? 'text' : 'password'}
                                name="password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                required
                            />
                            <span
                                className="eye-icon absolute right-3 top-11.5 cursor-pointer"
                                onClick={() => setShowSigninPassword(!showSigninPassword)}
                            >
                                {showSigninPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                            {loginErrors.password && <p className="error text-red-500">{loginErrors.password}</p>}
                        </div>
                        <button type="submit" className="auth-submit" disabled={loginLoading}>
                            {loginLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                        <div className="auth-divider"><span>or</span></div>
                        <button
                            type="button"
                            className="social-auth-btn"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                        >
                            <img src={googleImage} alt="Google" />
                            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                        </button>

                        <div className="auth-footer">
                            <button type="button" onClick={() => setShowForgotPassword(true)} className="text-[#5d4037] hover:underline cursor-pointer">
                                Forgot password?
                            </button>
                        </div>
                    </form>

                ) : (
                    <form className="auth-form" >
                        <div className="form-group">
                            <label>Display Name</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
                            {errors.fullName && <p className="error text-red-500">{errors.fullName}</p>}
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                            {errors.email && <p className="error text-red-500">{errors.email}</p>}
                        </div>
                        <div className="form-group relative">
                            <label>Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <span
                                className="eye-icon absolute right-3 top-11.5 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                            {errors.password && <p className="error text-red-500">{errors.password}</p>}
                        </div>
                        <div className="form-group relative">
                            <label>Confirm Password</label>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            <span
                                className="eye-icon absolute right-3 top-11.5 cursor-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                            {errors.confirmPassword && <p className="error text-red-500">{errors.confirmPassword}</p>}
                        </div>
                        <button type="submit" onClick={handleSubmit} className="auth-submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                        <div className="auth-divider"><span>or</span></div>
                        <button
                            type="button"
                            className="social-auth-btn"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                        >
                            <img src={googleImage} alt="Google" />
                            {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                        </button>

                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
