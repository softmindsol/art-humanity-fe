import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { changePassword } from "@/redux/action/auth";
import useAppDispatch from "@/hook/useDispatch";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_PASSWORD_LEN = 6;

const PasswordSection = () => {
  const { profile } = useSelector((state: RootState) => state?.auth);
  const dispatch = useAppDispatch();

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoader, setPasswordLoader] = useState(false);

  // Visibility Toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordUpdate = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LEN) {
      toast.error(
        `New password must be at least ${MIN_PASSWORD_LEN} characters.`,
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setPasswordLoader(true);
    const userId = (profile as any)?.id ?? (profile as any)?._id;

    try {
      await dispatch(
        changePassword({
          userId,
          oldPassword,
          newPassword,
        }),
      ).unwrap();

      toast.success("Password changed successfully!");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err || "Failed to change password.");
    } finally {
      setPasswordLoader(false);
    }
  };

  return (
    <div className="bg-[#141414] rounded-2xl p-6 md:p-10 border border-white/5 shadow-2xl lg:mt-8 mt-5">
      <h3 className="text-lg font-semibold !text-white mb-6">Password</h3>

      <div className="grid md:grid-cols-2 lg:gap-6 gap-3.5">
        <div className="space-y-1 md:col-span-2">
          <Label className="lg:text-base text-sm font-semibold !text-white">
            Current Password
          </Label>
          <div className="relative">
            <Input
              type={showOldPassword ? "text" : "password"}
              name="oldPassword"
              value={passwordForm.oldPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              className="bg-[#2E2E2E] border-none text-white h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-[#E23373] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="lg:text-base text-sm font-semibold !text-white">
            New Password
          </Label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              className="bg-[#2E2E2E] border-none text-white h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-[#E23373] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="lg:text-base text-sm font-semibold !text-white">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              className="bg-[#2E2E2E] border-none text-white h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-[#E23373] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handlePasswordUpdate}
          disabled={passwordLoader}
          className="bg-gradient-to-r from-[#E23373] to-[#FEC133] rounded-full px-8 py-2 h-10 text-white font-semibold hover:opacity-90 border-none transition-all"
        >
          {passwordLoader ? (
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default PasswordSection;
