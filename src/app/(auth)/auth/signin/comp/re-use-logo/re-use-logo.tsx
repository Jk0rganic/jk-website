import { BRAND_LOGO_URL } from "@/lib/brand";
import ImgBox from "@/comp/imgbox/ImgBox";

export default function ReUseLogo({ className = "" }) {
  return (
    <ImgBox
      className={className}
      imageSrc={BRAND_LOGO_URL}
      alt="JK Organics logo"
    />
  );
}
