"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import k from "./styles.module.scss";

interface Props {
  handleClicked: () => void;
  item: {
    title: string;
    URL: string;
  };
}

export const NavLink = ({ item, handleClicked }: Props) => {
  const pathname = usePathname();
  const isActive = pathname === item?.URL;

  const linkClass = isActive ? k.active : "";

  return (
    <li className={k.nav_link_wrapper}>
      <div className={k.link_row}>
        <Link
          href={item?.URL || "#"}
          className={linkClass}
          onClick={handleClicked}
          aria-current={isActive ? "page" : undefined}
        >
          {item?.title}
        </Link>
      </div>
    </li>
  );
};
