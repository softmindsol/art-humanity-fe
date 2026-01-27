// ProjectStatusFilter.tsx
import { useId } from "react";
import { Menu, ChevronDown } from "lucide-react";

type Status = "all" | "active" | "paused";

interface FilterProps {
    statusFilter: Status;
    setStatusFilter: (status: Status) => void;
}

export const ProjectStatusFilter = ({ statusFilter, setStatusFilter }: FilterProps) => {
    const id = useId();
    return (
        <div className="w-full md:w-auto">
            
            <div className="relative group">
                {/* left icon - Menu/Hamburgery icon */}
                <Menu className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#AAB2C7]" />
    
                <select
                    id={id}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as Status)}
                    className="w-full md:w-[220px] h-[40px] appearance-none rounded-[12px] bg-[#34343d] py-3 pl-12 pr-10 text-sm text-white shadow-sm
                     focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer hover:bg-[#3e3e4a] transition-colors border-none"
                    style={{
                        backgroundColor: '#34343d', // Fallback
                    }}
                >
                    <option value="all" className="bg-[#34343d] text-white">All Statuses</option>
                    <option value="active" className="bg-[#34343d] text-white">Active</option>
                    <option value="paused" className="bg-[#34343d] text-white">Paused</option>
                </select>

                {/* right caret */}
                <ChevronDown className="pointer-events-none absolute right-2 md:left-48 lg:right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#AAB2C7]" />
            </div>
        </div>
    );
};
