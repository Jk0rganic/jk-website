import React from "react";
import SharedHero from "@/comp/hero-comp/hero-comp";

export default function Hero() {
  const backgroundImage =
    "https://res.cloudinary.com/dj200tags/images/w_1709,h_2560,c_scale/v1763445464/mandy-liz-6DPflZmWpnA-unsplash_46_11zon/mandy-liz-6DPflZmWpnA-unsplash_46_11zon.webp";

  return <SharedHero backgroundImage={backgroundImage} />;
}
