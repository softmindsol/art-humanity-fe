import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

const ProfilePage = () => {
    const { profile } = useSelector((state: RootState) => state.auth);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // ⭐ Fill fields when profile data is available
    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName || "");
            setEmail(profile.email || "");
        }
    }, [profile]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfileImage(e.target.files[0]);
        }
    };

    const handleUpdate = () => {
        // Submit logic here
        console.log("Updating profile...");
    };

    const handleLogout = () => {
        // Logout logic here
    };

    return (
        <div className="max-w-lg mx-auto p-8 mt-12 bg-[#fef9f4] border border-[#d4af37] rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-[#5d4037] mb-6">Update Profile</h2>

            <div className="mb-4">
                <Label className="text-[#5d4037]">Full Name</Label>
                <Input
                    value={fullName}
                    onChange={(e:any) => setFullName(e.target.value)}
                    className="border-[#d4af37] focus:ring-[#d4af37]"
                />
            </div>

            <div className="mb-4">
                <Label className="text-[#5d4037]">Email</Label>
                <Input
                    value={email}
                    disabled
                    className="border-[#d4af37] bg-[#f9f4ec] text-gray-500 cursor-not-allowed"
                />
            </div>

            <div className="mb-4">
                <Label className="text-[#5d4037]">Profile Picture</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="border-none bg-transparent p-0"
                />
                {profileImage && (
                    <p className="text-sm text-[#5d4037] mt-1">Selected: {profileImage.name}</p>
                )}
            </div>

            <div className="mb-4">
                <Label className="text-[#5d4037]">New Password</Label>
                <Input
                    type="password"
                    value={newPassword}
                    onChange={(e: any) => setNewPassword(e.target.value)}
                    className="border-[#d4af37] focus:ring-[#d4af37]"
                />
            </div>

            <div className="mb-6">
                <Label className="text-[#5d4037]">Confirm Password</Label>
                <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                    className="border-[#d4af37] focus:ring-[#d4af37]"
                />
            </div>

            <Button
                onClick={handleUpdate}
                className="w-full bg-[#5d4037] hover:bg-[#7b5c52] text-white font-semibold mb-3"
            >
                Update Profile
            </Button>

            <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-50"
            >
                Logout
            </Button>
        </div>
    );
};

export default ProfilePage;
