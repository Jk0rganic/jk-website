import k from "./styles.module.scss";
import Section from "../section/section";
import ImgBox from "../imgbox/ImgBox";
import Button from "../button/button";

export default function Four() {
  return (
    <Section className={k.four}>
      <ImgBox
        imageSrc="https://res.cloudinary.com/dj200tags/images/v1767936626/ChatGPT-Image-Jan-8-2026-05_13_50-PM-1_11zon/ChatGPT-Image-Jan-8-2026-05_13_50-PM-1_11zon.webp"
        alt="Healthy lifestyle transformation journey"
        priority
        className={k.img_box}
      />

      <div className={k.content}>
        <h3>Trust the Process</h3>
        <p>
          Real results take time, consistency, and the right products. At JK
          Organics, we believe in natural transformation — supporting your body
          with carefully formulated solutions that work with you, not against
          you. Stay committed, stay patient, and let the process deliver results
          you can trust.
        </p>
        <Button name="Start Your Journey" href="/products/all" />
      </div>
    </Section>
  );
}
