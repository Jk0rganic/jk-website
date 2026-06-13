import { get } from "react-hook-form";
import type { ComponentPropsWithoutRef } from "react";
import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import k from "./input.module.scss";

interface BaseProps<T extends FieldValues> {
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors;
}

interface InputProps<T extends FieldValues>
  extends BaseProps<T>, Omit<ComponentPropsWithoutRef<"input">, "name"> {}

interface CheckboxProps<T extends FieldValues> extends BaseProps<T> {
  label: string;
}

interface TextareaProps<T extends FieldValues>
  extends BaseProps<T>, Omit<ComponentPropsWithoutRef<"textarea">, "name"> {}

export const ErrorMessage = ({
  name,
  errors,
}: {
  name: string;
  errors: FieldErrors;
}) => {
  const error = get(errors, name);
  return error?.message ? (
    <span className={k.error_field}>{error.message}</span>
  ) : null;
};

export const FormInput = <T extends FieldValues>({
  name,
  register,
  errors,
  className,
  ...rest
}: InputProps<T>) => (
  <div className={k.input_wrapper}>
    <input
      className={[className, get(errors, name) ? k.input_error : ""]
        .filter(Boolean)
        .join(" ")}
      {...register(name)}
      {...rest}
    />
    <ErrorMessage name={name} errors={errors} />
  </div>
);

export const CheckboxInputTerms = <T extends FieldValues>({
  name,
  register,
  errors,
  label,
}: CheckboxProps<T>) => (
  <div className={k.checkbox_wrapper}>
    <label className={k.checkbox_label}>
      <input type="checkbox" {...register(name)} />
      {label}
    </label>
    <ErrorMessage name={name} errors={errors} />
  </div>
);

export const FormTextarea = <T extends FieldValues>({
  name,
  register,
  errors,
  className,
  ...rest
}: TextareaProps<T>) => (
  <div className={k.input_wrapper}>
    <textarea
      className={[className, get(errors, name) ? k.input_error : ""]
        .filter(Boolean)
        .join(" ")}
      {...register(name)}
      {...rest}
    />
    <ErrorMessage name={name} errors={errors} />
  </div>
);
