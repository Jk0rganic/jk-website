import ImgBox from "../imgbox/ImgBox";
import Section from "../section/section";
import k from "./styles.module.scss";

export default function Six() {
  const cardData = [
    {
      name: "organic products",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768511245/369808326_175028242272102_6410301588193802621_n-1-1-1/369808326_175028242272102_6410301588193802621_n-1-1-1.webp",
      link: "/products/face-care",
    },
    {
      name: "certified",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768511241/369808326_175028242272102_6410301588193802621_n-1-2-1/369808326_175028242272102_6410301588193802621_n-1-2-1.webp",
      link: "/products/body-care",
    },
    {
      name: "results guaranteed",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768511249/369808326_175028242272102_6410301588193802621_n-1-3-1/369808326_175028242272102_6410301588193802621_n-1-3-1.webp",
      link: "/products/hair-care",
    },
    {
      name: "quick delivery",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768511253/369808326_175028242272102_6410301588193802621_n-1-4-1/369808326_175028242272102_6410301588193802621_n-1-4-1.webp",
      link: "/products/skin-care",
    },
  ];
  return (
    <Section className={k.six_sec}>
      {cardData.map((category, index) => (
        <div className={k.card} key={index}>
          <ImgBox
            key={index}
            className={k.img_box}
            imageSrc={category.image}
            alt={category.name}
          />
          <h2>{category.name}</h2>
        </div>
      ))}
    </Section>
  );
}
