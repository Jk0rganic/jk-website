import k from "./styles.module.scss";
import Section from "../section/section";
import Button from "../button/button";

export default function Five() {
  return (
    <Section className={k.five}>
      <h2>Real Beauty Begins with Real Ingredients</h2>
      <Button name="Shop Organic Products" href="/products/all" />
    </Section>
  );
}
