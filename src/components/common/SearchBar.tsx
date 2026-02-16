// src/components/common/SearchBar.tsx
import React, { useRef } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full md:w-[420px]">
      <label htmlFor="project-search" className="sr-only">
        Search by project title
      </label>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#AAB2C7] pointer-events-none" />

        <input
          id="project-search"
          ref={inputRef}
          type="text"
          placeholder="Search by project Title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && searchTerm) clear();
          }}
          className="w-full h-[40px] rounded-[12px] bg-[#34343d] py-3 pl-12 pr-10 text-sm text-white shadow-sm
                     placeholder:text-[#AAB2C7] focus:outline-none focus:ring-1 focus:ring-white/20 transition-all
                     border-none"
          style={{
            backgroundColor: "#34343d", // Fallback
          }}
        />

        {/* Right clear button */}
        {searchTerm && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center
                       rounded-full text-[#AAB2C7] hover:bg-white/10 hover:text-white transition"
            aria-label="Clear search"
            title="Clear"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
