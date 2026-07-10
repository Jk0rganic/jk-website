import Link from "next/link";
import ImgBox from "../imgbox/ImgBox";
import Section from "../section/section";
import k from "./styles.module.scss";

export default function Categories() {
  const categories = [
    {
      name: "Skin Care",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768508598/gideon-hezekiah-WCEMFqEIVek-unsplash_11zon/gideon-hezekiah-WCEMFqEIVek-unsplash_11zon.webp",
      link: "/products/skin-care",
    },
    {
      name: "Hair Care",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768509208/lindsay-cash-Md_DhaFsnCQ-unsplash_11zon/lindsay-cash-Md_DhaFsnCQ-unsplash_11zon.webp",
      link: "/products/hair-care",
    },
    {
      // TODO: swap for a dedicated Wellness photo from the admin media library.
      name: "Wellness",
      image:
        "https://res.cloudinary.com/dj200tags/images/v1768509551/5034_11zon/5034_11zon.webp",
      link: "/products/wellness",
    },
  ];
  return (
    <Section className={k.one}>
      <div className={k.explore}>
        <h2>Explore Collections</h2>
        <Link href="/products/all">View All Collection</Link>
      </div>
      <div className={k.card_wrapper}>
        {categories.map((category) => (
          <Link
            href={category.link}
            key={category.link}
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
