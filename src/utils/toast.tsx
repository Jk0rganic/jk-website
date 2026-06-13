import React from "react";
import { Toaster } from "sonner";
export const Toast = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
};
