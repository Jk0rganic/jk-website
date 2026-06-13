import k from "./styles.module.scss";
import Link from "next/link";

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
