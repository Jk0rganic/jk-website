"use client";

import { usePathname } from "next/navigation";
import Section from "../section/section";
import styles from "./styles.module.scss";

interface Props {
  backgroundImage?: string;
}

const formatSegment = (seg: string) =>
  seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export default function SharedHero({ backgroundImage }: Props) {
  const pathname = usePathname();

  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const breadcrumbs = ["Home", ...segments.map(formatSegment)];
  const routeName = breadcrumbs.at(-1);

  return (
    <Section
      className={styles.hero_c}
      style={
        backgroundImage
          ? { backgroundImage: `url(${backgroundImage})` }
          : undefined
      }
    >
      <div className={styles.content}>
        <h1>{routeName}</h1>
        <p className={styles.breadcrumb}>{breadcrumbs.join(" ›› ")}</p>
      </div>
    </Section>
  );
}
