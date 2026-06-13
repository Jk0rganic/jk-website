import type { ReactNode } from "react";

export interface ClassChildProps {
  className?: string;
  innerClassName?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

export interface SinglePagePropsType {
  params: Promise<{
    slug: string;
  }>;
}
