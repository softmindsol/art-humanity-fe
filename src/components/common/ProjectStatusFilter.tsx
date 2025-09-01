// ProjectStatusFilter.tsx
import { useId } from "react";

type Status = "all" | "active" | "paused";

interface FilterProps {
    statusFilter: Status;
    setStatusFilter: (status: Status) => void;
}

export const ProjectStatusFilter = ({ statusFilter, setStatusFilter }: FilterProps) => {
    const id = useId();
    return (
        <div className="w-full md:w-auto">
            
            <div className="relative">
                {/* left icon */}
                <svg
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <path d="M3 5h18M6 12h12M10 19h4" />
                </svg>

                <select
                    id={id}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as Status)}
                    className="w-full md:w-[220px] appearance-none rounded-md border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm shadow-sm
                     focus:outline-none focus:ring-2 cursor-pointer focus:ring-[#d4af37] hover:border-gray-400 transition"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                </select>

                {/* right caret */}
                <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
        </div>
    );
};
