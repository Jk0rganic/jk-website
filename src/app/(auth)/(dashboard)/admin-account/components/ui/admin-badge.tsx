import type { ReactNode } from "react";
import ui from "./admin-ui.module.scss";

type AdminBadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

type AdminBadgeProps = {
  tone?: AdminBadgeTone;
  children: ReactNode;
};

const toneClass: Record<AdminBadgeTone, string> = {
  success: ui.badgeSuccess,
  info: ui.badgeInfo,
  warning: ui.badgeWarning,
  danger: ui.badgeDanger,
  neutral: ui.badgeNeutral,
};

export function AdminBadge({ tone = "neutral", children }: AdminBadgeProps) {
  return <span className={toneClass[tone]}>{children}</span>;
}
