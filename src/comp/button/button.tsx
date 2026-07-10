import Link from "next/link";
import k from "./styles.module.scss";

type ButtonProps = {
  name?: string;
  href?: string;
  className?: string;
};
export default function Button({
  name = "Click Here",
  href = "#",
  className = "",
}: ButtonProps) {
  return (
    <Link href={href || "#"} className={className || k.btn} aria-label={name}>
      {name || "Click Here"}
    </Link>
  );
}
