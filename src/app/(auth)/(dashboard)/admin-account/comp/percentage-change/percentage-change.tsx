import { ArrowUp, ArrowDown } from "lucide-react";
import k from "./styles.module.scss";

export default function PercentageChange({
  current = 0,
  previous = 0,
  suffix = "%",
  precision = 1,
  label = "from last year",
}) {
  let percentage = 0;

  if (previous === 0 && current > 0) {
    percentage = 100;
  } else if (previous > 0) {
    percentage = ((current - previous) / previous) * 100;
  }

  const isUp = percentage >= 0;

  return (
    <div className={k.percentage_change}>
      <p className={isUp ? k.up : k.down}>
        {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {Math.abs(percentage).toFixed(precision)}
        {suffix} {isUp ? "up" : "down"} {label}
      </p>
    </div>
  );
}
