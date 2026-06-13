import Layout from "@/comp/layout/layout";
import "@/scss/globals.scss";
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <Layout>{children}</Layout>;
}
