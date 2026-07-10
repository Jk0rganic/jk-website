"use client";
import { type ReactNode, useEffect } from "react";

interface ClassChildProps {
  children: ReactNode;
}
export default function LokomitiveScroll({ children }: ClassChildProps) {
  useEffect(() => {
    const initLocomotiveScroll = async () => {
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      const locomotiveScroll = new LocomotiveScroll();

      return () => {
        locomotiveScroll.destroy();
      };
    };

    initLocomotiveScroll();
  }, []);

  return <div>{children}</div>;
}
