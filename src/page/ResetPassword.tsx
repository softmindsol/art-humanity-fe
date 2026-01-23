import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "@/redux/action/auth";
import { toast } from "sonner";
import useAppDispatch from "@/hook/useDispatch";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loader, setLoader] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // New state for success screen

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!password || !confirmPassword) {
            toast.error("Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoader(true);

        try {
            await dispatch(resetPassword({ token: token as string, password })).unwrap();
            // Instead of navigating, we set the success state
            setIsSuccess(true); 
        } catch (err: any) {
            toast.error(err?.message || "Failed to reset password");
        } finally {
            setLoader(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-black overflow-y-auto">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:flex-1 relative">
                 {/* Placeholder for the specific image */}
                <img 
                    src={isSuccess ? "/assets/success-bg-flower.png" : "/assets/reset-pass-img.svg"}
                    // Using existing asset if no new one provided, or placeholder logic
                    onError={(e) => {
                        // Fallback if specific success image missing
                         e.currentTarget.src = "/assets/reset-pass-img.svg";
                    }}
                    alt="Reset Password Art" 
                    className="w-[calc(100%-30px)] h-[calc(100vh-60px)] m-6 object-cover rounded-[12px]"
                />
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-[680px] 2xl:w-[800px] flex items-center justify-center px-4 py-8 md:p-12 lg:px-10">
                <div className="w-full max-w-2xl space-y-4 xl:space-y-8">
                    
                    {/* Back Button - Gradient Border */}
                    <div className="w-10 h-10 p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] mb-4 inline-block">
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full h-full rounded-full bg-black flex items-center justify-center text-white hover:bg-zinc-900 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {!isSuccess ? (
                        <>
                            <div className="space-y-2">
                                <h3 className="!text-white text-[20px] lg:text-[26px] font-semibold">Log In</h3>
                                <h1 className="text-[26px] lg:text-[32px] font-semibold !text-white tracking-tight">Create New Password</h1>
                                <p className="text-white font-semibold text-[14px] lg:text-lg">
                                    Don't worry we will reset your password here
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-[14px] lg:text-base font-semibold text-white">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label className="text-[14px] lg:text-base font-semibold text-white">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-[#2E2E2E] border border-gray-800 rounded-[8px] px-4 py-1.5 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all pr-10"
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

                                <Button
                                    type="submit"
                                    disabled={loader}
                                    className="w-full h-12 bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 text-white font-semibold rounded-full text-base border-0 transition-transform active:scale-[0.98]"
                                >
                                    {loader ? 'Resetting...' : 'Continue'}
                                </Button>
                            </form>
                        </>
                    ) : (
                         <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
                             {/* Rocket Icon */}
                             <div className="text-6xl mb-4">
                                🚀
                             </div>
                             
                             <h2 className="text-[20px] lg:text-[24px] font-semibold text-white">
                                Your password has been successfully reset
                             </h2>

                             <Button
                                onClick={() => navigate('/login')}
                                className="w-full max-w-sm h-12 bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 text-white font-semibold rounded-full text-base border-0 transition-transform active:scale-[0.98]"
                            >
                                Back to Login
                            </Button>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
