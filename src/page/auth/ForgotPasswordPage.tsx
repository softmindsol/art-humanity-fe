import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useAppDispatch from "@/hook/useDispatch";
import { forgotPassword } from "@/redux/action/auth";
import { toast } from "sonner";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    dispatch(forgotPassword({ email }))
      .unwrap()
      .then((_) => {
        setLoading(false);
        setSubmitted(true);
        toast.success("Reset link sent to email");
      })
      .catch((err) => {
        toast.error(err?.message || "Error sending reset link");
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen flex !items-center bg-[#0F0D0D] overflow-y-auto">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <div className="" />
        {/* Placeholder for the specific image */}
        <img
          src="/assets/reset-pass-img.svg"
          alt="Collaborative Art"
          className="2xl:w-[calc(100%-150px)] w-[calc(100%-30px)] h-[calc(100vh-60px)] m-auto object-cover rounded-[12px]"
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-[680px] 2xl:w-[800px] flex items-center justify-start px-4 py-8 md:p-12 lg:px-10">
        <div className="w-full max-w-2xl space-y-4 xl:space-y-8">
          {/* Back Button - Gradient Border */}
          <div className="w-10 h-10 p-[1px] absolute top-10 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] mb-4 inline-block">
            <button
              onClick={() => navigate("/login")}
              className="w-full h-full rounded-full bg-black flex items-center justify-center text-white hover:bg-zinc-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {!submitted ? (
            <>
              <div className="space-y-2">
                <h3 className="!text-white text-lg lg:text-xl xl:text-[26px] !font-semibold">
                  Reset Password
                </h3>
                <h1 className="text-xl lg:text-2xl xl:text-[32px] !font-semibold !text-white tracking-tight">
                  Join MurArt
                </h1>
                <p className="max-w-[600px] w-full text-white font-semibold text-sm lg:text-base xl:text-lg">
                  We'll send you an Email verification code to reset the
                  password of your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[14px] lg:text-base font-semibold text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your Email"
                    required
                    className="w-full bg-[#2E2E2E] text-sm border border-gray-800 rounded-[8px] px-4 py-3 text-white placeholder-[#AAB2C7] focus:outline-none focus:ring-1 focus:ring-[#FEC133] transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full lg:h-12 h-11 bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 text-white font-semibold rounded-full text-base border-0 transition-transform active:scale-[0.98]"
                >
                  {loading ? "Sending..." : "Continue"}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold !text-white">
                Check your email
              </h2>
              <p className="text-gray-300">
                We’ve sent you a link to reset your password. Please check your
                inbox and follow the instructions.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-[#2E2E2E] hover:bg-[#252525] border border-gray-800 text-white font-semibold rounded-full text-base transition-colors"
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

export default ForgotPasswordPage;
