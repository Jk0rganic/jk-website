import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import k from "./input.module.scss";
import { ErrorMessage } from "../formInput/formInput";
import { ComponentPropsWithoutRef } from "react";

interface Props<T extends FieldValues>
  extends ComponentPropsWithoutRef<"input"> {
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors;
  label?: string;
}

export const FormInputWithLabel = <T extends FieldValues>({
  type = "text",
  name,
  register,
  errors,
  label,
  ...rest
}: Props<T>) => (
  <div className={k.input_wrapper}>
    {label && (
      <label htmlFor={name} className={k.input_label}>
        {label}
      </label>
    )}
    <input
      id={name}
      type={type}
      className={`${k.input} ${errors[name] ? k.input_error : ""}`}
      {...register(name)}
      {...rest}
    />
    <ErrorMessage name={name} errors={errors} />
  </div>
);
