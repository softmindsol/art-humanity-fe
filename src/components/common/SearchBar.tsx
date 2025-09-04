// src/components/common/SearchBar.tsx
import React, { useRef } from "react";

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const clear = () => {
        setSearchTerm("");
        inputRef.current?.focus();
    };

    return (
        <div className="w-[95%] md:w-[420px]">
            <label htmlFor="project-search" className="sr-only">
                Search by project title
            </label>

            <div className="relative">
                {/* Left search icon */}
                <svg
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>

                <input
                    id="project-search"
                    ref={inputRef}
                    type="text"
                    placeholder="Search by project title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape" && searchTerm) clear();
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm shadow-sm
                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d4af37] hover:border-gray-400
                     transition"
                />

                {/* Right clear button */}
                {searchTerm ? (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center
                       rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
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
                ) : null}
            </div>
        </div>
    );
};
