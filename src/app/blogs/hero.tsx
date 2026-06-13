import SharedHero from "@/comp/hero-comp/hero-comp";

export default function Hero() {
  const backgroundImage =
    "https://res.cloudinary.com/dj200tags/images/w_1707,h_2560,c_scale/v1763445342/steven-cordes-wyzSmWL3rI8-unsplash_11_11zon/steven-cordes-wyzSmWL3rI8-unsplash_11_11zon.webp";

  return <SharedHero backgroundImage={backgroundImage} />;
}
