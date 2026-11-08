"use client";

type ConfirmSubmitButtonProps = {
  children: string;
  question: string;
  className?: string;
  ariaLabel?: string;
};

export default function ConfirmSubmitButton({
  children,
  question,
  className = "",
  ariaLabel,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      type="submit"
      aria-label={ariaLabel}
      onClick={(event) => {
        if (!window.confirm(question)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
