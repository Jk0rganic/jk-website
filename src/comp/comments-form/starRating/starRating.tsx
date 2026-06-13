import k from "./styles.module.scss";

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  errors?: Record<string, { message: string }>;
  name?: string;
}

export default function StarRating({
  rating,
  setRating,
  errors,
  name = "rating",
}: StarRatingProps) {
  const handleClick = (index: number) => {
    setRating(index + 1); // Update the rating
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={k.start_rating}>
      <div className={k.wrapper}>
        <span>Your Rating</span>
        {stars.map((star, index) => (
          <button
            key={index as number}
            type="button"
            value={index + 1}
            className={`${k.star} ${index < rating ? k.filled : ""}`}
            onClick={() => handleClick(index)}
            aria-label={`Rate ${star} out of 5`}
          >
            ★
          </button>
        ))}
      </div>
      {errors?.[name] && (
        <span className={k.error_field}>{errors[name]?.message}</span>
      )}
    </div>
  );
}
