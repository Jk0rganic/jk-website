import k from "./styles.module.scss";
import Section from "../section/section";
import Button from "../button/button";
import Article from "../article/Article";

export default function HeroHome() {
  return (
    <Section className={k.hero}>
      <Article className={k.content}>
        <h1>JK Organics – Pure, Natural, and Sustainable Products </h1>
        <p>
          At JK Organics, we provide high-quality organic products that promote
          health, wellness, and sustainability. Our carefully sourced natural
          offerings help families and communities enjoy the benefits of clean,
          chemical-free living.
        </p>
        <Button
          href="/products/all"
          className={k.shopNowButton}
          name="Shop Now"
        />
      </Article>
    </Section>
  );
}
