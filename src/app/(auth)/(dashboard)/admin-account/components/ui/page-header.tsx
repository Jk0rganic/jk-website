import Link from "next/link";
import ui from "../ui/admin-ui.module.scss";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className={ui.pageHeader}>
      <div>
        <h2 className={ui.pageTitle}>{title}</h2>
        {subtitle && <p className={ui.pageSubtitle}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={ui.card}>
      <div className={ui.cardHeader}>
        <h2>{title}</h2>
        {action}
      </div>
      <div className={ui.cardBody}>{children}</div>
    </section>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={ui.backLink}>
      ← {label}
    </Link>
  );
}
