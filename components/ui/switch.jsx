import React from "react";

export function Switch({ id, checked, onCheckedChange, className = "" }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-black" : "bg-gray-400"} ${className}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}

export default Switch;
