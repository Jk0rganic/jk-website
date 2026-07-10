import type { ReactNode } from "react";
import ui from "./admin-ui.module.scss";

type AdminPanelProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function AdminPanel({
  title,
  description,
  action,
  footer,
  children,
}: AdminPanelProps) {
  const hasHeader = title || description || action;

  return (
    <section className={ui.panel}>
      {hasHeader && (
        <div className={ui.panelHeader}>
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={ui.panelBody}>{children}</div>
      {footer && <div className={ui.panelFooter}>{footer}</div>}
    </section>
  );
}
