// src/components/common/SearchBar.tsx

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const SearchBar = ({ searchTerm, setSearchTerm }: SearchBarProps) => (
    <input
        type="text"
        placeholder="Search by project title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/2 p-2 bg-white border border-gray-300 rounded-md shadow-sm"
    />
);