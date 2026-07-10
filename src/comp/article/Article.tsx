import type React from "react";

export default function Article({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <article className={className}>{children}</article>;
}
