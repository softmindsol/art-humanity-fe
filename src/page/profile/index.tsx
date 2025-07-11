import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { getUserById, updateUser } from "@/redux/action/auth";
import useAppDispatch from "@/hook/useDispatch";
import { toast } from "sonner";

const ProfilePage = () => {
    const { profile } = useSelector((state: RootState) => state.auth);
    const dispatch = useAppDispatch();
    const [loader, setLoader] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        profileImage: null as File | null,
        newPassword: "",
        confirmPassword: "",
    });

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

        setLoader(true)

        const data = new FormData();
        data.append("fullName", formData.fullName);
        if (formData.newPassword) {
            data.append("password", formData.newPassword);
        }
        if (formData.profileImage) {
            data.append("profileImage", formData.profileImage);
        }

        dispatch(updateUser({ userId: profile?.id, formData: data })).unwrap()
            .then(() => {
                dispatch(getUserById(profile?.id));
                setLoader(false)

                toast.success("Profile updated successfully");
            })
            .catch((error) => {
                setLoader(false)
                console.error("Failed to update profile:", error);
                toast.error("Failed to update profile");
            });
    };

    const handleLogout = () => {
        console.log("Logging out...");
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-[#fef9f4] border border-[#d4af37] rounded-2xl shadow-lg">
            <h2 className="text-3xl font-serif text-[#5d4037] mb-6">Update Profile</h2>

            <div className="mb-4">
                <Label className="text-[#5d4037] mb-1">Full Name</Label>
                <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="bg-[#f9f4ec] border border-[#d4af37] rounded focus:ring-2 focus:ring-[#d4af37]"
                />
            </div>

            <div className="mb-4">
                <Label className="text-[#5d4037] mb-1">Email</Label>
                <Input
                    value={formData.email}
                    disabled
                    className="bg-[#f9f4ec] border border-[#d4af37] text-gray-500 cursor-not-allowed"
                />
            </div>

            <div className="mb-4">
                <Label className="text-[#5d4037] mb-1">Profile Picture</Label>
                <Input
                    type="file"
                    accept="image/*"
                    name="profileImage"
                    onChange={handleChange}
                    className="border-none bg-transparent p-0 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#d4af37] file:text-[#5d4037] file:font-semibold hover:file:bg-[#c8a230]"
                />
                {formData.profileImage && (
                    <p className="text-sm text-[#5d4037] mt-1">Selected: {formData.profileImage.name}</p>
                )}
            </div>

            <div className="mb-4">
                <Label className="text-[#5d4037] mb-1">New Password</Label>
                <Input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="bg-[#f9f4ec] border border-[#d4af37] rounded focus:ring-2 focus:ring-[#d4af37]"
                />
            </div>

            <div className="mb-6">
                <Label className="text-[#5d4037] mb-1">Confirm Password</Label>
                <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-[#f9f4ec] border border-[#d4af37] rounded focus:ring-2 focus:ring-[#d4af37]"
                />
            </div>

            <Button
                onClick={handleUpdate}
                className="w-full bg-[#5d4037] hover:bg-[#7b5c52] text-white font-semibold mb-3 rounded shadow"
            >
               {` Update Profile ${loader ? "..." : ""}`}
            </Button>

            <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border border-red-600 text-red-600 hover:bg-red-50 rounded"
            >
                Logout
            </Button>
        </div>
    );
};

export default ProfilePage;
