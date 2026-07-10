import Image from "next/image";
import Link from "next/link";
import k from "./styles.module.scss";

export default function SocialMediaLinks() {
  const WhatsappNumber = "+254795782207";

  const linksData = [
    {
      type: "icon",
      href: "https://www.facebook.com/share/1ANz5Y2vfv",
      icon: "https://res.cloudinary.com/dj200tags/images/v1767879628/facebook-svgrepo-com/facebook-svgrepo-com.svg",
      label: "Facebook",
    },
    {
      type: "icon",
      href: "https://www.instagram.com/jkorganic_s",
      icon: "https://res.cloudinary.com/dj200tags/images/v1767879773/instagram-svgrepo-com/instagram-svgrepo-com.svg",
      label: "Instagram",
    },

    {
      type: "icon",
      href: "https://www.tiktok.com/@jkorganics",
      icon: "https://res.cloudinary.com/dj200tags/images/v1767879842/tiktok-svgrepo-com/tiktok-svgrepo-com.svg",
      label: "TikTok",
    },
    {
      type: "icon",
      href: `https://wa.me/${WhatsappNumber.replace("+", "")}`,
      icon: "https://res.cloudinary.com/dj200tags/images/v1768599698/icons8-whatsapp-50/icons8-whatsapp-50.png",
      label: "WhatsApp",
    },
  ];
  return (
    <div className={k.social_media_links}>
      {linksData.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src={link.icon} width={20} height={20} alt={link.label} />
        </Link>
      ))}
    </div>
  );
}
