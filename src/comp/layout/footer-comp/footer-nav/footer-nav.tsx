import Link from "next/link";
import {
  SharedEmail,
  SharedPhone,
} from "@/comp/shared-components/shared-components";
import SocialMediaLinks from "@/comp/shared-components/social-media-links/social-media-links";
import k from "./styles.module.scss";

type FooterItem =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string }
  | { type: "component"; node: React.ReactNode };

interface FooterSection {
  title: string;
  className?: string;
  content: FooterItem[];
}

const footerData: FooterSection[] = [
  {
    title: "JK Organics",
    content: [{ type: "text", value: "Where Beauty Meets Wellness" }],
  },
  {
    title: "Links",
    className: k.web_links,
    content: [
      { type: "link", label: "About", href: "/about" },
      { type: "link", label: "Shop", href: "/products/all" },
      { type: "link", label: "Blogs", href: "/blogs" },
      { type: "link", label: "Contact", href: "/contact" },
      { type: "link", label: "FAQs", href: "/privacy/FAQs" },
    ],
  },
  {
    title: "Contact Information",
    content: [
      { type: "component", node: <SharedEmail /> },
      { type: "component", node: <SharedPhone /> },
      {
        type: "text",
        value: "STANBANK House, Moi Avenue, next to ARCHIVES 6th fl, shop b613",
      },
    ],
  },
  {
    title: "Social Media",
    content: [{ type: "component", node: <SocialMediaLinks /> }],
  },
];

const renderItem = (item: FooterItem, j: number) => {
  if (item.type === "text") return <li key={j}>{item.value}</li>;
  if (item.type === "link")
    return (
      <li key={j}>
        <Link href={item.href}>{item.label}</Link>
      </li>
    );
  if (item.type === "component") return <li key={j}>{item.node}</li>;
};

export default function FooterNav() {
  return (
    <div className={k.footer_nav}>
      {footerData.map((section, i) => (
        <div key={i} className={`${k.card} ${section.className ?? ""}`}>
          <h6>{section.title}</h6>
          <ul>{section.content.map(renderItem)}</ul>
        </div>
      ))}
    </div>
  );
}
