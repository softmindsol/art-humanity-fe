import React, { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { changePassword, getUserById, updateUser, /* add your thunk below */ 
verifyPassword} from "@/redux/action/auth";
import useAppDispatch from "@/hook/useDispatch";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import "../../style/profile.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { requestEmailChange } from "@/redux/action/auth"; // <-- make sure this exists

const MIN_PASSWORD_LEN = 6;

const ProfilePage = () => {
    const { profile } = useSelector((state: RootState) => state?.auth);
    const dispatch = useAppDispatch();

    const [loader, setLoader] = useState(false);
 
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        profileImage: null as File | null,
      

    });

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordStep, setPasswordStep] = useState(1); // 1: Verify old password, 2: Set new password
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordLoader, setPasswordLoader] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Email-change modal state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
    const [emailLoading, setEmailLoading] = useState(false);

    // populate from profile
    useEffect(() => {
        if (profile) {
            setFormData((prev) => ({
                ...prev,
                fullName: profile.fullName || "",
                email: profile.email || "",
            }));
        }
    }, [profile]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;
        if (name === "profileImage" && files) {
            const file = files[0];
            // Optional: basic image validation
            if (!file.type.startsWith("image/")) {
                toast.error("Please select a valid image file.");
                return;
            }
            if (file.size > 3 * 1024 * 1024) {
                toast.error("Image must be under 3MB.");
                return;
            }
            setFormData((prev) => ({ ...prev, profileImage: file }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    // safer avatar preview (revoke object URL on change/unmount)
    const avatarPreview = useMemo(() => {
        if (formData.profileImage) {
            return URL.createObjectURL(formData.profileImage);
        }
        return profile?.avatar || "";
    }, [formData.profileImage, profile?.avatar]);

    useEffect(() => {
        return () => {
            if (avatarPreview && formData.profileImage) URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview, formData.profileImage]);

    // enable button only if something changed meaningfully
    const isChanged =
        formData.fullName !== (profile?.fullName || "") || !!formData.profileImage;

    const handleUpdate = () => {
        const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;

        if (formData.fullName.trim() && !nameRegex.test(formData.fullName.trim())) {
            toast.error("Display Name can only contain letters, numbers, spaces, hyphens, and underscores.");
            return;
        }
        setLoader(true);
        const data = new FormData();
        data.append("fullName", formData.fullName);
        if (formData.profileImage) {
            data.append("profileImage", formData.profileImage);
        }
        const userId = (profile as any)?.id ?? (profile as any)?._id;

        dispatch(updateUser({ userId, formData: data }))
            .unwrap()
            .then(() => {
                dispatch(getUserById(userId));
                setLoader(false);
                setFormData((prev) => ({ ...prev, profileImage: null }));
                toast.success("Profile updated successfully.");
            })
            .catch((error) => {
                setLoader(false);
                console.error("Failed to update profile:", error);
                toast.error(error?.message || "Failed to update profile.");
            });
    };
    // --- Password Verification (Step 1) ---
    const handleVerifyPassword = async () => {
        if (passwordForm.oldPassword.length < MIN_PASSWORD_LEN) {
            return toast.error("Please enter your current password.");
        }
        setPasswordLoader(true);
        try {
            const userId = (profile as any)?.id ?? (profile as any)?._id;
            // Aapko ek new thunk `verifyPassword` banana hoga jo sirf password check kare
            await dispatch(verifyPassword({ userId, oldPassword: passwordForm.oldPassword })).unwrap();
            setPasswordStep(2); // Move to the next step
            toast.success("Password verified. You can now set a new password.");
        } catch (err: any) {
            toast.error(err?.message || "Incorrect old password.");
        } finally {
            setPasswordLoader(false);
        }
    };

    // --- New Password Submission (Step 2) ---
    const handleChangePasswordSubmit = async () => {
        if (passwordForm.newPassword.length < MIN_PASSWORD_LEN) {
            return toast.error(`New password must be at least ${MIN_PASSWORD_LEN} characters.`);
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return toast.error("New passwords do not match.");
        }
        setPasswordLoader(true);
        try {
            const userId = (profile as any)?.id ?? (profile as any)?._id;
            // Yeh `updateUser` thunk ko call karega sirf password ke saath
            await dispatch(changePassword({
                userId,
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            })).unwrap();

            toast.success("Password changed successfully!");
            setShowPasswordModal(false);
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setPasswordStep(1);
        } catch (err: any) {
            toast.error(err || "Failed to change password.");
        } finally {
            setPasswordLoader(false);
        }
    };

    // Email-change submit
    const handleEmailChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailForm.newEmail.trim()) return toast.error("Please enter a new email.");
        if (!/\S+@\S+\.\S+/.test(emailForm.newEmail)) return toast.error("Enter a valid email.");
        if (emailForm.currentPassword.length < MIN_PASSWORD_LEN)
            return toast.error(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);

        setEmailLoading(true);
        try {
            const userId = (profile as any)?.id ?? (profile as any)?._id;

            await dispatch(
                requestEmailChange({
                    userId,
                    newEmail: emailForm.newEmail.trim(),
                    currentPassword: emailForm.currentPassword,
                })
            ).unwrap();

            setShowEmailModal(false);
            setEmailForm({ newEmail: "", currentPassword: "" });

            // Inform user about verification flow
            toast.success(
                "Email change requested. We’ve sent a verification link to your new email. Your account will be verified after you confirm."
            );

            // Optional: refresh profile to reflect pending change or server response
            dispatch(getUserById(userId));
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Failed to request email change.");
        } finally {
            setEmailLoading(false);
        }
    };

    // Get first letter fallback
    const fallbackLetter =
        profile?.fullName?.trim()?.charAt(0)?.toUpperCase() ||
        formData.fullName?.trim()?.charAt(0)?.toUpperCase() ||
        "A";

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
                            <div id="profile-avatar" className="profile-avatar" aria-label="Profile avatar">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile Avatar" className="profile-avatar-image" />
                                ) : (
                                    <div className="profile-avatar-fallback" aria-hidden>
                                        {fallbackLetter}
                                    </div>
                                )}
                            </div>

                            <button
                                id="change-avatar-btn"
                                className="btn-secondary"
                                type="button"
                                onClick={() => document.getElementById("file-input")?.click()}
                            >
                                Change Avatar
                            </button>

                            <input
                                type="file"
                                id="file-input"
                                name="profileImage"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="profile-section">
                            <h3>Account Information</h3>
                            <form id="profile-form" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                                {/* Display Name */}
                                <div className="form-group">
                                    <label htmlFor="profile-display-name">Display Name</label>
                                    <input type="text" id="profile-display-name" name="fullName" value={formData.fullName} onChange={handleChange} required />
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label htmlFor="profile-email">Email</label>
                                    <div className="input-with-button">
                                        <input type="email" id="profile-email" name="email" value={formData.email} disabled />
                                        <button type="button" id="change-email-btn" className="btn-secondary-profile" onClick={() => setShowEmailModal(true)}>Change Email</button>
                                    </div>
                                </div>

                                <button type="submit" className="btn-profile" disabled={!isChanged || loader}>
                                    {loader ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>

                        <div className="profile-section">
                            <h3>Security</h3>
                            <div className="form-group">
                                <label>Password</label>
                                <p>Set a unique password to protect your account.</p>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowPasswordModal(true);
                                        setPasswordStep(1);
                                        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>


            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                    <DialogHeader>
                        <DialogTitle className="!text-white">Change Password</DialogTitle>
                        <DialogDescription>
                            {passwordStep === 1
                                ? "To continue, please enter your current password."
                                : "Your old password is correct. Please enter a new password."}
                        </DialogDescription>
                    </DialogHeader>

                    {passwordStep === 1 ? (
                        // Step 1: Verify Old Password
                        <form 
                        onSubmit={(e) => { e.preventDefault(); handleVerifyPassword(); }}
                         className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="oldPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="oldPassword"
                                        name="oldPassword"
                                        type={showOldPassword ? "text" : "password"}
                                        value={passwordForm.oldPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={MIN_PASSWORD_LEN}
                                    />
                                    <button type="button" 
                                    onClick={() => setShowOldPassword((v) => !v)} className="absolute inset-y-0 right-0 px-3 flex items-center">
                                        {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={passwordLoader} className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50">
                                    {passwordLoader ? "Verifying..." : "Verify Password"}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        // Step 2: Set New Password
                        <form onSubmit={(e) => {
                             e.preventDefault(); 
                        handleChangePasswordSubmit();
                         }} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={MIN_PASSWORD_LEN}
                                    />
                                    <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="absolute inset-y-0 right-0 px-3 flex items-center">
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength={MIN_PASSWORD_LEN}
                                />
                            </div>
                            <DialogFooter>
                                    <Button type="submit" disabled={passwordLoader} className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50">
                                    {passwordLoader ? "Saving..." : "Save New Password"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
            {/* Change Email Modal (very lightweight, no extra deps) */}
            <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
                <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                    <DialogHeader>
                        <DialogTitle className="!text-white">Change Email</DialogTitle>
                        <DialogDescription>
                            Enter your new email and current password. We’ll send a verification link to the new address.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleEmailChangeSubmit}
                        className="space-y-4"
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="new-email">New Email</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={emailForm.newEmail}
                                onChange={(e) => setEmailForm((p) => ({ ...p, newEmail: e.target.value }))}
                                placeholder="you@newdomain.com"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={emailForm.currentPassword}
                                onChange={(e) => setEmailForm((p) => ({ ...p, currentPassword: e.target.value }))}
                                placeholder="Enter current password"
                                required
                                minLength={MIN_PASSWORD_LEN}
                            />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                className="cursor-pointer"
                                type="button"
                                variant="outline"
                                onClick={() => setShowEmailModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={emailLoading} className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50" >
                                {emailLoading ? "Submitting..." : "Submit"}
                            </Button>
                        </DialogFooter>
 
                        <p className="text-sm text-muted-foreground">
                            After submitting, your account will be set to <strong>unverified</strong>. Check your new inbox for the verification link.
                        </p>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ProfilePage;
