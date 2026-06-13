import FooterNav from "./footer-nav/footer-nav";
import PrivacyCop from "./privacy/privacy-cop";
import k from "./styles.module.scss";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className={k.footer}>
      <div className="container">
        <FooterNav />
        <PrivacyCop />
        <div className={k.rights}>
          <p>© {currentYear} jk organics . All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
