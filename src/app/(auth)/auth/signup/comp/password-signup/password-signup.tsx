"use client";

import { useState, useCallback } from "react";

import { FieldErrors, UseFormRegister } from "react-hook-form";

import k from "./styles.module.scss";
import { FormInput } from "@/comp/form/formInput/formInput";

interface Props {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export default function PasswordSignup({ register, errors }: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className={k.cn_wrapper}>
      {/* PASSWORD */}
      <div className={k.input_wrapper}>
        <div className={k.input_password}>
          <input
            className={errors.password ? k.input_error : ""}
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Password"
          />

          <button
            type="button"
            className={k.show_password}
            onClick={togglePassword}
            aria-label="Toggle password visibility"
          >
            {showPassword ? "👁️" : "🙈"}
          </button>
        </div>

        {errors.password && (
          <span className={k.error_field}>
            {errors.password?.message as string}
          </span>
        )}
      </div>

      {/* CONFIRM PASSWORD */}
      <FormInput
        type={showPassword ? "text" : "password"}
        name="confirm_password"
        register={register}
        errors={errors}
        placeholder="Confirm Password"
      />
    </div>
  );
}
