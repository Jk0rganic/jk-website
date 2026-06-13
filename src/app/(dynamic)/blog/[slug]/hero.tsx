import SharedHero from "@/comp/hero-comp/hero-comp";

export default function Hero({ backgroundImage }: { backgroundImage: string }) {
  return <SharedHero backgroundImage={backgroundImage} />;
}
