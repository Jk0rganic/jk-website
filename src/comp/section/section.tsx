export default function Section({
  children,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.ComponentPropsWithoutRef<"section">) {
  return (
    <section className={`section ${className}`} {...rest}>
      <div className="container">{children}</div>
    </section>
  );
}