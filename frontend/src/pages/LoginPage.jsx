import { useEffect, useState } from "react";
import LoginModal from "../components/LoginModal";

export default function LoginPage({ lang }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true); // auto open modal on page load
  }, []);

  return (
    <LoginModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onLoginSuccess={() => setOpen(false)}
      lang={lang}
    />
  );
}
