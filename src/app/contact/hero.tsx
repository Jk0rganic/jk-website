import React from "react";
import SharedHero from "@/comp/hero-comp/hero-comp";

export default function Hero() {
  const backgroundImage =
    "https://res.cloudinary.com/dj200tags/images/v1763445408/natallia-photo-ZSZIa5U0xBk-unsplash_4_11zon/natallia-photo-ZSZIa5U0xBk-unsplash_4_11zon.webp";

  return <SharedHero backgroundImage={backgroundImage} />;
}
