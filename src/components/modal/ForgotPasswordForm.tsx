import useAppDispatch from "@/hook/useDispatch";
import { forgotPassword } from "@/redux/action/auth";
import React, { useState } from "react";
import { toast } from "sonner";

interface ForgotPasswordFormProps {
    onBackToSignIn: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToSignIn }) => {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loader,setLoading]=useState(false)
    const dispatch=useAppDispatch()
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true)
        dispatch(forgotPassword({ email }))
            .unwrap()
            .then((_) => {
                setLoading(false)
                setSubmitted(true);
                toast.success("Reset link sent to email");
            })
            .catch((err) => {
                toast.error(err?.message || "Error sending reset link");
                setLoading(false)
            });
      
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            {!submitted ? (
                <>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            placeholder="Enter your email"

                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <button disabled={loader} type="submit" className="auth-submit">{loader?"Sending...":'Send Reset Link'}</button>
                </>
            ) : (
                <>
                    <h3 className="text-[#5d4037]">Check your email ✅</h3>
                    <p className="mt-2 text-[#5d4037]">We've sent you a link to reset your password.</p>
                </>
            )}

            <div className="auth-footer">
                <button  type="button" onClick={onBackToSignIn} className="text-[#5d4037] hover:underline cursor-pointer mt-4">
                    Back to Sign In
                </button>
            </div>
        </form>
    );
};

export default ForgotPasswordForm;
