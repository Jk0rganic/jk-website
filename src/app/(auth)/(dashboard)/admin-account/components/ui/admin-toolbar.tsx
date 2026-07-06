import { Search } from "lucide-react";
import type { ChangeEventHandler, ReactNode } from "react";
import ui from "./admin-ui.module.scss";

type AdminToolbarProps = {
  searchLabel?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: ChangeEventHandler<HTMLInputElement>;
  actions?: ReactNode;
  children?: ReactNode;
};

export function AdminToolbar({
  searchLabel = "Search",
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  actions,
  children,
}: AdminToolbarProps) {
  return (
    <div className={ui.adminToolbar}>
      <label className={ui.toolbarSearch}>
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
        />
      </label>
      {(children || actions) && (
        <div className={ui.toolbarActions}>
          {children}
          {actions}
        </div>
      )}
    </div>
  );
}
