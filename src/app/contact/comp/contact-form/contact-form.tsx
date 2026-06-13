"use client";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import k from "./styles.module.scss";
import { toast } from "sonner";
import { contactFormSchema, ContactFormSchemaType } from "@/utils/zod/zod";
import { FormInput, FormTextarea } from "@/comp/form/formInput/formInput";
import { sendEmailNodemailer } from "../../lib/sendEmailNodemailer";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormSchemaType>({
    resolver: zodResolver(contactFormSchema),
  });

  const saveUser: SubmitHandler<ContactFormSchemaType> = async (data) => {
    try {
      const res = await sendEmailNodemailer(data);

      if (res.success) {
        toast.success("Email sent!");
        reset();
      } else {
        toast.error(res.message || "Email not sent. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className={k.one}>
      <form onSubmit={handleSubmit(saveUser)}>
        <div className={k.inputs_email}>
          <FormInput
            type="text"
            name="name"
            register={register}
            errors={errors}
            placeholder="Full Name"
          />
          <FormInput
            type="email"
            name="email"
            register={register}
            errors={errors}
            placeholder="Email"
          />
        </div>
        <FormInput
          type="text"
          name="subject"
          register={register}
          errors={errors}
          placeholder="Subject"
        />
        <FormTextarea
          name="message"
          register={register}
          errors={errors}
          placeholder="Your message"
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
