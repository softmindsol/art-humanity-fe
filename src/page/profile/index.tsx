import React, { useEffect, useMemo, useState } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { getUserById, updateUser /* add your thunk below */ } from "@/redux/action/auth";
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
        formData.fullName !== (profile?.fullName || "") ||
        !!formData.profileImage ||
        (formData.newPassword.length > 0 && formData.confirmPassword.length > 0);

    const handleUpdate = () => {
        // password validations
        if (formData.newPassword || formData.confirmPassword) {
            if (formData.newPassword.length < MIN_PASSWORD_LEN) {
                toast.error(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                toast.error("Passwords do not match.");
                return;
            }
        }

        setLoader(true);

        const data = new FormData();
        data.append("fullName", formData.fullName);
        if (formData.newPassword) data.append("password", formData.newPassword);
        if (formData.profileImage) data.append("profileImage", formData.profileImage);

        // NOTE: confirm your id field: many apps use _id
        const userId = (profile as any)?.id ?? (profile as any)?._id;

        dispatch(updateUser({ userId, formData: data }))
            .unwrap()
            .then(() => {
                dispatch(getUserById(userId));
                setLoader(false);

                // reset sensitive fields
                setFormData((prev) => ({
                    ...prev,
                    profileImage: null,
                    newPassword: "",
                    confirmPassword: "",
                }));

                toast.success("Profile updated successfully.");
            })
            .catch((error) => {
                setLoader(false);
                console.error("Failed to update profile:", error);
                toast.error("Failed to update profile.");
            });
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
                                        <button
                                            type="button"
                                            id="change-email-btn"
                                            className="btn-secondary"
                                            onClick={() => setShowEmailModal(true)}
                                        >
                                            Change Email
                                        </button>
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
                                            minLength={MIN_PASSWORD_LEN}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="btn-secondary"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
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
                                            minLength={MIN_PASSWORD_LEN}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="btn-secondary"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
