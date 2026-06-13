import SharedHero from "@/comp/hero-comp/hero-comp";

export default async function Hero() {
  const backgroundImage =
    "https://res.cloudinary.com/dj200tags/images/v1763445489/lina-verovaya-3LMdmlBe3RE-unsplash_43_11zon/lina-verovaya-3LMdmlBe3RE-unsplash_43_11zon.webp";

  return <SharedHero backgroundImage={backgroundImage} />;
}
