import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAppDispatch from "@/hook/useDispatch";
import { verifyEmail } from "@/redux/action/auth";

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const navigate = useNavigate();
    const dispatch = useAppDispatch()
    useEffect(() => {
        dispatch(verifyEmail({ token })).unwrap()
            .then((res) => {
                setStatus(res.success);
                // Optional: delay before redirecting
                setTimeout(() => navigate("/"), 2000);
            })
            .catch(err => setStatus(err.success))
    }, [token]);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen  px-4 text-center">
            {status === "loading" && (
                <>
                    <h2 className="text-2xl font-bold text-[#5d4037]">Verifying your email...</h2>
                    <p className="mt-2 text-[#5d4037]">Please wait a moment.</p>
                </>
            )}
            {status === "success" && (
                <>
                    <h2 className="text-2xl font-bold text-[#5d4037]">Email Verified! ✅</h2>
                    <p className="mt-2 text-[#5d4037]">You can now sign in and start contributing.</p>
                </>
            )}
            {status === "error" && (
                <>
                    <h2 className="text-2xl font-bold text-[#5d4037]">Verification Failed ❌</h2>
                    <p className="mt-2 text-[#5d4037]">Your link may have expired or is invalid.</p>
                </>
            )}
        </div>
    );
};

export default VerifyEmail;
