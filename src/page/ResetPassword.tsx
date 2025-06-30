import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "@/redux/action/auth";
import { toast } from "sonner";
import useAppDispatch from "@/hook/useDispatch";

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState("");
    const [loader,setLoader]=useState(false)
    const [confirmPassword, setConfirmPassword] = useState("");
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoader(true)
        if (!password || !confirmPassword) {
            toast.error("Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await dispatch(resetPassword({ token: token as string, password })).unwrap();
            toast.success("Password reset successfully. You can now sign in.");
            navigate("/"); // or "/login"
            setLoader(true)

        } catch (err: any) {
            setLoader(false)
            toast.error(err?.message || "Failed to reset password");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen  px-4">
            <div className="max-w-md w-full rounded-lg p-6 ">
                <h2 className="text-2xl font-bold text-[#5d4037] mb-4 text-center">Reset Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label className="block text-[#5d4037] font-semibold mb-1">New Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-[#d4af37] rounded focus:outline-none focus:border-[#5d4037]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label className="block text-[#5d4037] font-semibold mb-1">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-[#d4af37] rounded focus:outline-none focus:border-[#5d4037]"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full h-12 cursor-pointer bg-[#d4af37] text-[#5d4037] font-semibold hover:bg-transparent hover:border hover:border-[#d4af37] hover:text-[#d4af37] transition-all"
                    
                        disabled={loader}
                        >
                        {loader?"Reseting...":' Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
