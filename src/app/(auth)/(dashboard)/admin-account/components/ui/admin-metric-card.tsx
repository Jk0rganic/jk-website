import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import ui from "./admin-ui.module.scss";

type AdminMetricCardProps = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "success" | "info" | "warning" | "danger";
  detail?: ReactNode;
  meta?: ReactNode;
};

const toneClass = {
  neutral: ui.metricIconNeutral,
  success: ui.metricIconSuccess,
  info: ui.metricIconInfo,
  warning: ui.metricIconWarning,
  danger: ui.metricIconDanger,
};

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  detail,
  meta,
}: AdminMetricCardProps) {
  const displayDetail = detail ?? meta;

  return (
    <article className={ui.metricCard}>
      <div className={ui.metricHeader}>
        <div>
          <p className={ui.metricLabel}>{label}</p>
          <p className={ui.metricValue}>{value}</p>
        </div>
        {Icon && (
          <span
            className={`${ui.metricIcon} ${toneClass[tone]}`}
            aria-hidden="true"
          >
            <Icon size={20} strokeWidth={2} />
          </span>
        )}
      </div>
      {displayDetail && <p className={ui.metricMeta}>{displayDetail}</p>}
    </article>
  );
}
