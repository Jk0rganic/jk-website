import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { CheckOutSchemaType } from "./checkout-schema";

export interface CheckoutFormProps {
  register: UseFormRegister<CheckOutSchemaType>;
  control: Control<CheckOutSchemaType>;
  errors: FieldErrors<CheckOutSchemaType>;
  setValue: UseFormSetValue<CheckOutSchemaType>;
  watch: UseFormWatch<CheckOutSchemaType>;
  loading?: boolean;
  error?: Error | null;
}
