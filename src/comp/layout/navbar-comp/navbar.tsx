"use client";

import { useState } from "react";
import { BRAND_LOGO_URL } from "@/lib/brand";
import k from "./styles.module.scss";
import Image from "next/image";
import Link from "next/link";
import ShoppingCartComp from "./comp/shopping-cart-comp/shopping-cart-comp";
import AccountUser from "./comp/account-user/account-user";
import NavItems from "./comp/navitems/navitems";

export default function Navbar() {
  const [clicked, setClicked] = useState(false);

  const handleClicked = () => {
    setClicked((prev) => !prev);
  };

  return (
    <nav className={`${k.navbar} ${k.sticky}`}>
      <div className="container">
        <Link href="/" className={k.logo} aria-label="Digital Metadata Logo">
          <Image
            className={k.img}
            src={BRAND_LOGO_URL}
            alt="jk organics Logo"
            width={100}
            height={100}
            priority={false} // Explicitly disable if not critical
            loading="eager"
          />
        </Link>
        <div className={k.wrapper}>
          <NavItems handleClicked={handleClicked} clicked={clicked} />
          <AccountUser />
          <ShoppingCartComp />
        </div>
      </div>
    </nav>
  );
}
