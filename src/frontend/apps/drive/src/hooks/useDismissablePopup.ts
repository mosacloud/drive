import { RefObject, useEffect } from "react";

// Open popups, oldest first. Escape only closes the most recently opened one,
// so a single keypress doesn't dismiss every popup that happens to be open.
const openPopups: symbol[] = [];

/**
 * Closes an open popup on an outside click or Escape, returning focus to the
 * trigger on Escape so keyboard users don't lose their place.
 */
export const useDismissablePopup = (
  popupRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void
) => {
  useEffect(() => {
    if (!isOpen) return;
    const id = Symbol("popup");
    openPopups.push(id);
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openPopups[openPopups.length - 1] === id) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      openPopups.splice(openPopups.indexOf(id), 1);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, popupRef, triggerRef, setIsOpen]);
};
