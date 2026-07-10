import ImgBox from "@/comp/imgbox/ImgBox";
import { BRAND_LOGO_URL } from "@/lib/brand";

export default function ReUseLogo({ className = "" }) {
  return (
    <ImgBox
      className={className}
      imageSrc={BRAND_LOGO_URL}
      alt="JK Organics logo"
    />
  );
}
