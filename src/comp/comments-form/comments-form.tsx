"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { FormInput, FormTextarea } from "@/comp/form/formInput/formInput";
import { ADD_REVIEW } from "@/graphql/graphql";
import { fetchGraphQL } from "@/lib/fetch/fetchGraphQL";
import { commentsSchema, reviewSchema } from "@/utils/zod/zod";
import StarRating from "./starRating/starRating";

import k from "./styles.module.scss";

interface AddReviewVariables {
  productId: number;
  author: string;
  authorEmail: string;
  content: string;
}

interface AddReviewResponse {
  createComment: {
    comment: {
      id: string;
      content: string;
      author: {
        name: string;
        email: string;
      };
    };
  };
}

interface ReviewFormProps {
  productId: number;
}

type ReviewFormData = z.infer<typeof reviewSchema>;
type CommentFormData = z.infer<typeof commentsSchema>;

export function ReviewForm({ productId }: ReviewFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewer: "",
      reviewer_email: "",
      review: "",
      rating: 0,
    },
  });

  const saveReview = async (data: ReviewFormData) => {
    const variables: AddReviewVariables = {
      productId: Number(productId),
      author: data.reviewer,
      authorEmail: data.reviewer_email,
      content: data.review,
    };

    try {
      const result = await fetchGraphQL<AddReviewResponse, AddReviewVariables>(
        ADD_REVIEW,
        variables,
      );

      if (result?.createComment) {
        toast.success("Review submitted successfully!");
        reset();
      } else {
        toast.error("Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting the review.");
    }
  };

  return (
    <div className={k.reviewer_form}>
      <h5>Submit Your Review</h5>

      <form onSubmit={handleSubmit(saveReview)}>
        <input type="hidden" value={productId} name="product" />

        <StarRating
          rating={watch("rating") || 0}
          setRating={(value: number) =>
            setValue("rating", value, {
              shouldValidate: true,
            })
          }
        />

        <FormTextarea
          name="review"
          register={register}
          errors={errors}
          placeholder="Your review"
        />

        <div className={k.reviewer_info}>
          <FormInput
            type="text"
            name="reviewer"
            register={register}
            errors={errors}
            placeholder="Name"
          />

          <FormInput
            type="email"
            name="reviewer_email"
            register={register}
            errors={errors}
            placeholder="Email"
          />
        </div>

        <button className={k.btn_submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

export function PostReviewForm({ productId }: ReviewFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentsSchema),
    defaultValues: {
      reviewer: "",
      reviewer_email: "",
      review: "",
    },
  });

  const saveComment = async (data: CommentFormData) => {
    const variables: AddReviewVariables = {
      productId: Number(productId),
      author: data.reviewer,
      authorEmail: data.reviewer_email,
      content: data.review,
    };

    try {
      const result = await fetchGraphQL<AddReviewResponse, AddReviewVariables>(
        ADD_REVIEW,
        variables,
      );

      if (result?.createComment) {
        toast.success("Comment submitted successfully!");
        reset();
      } else {
        toast.error("Failed to submit comment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting the comment.");
    }
  };

  return (
    <div className={`${k.post_review_form} ${k.reviewer_form}`}>
      <h5>Submit Your Comment</h5>

      <form onSubmit={handleSubmit(saveComment)}>
        <input type="hidden" value={productId} name="product" />

        <FormTextarea
          name="review"
          register={register}
          errors={errors}
          placeholder="Your comment"
        />

        <div className={k.reviewer_info}>
          <FormInput
            type="text"
            name="reviewer"
            register={register}
            errors={errors}
            placeholder="Name"
          />

          <FormInput
            type="email"
            name="reviewer_email"
            register={register}
            errors={errors}
            placeholder="Email"
          />
        </div>

        <button className={k.btn_submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Comment"}
        </button>
      </form>
    </div>
  );
}
