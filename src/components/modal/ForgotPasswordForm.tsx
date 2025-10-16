import useAppDispatch from "@/hook/useDispatch";
import { forgotPassword } from "@/redux/action/auth";
import React, { useState } from "react";
import { toast } from "sonner";

interface ForgotPasswordFormProps {
    onBackToSignIn: () => void;
    submitted: boolean;
    setSubmitted: (value: boolean) => void;
    setActiveTab: (tab: 'sign-in' | 'sign-up' | 'forget-password') => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToSignIn, submitted, setSubmitted, setActiveTab }) => {
    const [email, setEmail] = useState("");
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
        <form className="" onSubmit={handleSubmit}>
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
                            <h2 className="text-xl text-center font-bold">Check your email ✅ </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                We’ve sent you a link to reset your password. Please check your inbox and follow the instructions.
                            </p>
                        </>
            )}

            <div className="auth-footer">
                <button type="button" onClick={() => { onBackToSignIn(); setSubmitted(false); setActiveTab(`sign-in`) }} className="text-[#5d4037] hover:underline cursor-pointer">
                    Back to Sign In
                </button>
            </div>
        </form>
    );
};

export default ForgotPasswordForm;
