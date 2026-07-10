"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import FloatWhatapp from "../float-whatapp/float-whatapp";
import LokomitiveScroll from "../lokomitiveScroll";
import SpotlightPopup from "../spotlight-popup/spotlight-popup";
import Footer from "./footer-comp/footer";
import Navbar from "./navbar-comp/navbar";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin-account");
  const isAdminAuth = pathname.startsWith("/auth/admin");

  if (isAdminRoute || isAdminAuth) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <LokomitiveScroll>{children}</LokomitiveScroll>
      <Footer />
      <Toaster position="top-right" richColors />
      <FloatWhatapp />
      <SpotlightPopup />
    </>
  );
}
