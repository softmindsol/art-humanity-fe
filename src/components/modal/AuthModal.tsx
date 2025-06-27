import React, { useState } from 'react';
import googleImage from '../../assets/images/google-icon.svg'; // Adjust the path as necessary
import { useRegisterForm } from '@/hook/useRegisterForm';
interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'sign-in' | 'sign-up'>('sign-in');
    const {
        formData,
        errors,
        loading,
        handleChange,
        handleSubmit,
    } = useRegisterForm();

    if (!isOpen) return null;


    return (
        <div className="auth-modal">
            <div className="auth-modal-content">
                <span className="auth-modal-close" onClick={onClose}>&times;</span>
                <div className="auth-modal-header">
                    <h2>Join Project Art of Humanity</h2>
                    <p>Create an account to contribute to the world's largest collaborative art project</p>
                </div>

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

                {activeTab === 'sign-in' ? (
                    <form className="auth-form">
                        {/* Sign In form */}
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" required />
                        </div>
                        <button type="submit" className="auth-submit">Sign In</button>
                        <div className="auth-divider"><span>or</span></div>
                        <button type="button" className="social-auth-btn">
                            <img src={googleImage} alt="Google" />
                            Sign in with Google
                        </button>
                        <div className="auth-footer">
                            <a href="#">Forgot password?</a>
                        </div>
                    </form>
                ) : (
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Display Name</label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
                                {errors.fullName && <p className="error">{errors.fullName}</p>}
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} />
                                {errors.email && <p className="error">{errors.email}</p>}
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} />
                                {errors.password && <p className="error">{errors.password}</p>}
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
                                {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
                            </div>
                            <button type="submit" className="auth-submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>

                            <div className="auth-divider"><span>or</span></div>
                            <button type="button" className="social-auth-btn">
                                <img src={googleImage} alt="Google" />
                                Sign in with Google
                            </button>
                        </form>
                  
                )}
            </div>
        </div>
    );
};

export default AuthModal;
