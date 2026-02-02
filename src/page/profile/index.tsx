import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  getUserById,
  updateUser,
  requestEmailChange,
} from "@/redux/action/auth";
import useAppDispatch from "@/hook/useDispatch";
import { toast } from "sonner";
import { Camera, AlertCircle, Loader2 } from "lucide-react";
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
import PasswordSection from "./PasswordSection";

const ProfilePage = () => {
  const { profile } = useSelector((state: RootState) => state?.auth);
  const dispatch = useAppDispatch();

  // Loading States
  const [profileLoader, setProfileLoader] = useState(false);
  const [emailLoader, setEmailLoader] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    profileImage: null as File | null,
  });

  // Modals
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [emailVerificationPassword, setEmailVerificationPassword] =
    useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate from profile
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        fullName: profile.fullName || "",
        email: profile.email || "",
      }));
    }
  }, [profile]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Image must be under 3MB.");
        return;
      }
      setFormData((prev) => ({ ...prev, profileImage: file }));
    }
  };

  // Avatar Preview
  const avatarPreview = useMemo(() => {
    if (formData.profileImage) {
      return URL.createObjectURL(formData.profileImage);
    }
    return profile?.avatar || "";
  }, [formData.profileImage, profile?.avatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview && formData.profileImage)
        URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview, formData.profileImage]);

  // 1. Handle Personal Details Update (Name & Avatar)
  const handleProfileUpdate = () => {
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;

    // Check if name is valid
    if (formData.fullName.trim() && !nameRegex.test(formData.fullName.trim())) {
      toast.error(
        "Display Name can only contain letters, numbers, spaces, hyphens, and underscores.",
      );
      return;
    }

    // Check if email has changed
    if (formData.email !== profile?.email) {
      // Trigger email verification flow
      setShowEmailVerificationModal(true);
      return;
    }

    // Proceed with normal profile update (Name/Image)
    setProfileLoader(true);
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
        setProfileLoader(false);
        setFormData((prev) => ({ ...prev, profileImage: null }));
        toast.success("Profile updated successfully.");
      })
      .catch((error) => {
        setProfileLoader(false);
        toast.error(error?.message || "Failed to update profile.");
      });
  };

  // 2. Handle Email Update (via Modal)
  const handleEmailUpdateConfirm = async () => {
    if (!emailVerificationPassword) {
      toast.error("Please enter your password to confirm email change.");
      return;
    }

    setEmailLoader(true);
    const userId = (profile as any)?.id ?? (profile as any)?._id;

    try {
      await dispatch(
        requestEmailChange({
          userId,
          newEmail: formData.email,
          currentPassword: emailVerificationPassword,
        }),
      ).unwrap();

      toast.success("Verification link sent to your new email.");
      setShowEmailVerificationModal(false);
      setEmailVerificationPassword("");

      // Also update the name/image if they were changed together, to be helpful
      if (formData.fullName !== profile?.fullName || formData.profileImage) {
        // We don't wait for this one
        const data = new FormData();
        data.append("fullName", formData.fullName);
        if (formData.profileImage)
          data.append("profileImage", formData.profileImage);
        dispatch(updateUser({ userId, formData: data }));
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update email.");
    } finally {
      setEmailLoader(false);
    }
  };

  // Helper to clear selected image
  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profileImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Image selection cleared. Save to apply changes.");
  };

  const fallbackLetter = profile?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#0F0D0D] text-white font-montserrat pb-20 pt-10 lg:mt-26 mt-18">
      <div className="max-w-[1440px] mx-auto md:px-10 px-8">
        {/* Header */}
        <div className="text-center lg:mb-12 mb-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-[54px] font-bold bg-gradient-to-r from-[#E23373] to-[#FEC133] !bg-clip-text !text-transparent inline-block">
            Your Profile
          </h1>
        </div>

        {/* Profile Details Card */}
        <div className="bg-[#141414] rounded-2xl p-6 md:p-10 border border-white/5 shadow-2xl">
          {/* Section 1: Profile Photo */}
          <div className="flex flex-col md:flex-row items-center lg:gap-8 gap-4 lg:mb-12 mb-6">
            <div className="relative group">
              <div className="size-20 md:size-24 lg:size-28 rounded-full p-[2px] bg-gradient-to-r from-[#E23373] to-[#FEC133]">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0F0D0D] relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">
                      {fallbackLetter}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 md:p-2 p-1 bg-gradient-to-r from-[#E23373] to-[#FEC133] rounded-full text-white hover:scale-110 transition-transform shadow-lg"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-1">
              <h2 className="text-lg font-semibold !text-white !mb-0 lg:!mb-1">
                {formData.fullName || "User Name"}
              </h2>
              <p className="text-[#ffffff]">
                {profile?.email || "user@example.com"}
              </p>
            </div>

            {formData.profileImage && (
              <div
                className="inline-block rounded-full p-[1.5px] 
                bg-gradient-to-r from-[#E23373] to-[#FEC133]"
              >
                <Button
                  onClick={handleRemovePhoto}
                  variant="outline"
                  className="rounded-full border-0 bg-black font-semibold text-[#ffffff] hover:bg-white/10 px-6 cursor-pointer"
                >
                  Remove Photo
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 my-8"></div>

          {/* Section 2: Personal Details */}
          <div>
            <h3 className="text-lg font-semibold !text-white lg:!mb-6 !mb-4">
              Personal Details
            </h3>
            <div className="lg:space-y-6 space-y-3">
              <div className="space-y-1">
                <Label className="text-base font-semibold !text-white">
                  Name
                </Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your Name"
                  className="bg-[#2E2E2E] border-none text-white h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-[#E23373] placeholder:text-[#AAB2C7]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-semibold !text-white">
                  Email
                </Label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your Email"
                  className="bg-[#2E2E2E] border-none text-white h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-[#E23373] placeholder:text-[#AAB2C7]"
                />
                {formData.email !== profile?.email && (
                  <p className="text-xs text-[#FEC133] flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    Changing email will require password verification.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleProfileUpdate}
                disabled={profileLoader}
                className="bg-gradient-to-r from-[#E23373] to-[#FEC133] rounded-full px-8 py-2 h-10 text-white font-semibold hover:opacity-90 border-none transition-all"
              >
                {profileLoader ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Password Section (Separate Card) */}
        <PasswordSection />
      </div>

      {/* Email Verification Modal */}
      <Dialog
        open={showEmailVerificationModal}
        onOpenChange={setShowEmailVerificationModal}
      >
        <DialogContent className="bg-[#141414] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Verify Email Change
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              To update your email to <b>{formData.email}</b>, please enter your
              current password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={emailVerificationPassword}
                onChange={(e) => setEmailVerificationPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-[#2E2E2E] border-none text-white focus-visible:ring-1 focus-visible:ring-[#E23373]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailVerificationModal(false);
              }}
              className="bg-transparent border-white/20 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmailUpdateConfirm}
              disabled={emailLoader}
              className="bg-gradient-to-r from-[#E23373] to-[#FEC133] border-none text-white hover:opacity-90"
            >
              {emailLoader ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                "Verify & Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
