import { Menu, X } from "lucide-react";
import { NavLink } from "../navlink/navlinks";
import { MenuData } from "./comp/menudata";
import k from "./styles.module.scss";

interface NavItemsProps {
  handleClicked: () => void;
  clicked: boolean;
}

export default function NavItems({ handleClicked, clicked }: NavItemsProps) {
  return (
    <div className={k.nav_items_wrapper}>
      <button type="button" className={k.toggle} onClick={handleClicked}>
        {clicked ? <X size={25} /> : <Menu size={25} />}
      </button>

      <ul className={`${k.navItem} ${clicked ? "active" : ""}`}>
        {MenuData.map((item, index) => (
          <NavLink handleClicked={handleClicked} key={index} item={item} />
        ))}
      </ul>
    </div>
  );
}
