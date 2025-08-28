import React, { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { getUserById, updateUser } from "@/redux/action/auth";
import useAppDispatch from "@/hook/useDispatch";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import '../../style/profile.css';

const ProfilePage = () => {
    const { profile } = useSelector((state: RootState) => state.auth);
    const dispatch = useAppDispatch();
    const [loader, setLoader] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        profileImage: null as File | null,
        newPassword: "",
        confirmPassword: "",
    });

    const isChanged =
        formData.fullName !== (profile?.fullName || "") ||
        formData.newPassword !== "" ||
        formData.confirmPassword !== "" ||
        formData.profileImage !== null;

    useEffect(() => {
        if (profile) {
            setFormData((prev) => ({
                ...prev,
                fullName: profile.fullName || "",
                email: profile.email || "",
            }));
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;
        if (name === "profileImage" && files) {
            setFormData((prev) => ({ ...prev, profileImage: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdate = () => {
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setLoader(true);

        const data = new FormData();
        data.append("fullName", formData.fullName);
        if (formData.newPassword) {
            data.append("password", formData.newPassword);
        }
        if (formData.profileImage) {
            data.append("profileImage", formData.profileImage);
        }

        dispatch(updateUser({ userId: profile?.id, formData: data }))
            .unwrap()
            .then(() => {
                dispatch(getUserById(profile?.id));
                setLoader(false);

                // ✅ Reset sensitive fields
                setFormData((prev) => ({
                    ...prev,
                    profileImage: null,
                    newPassword: "",
                    confirmPassword: "",
                }));

                toast.success("Profile updated successfully");
            })
            .catch((error) => {
                setLoader(false);
                console.error("Failed to update profile:", error);
                toast.error("Failed to update profile");
            });
    };

    // Get the first letter of fullName for fallback
    const avatarContent = formData.profileImage
        ? URL.createObjectURL(formData.profileImage)
        : profile?.avatar || (profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '');

    return (
        <div className="container">
            <main>
                <section className="profile-header">
                    <h2>My Profile</h2>
                    <p>Manage your account</p>
                </section>
                <section className="profile-content">
                    <div className="profile-sidebar">
                        <div className="profile-avatar-container">
                            <div id="profile-avatar" className="profile-avatar">
                                {/* Fallback to letter if no profile image */}
                                {formData.profileImage || profile?.avatar ? (
                                    <img
                                        src={avatarContent}
                                        alt="Profile Avatar"
                                        className="profile-avatar-image"
                                    />
                                ) : (
                                    <div className="profile-avatar-fallback">
                                        {/* Display first letter of fullName */}
                                        {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                )}
                            </div>
                            <button
                                id="change-avatar-btn"
                                className="btn-secondary"
                                onClick={() => document.getElementById('file-input')?.click()}
                            >
                                Change Avatar
                            </button>
                            <input
                                type="file"
                                id="file-input"
                                name="profileImage"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="profile-section">
                            <h3>Account Information</h3>
                            <form id="profile-form" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                                <div className="form-group">
                                    <label htmlFor="profile-display-name">Display Name</label>
                                    <input
                                        type="text"
                                        id="profile-display-name"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="profile-email">Email</label>
                                    <div className="input-with-button">
                                        <input
                                            type="email"
                                            id="profile-email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled
                                        />
                                        {/* <button
                                            type="button"
                                            id="change-email-btn"
                                            className="btn-secondary"
                                            onClick={() => alert('Email change functionality here')}
                                        >
                                            Change Email
                                        </button> */}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="profile-password">Password</label>
                                    <div className="input-with-button">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="profile-password"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            name="newPassword"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="btn-secondary "
                                        >
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </button>
                                    </div>
                                    <div className="input-with-button">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="profile-confirm-password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            name="confirmPassword"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="btn-secondary"
                                        >
                                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-profile" disabled={!isChanged || loader}>
                                    {loader ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ProfilePage;
