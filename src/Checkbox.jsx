import React, { useEffect, useRef, useState } from "react";

export default function Checkbox({ checked, onChange }) {
  const didMount = useRef(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (didMount.current) {
      setAnimating(true);
      const timeout = setTimeout(() => setAnimating(false), 400); // Slower
      return () => clearTimeout(timeout);
    } else {
      didMount.current = true;
    }
  }, [checked]);

  return (
    <label className="flex items-center cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-6 h-6 rounded-md border-2 flex items-center justify-center
          transition-colors duration-500 ease-in-out
          ${checked ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"}
        `}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 text-white transition-transform transition-opacity duration-500 ease-in-out
            ${checked ? "scale-100 opacity-100" : "scale-75 opacity-0"}
            ${animating ? "animate-checkbox-smooth" : ""}
          `}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </label>
  );
}
