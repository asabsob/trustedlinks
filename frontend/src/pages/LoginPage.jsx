import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginModal from "../components/LoginModal";

export default function LoginPage({ lang }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpen(true);
  }, []);

  const from = location.state?.from?.pathname || "/dashboard";

  return (
    <LoginModal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        navigate("/", { replace: true });
      }}
      onLoginSuccess={(token, userData) => {
        if (token) {
          localStorage.setItem("trustedlinks_token", token);
        }

        if (userData?.email) {
          localStorage.setItem("trustedlinks_user_email", userData.email);
        }

        setOpen(false);
        navigate(from, { replace: true });
      }}
      lang={lang}
    />
  );
}
