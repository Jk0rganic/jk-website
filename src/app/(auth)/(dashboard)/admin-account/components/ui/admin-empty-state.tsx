import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import ui from "./admin-ui.module.scss";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
};

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className={ui.emptyState}>
      <div className={ui.emptyStateInner}>
        <span className={ui.emptyIcon} aria-hidden="true">
          <Icon size={22} strokeWidth={2} />
        </span>
        <h2 className={ui.emptyTitle}>{title}</h2>
        {description && <p className={ui.emptyDescription}>{description}</p>}
        {action && <div className={ui.emptyAction}>{action}</div>}
      </div>
    </div>
  );
}
