import { Check } from "lucide-react";
import k from "./styles.module.scss";

const stepLabels = ["Contact", "Address", "Payment"];
const stepTitles = {
  1: "Contact & delivery",
  2: "Delivery address",
  3: "Payment & review",
} as const;

interface CheckoutProgressProps {
  currentStep?: 1 | 2 | 3;
  stepTwoTitle?: string;
}

export default function CheckoutProgress({
  currentStep = 1,
  stepTwoTitle,
}: CheckoutProgressProps) {
  const title =
    currentStep === 2 && stepTwoTitle
      ? stepTwoTitle
      : stepTitles[currentStep] || stepTitles[1];
  const progress = `${(currentStep / 3) * 100}%`;

  return (
    <nav className={k.progress} aria-label="Checkout progress">
      <div className={k.progress_header}>
        <span>Step {currentStep} of 3</span>
        <strong>{title}</strong>
      </div>

      <div className={k.track} aria-hidden="true">
        <span style={{ width: progress }} />
      </div>

      <ol className={k.milestones}>
        {stepLabels.map((label, index) => {
          const stepNumber = (index + 1) as 1 | 2 | 3;
          const isDone = stepNumber < currentStep;
          const isActive = stepNumber <= currentStep;

          return (
            <li className={isActive ? k.active : undefined} key={label}>
              {isDone ? <Check size={11} /> : null}
              {label}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
