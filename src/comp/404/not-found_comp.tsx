import Link from "next/link";
import Section from "../section/section";
import k from "./styles.module.scss";

export default function NotFoundComp() {
  return (
    <Section className={k.not_found}>
      <h1>Not Found</h1>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </Section>
  );
}
