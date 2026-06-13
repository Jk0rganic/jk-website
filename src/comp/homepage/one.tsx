import k from "./styles.module.scss";
import Section from "../section/section";
import ImgBox from "../imgbox/ImgBox";
import Link from "next/link";

export default function Categories() {
  const categories = [
    {
      name: "Face Care",
      image:
        "https://res.cloudinary.com/dj200tags/images/w_1707,h_2560,c_scale/v1768509216/kimia-kazemi-Xxs9WvkUPLo-unsplash_11zon/kimia-kazemi-Xxs9WvkUPLo-unsplash_11zon.webp",
      link: "/products/face-care",
    },
    {
      name: "Body Care",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768509551/5034_11zon/5034_11zon.webp",
      link: "/products/body-care",
    },
    {
      name: "Hair Care",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768509208/lindsay-cash-Md_DhaFsnCQ-unsplash_11zon/lindsay-cash-Md_DhaFsnCQ-unsplash_11zon.webp",
      link: "/products/hair-care",
    },
    {
      name: "skin care",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768508598/gideon-hezekiah-WCEMFqEIVek-unsplash_11zon/gideon-hezekiah-WCEMFqEIVek-unsplash_11zon.webp",
      link: "/products/skin-care",
    },
  ];
  return (
    <Section className={k.one}>
      <div className={k.explore}>
        <h2>Explore Collections</h2>
        <Link href="/products/all">View All Collection</Link>
      </div>
      <div className={k.card_wrapper}>
        {categories.map((category, index) => (
          <Link
            href={category.link}
            key={index}
            className={k.card}
            aria-label={category.name}
          >
            <ImgBox
              className={k.img_box}
              imageSrc={category.image}
              alt={category.name}
            />
            <h3>{category.name}</h3>
          </Link>
        ))}
      </div>
    </Section>
  );
}
