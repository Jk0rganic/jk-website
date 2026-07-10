"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import k from "./styles.module.scss";

export default function FloatWhatsapp() {
  const [visible, setVisible] = useState(false);
  const WhatsappNumber = "+254795782207"; // Replace with your number

  useEffect(() => {
    // Show after 4 seconds
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer); // cleanup
  }, []);

  if (!visible) return null; // hide before 4 seconds

  return (
    <div className={k.float_whatapp} aria-live="polite">
      <Link
        href={`https://wa.me/${WhatsappNumber.replace("+", "")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <Image
          src="https://res.cloudinary.com/dj200tags/images/v1768587035/social-media_15789331/social-media_15789331.webp"
          alt="WhatsApp"
          width={50}
          height={50}
        />
      </Link>
    </div>
  );
}
