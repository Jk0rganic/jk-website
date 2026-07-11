"use client";

import { useEffect, useRef, useState } from "react";
import k from "./styles.module.scss";

type Props = {
  id: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
};

export default function ComboboxInput({
  id,
  value,
  options,
  placeholder,
  disabled,
  className,
  onChange,
  onCommit,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? options.filter((option) =>
        option.toLowerCase().includes(value.trim().toLowerCase()),
      )
    : options;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const selectOption = (option: string) => {
    onChange(option);
    onCommit(option);
    setActiveIndex(-1);
    setOpen(false);
  };

  return (
    <div className={k.combobox} ref={wrapperRef}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        value={value}
        aria-activedescendant={
          activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          onCommit(value);
          setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) =>
              index + 1 >= filtered.length ? 0 : index + 1,
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) =>
              index - 1 < 0 ? filtered.length - 1 : index - 1,
            );
          } else if (event.key === "Enter") {
            if (open && activeIndex >= 0 && filtered[activeIndex]) {
              event.preventDefault();
              selectOption(filtered[activeIndex]);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && !disabled && filtered.length > 0 ? (
        <div id={`${id}-listbox`} role="listbox" className={k.combobox_list}>
          {filtered.map((option, index) => (
            <div
              key={option}
              id={`${id}-option-${index}`}
              role="option"
              tabIndex={-1}
              aria-selected={index === activeIndex}
              className={`${k.combobox_option} ${
                index === activeIndex ? k.combobox_option_active : ""
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
              onKeyDown={(event) => {
                if (event.key === "Enter") selectOption(option);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
