import React from "react";
import ImgBox from "@/comp/imgbox/ImgBox";

export default function ReUseLogo({ className = "" }) {
  return (
    <ImgBox
      className={className}
      imageSrc="https://res.cloudinary.com/dj200tags/images/w_2560,h_1077,c_scale/v1768223605/JK-new-tag-line-Logo-1-1-3/JK-new-tag-line-Logo-1-1-3.webp"
      alt="JK Organics logo"
    />
  );
}
