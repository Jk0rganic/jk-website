import Button from "../button/button";
import Section from "../section/section";
import k from "./styles.module.scss";

export default function Five() {
  return (
    <Section className={k.five}>
      <h2>Real Beauty Begins with Real Ingredients</h2>
      <Button name="Shop Organic Products" href="/products/all" />
    </Section>
  );
}
