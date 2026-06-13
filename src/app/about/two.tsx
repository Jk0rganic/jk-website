import ImgBox from "@/comp/imgbox/ImgBox";
import Section from "@/comp/section/section";
import k from "./styles.module.scss";

export default function Two() {
  const aboutData = [
    {
      title: "About Us",
      content:
        "At JK Organics, we create natural, plant-powered products designed to support healthy skincare and effective weight management. Every formula is crafted with care, passion, and pure ingredients—helping you glow with confidence from the inside out. We proudly stand for real ingredients, real results, and real transformation.",
    },
    {
      title: "Our Mission",
      content:
        "To inspire confidence by offering gentle, effective products that nourish the skin, support overall wellness, and empower you to embrace your natural beauty with pride.",
    },
    {
      title: "Our Vision",
      content:
        "To become a leading beauty and wellness brand that transforms lives by making pure, effective skincare and weight-loss solutions accessible to everyone.",
    },
  ];

  return (
    <Section className={k.two}>
      <ImgBox
        className={k.img_box}
        imageSrc="https://res.cloudinary.com/dj200tags/images/w_1707,h_2560,c_scale/v1765566112/daniel-7b6TE7yBDyc-unsplash_27_11zon_143692a3/daniel-7b6TE7yBDyc-unsplash_27_11zon_143692a3.webp"
        alt="hero image of jk organics"
      />
      <div className={k.content}>
        {aboutData.map((section, index) => (
          <div key={index} className={k.articles}>
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
