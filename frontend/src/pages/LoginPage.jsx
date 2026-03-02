import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginModal from "../components/LoginModal";

export default function LoginPage({ lang }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpen(true); // auto open modal on page load
  }, []);

  // لو جاي من redirect (مثل RequireAuth)
  const from = location.state?.from?.pathname || "/dashboard";

  return (
    <LoginModal
      isOpen={open}
      onClose={() => {
        setOpen(false);
        navigate("/", { replace: true });
      }}
      onLoginSuccess={() => {
        setOpen(false);
        navigate(from, { replace: true });
      }}
      lang={lang}
    />
  );
}
