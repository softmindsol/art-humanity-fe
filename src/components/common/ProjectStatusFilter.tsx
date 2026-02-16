// ProjectStatusFilter.tsx
import { Menu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Status = "all" | "active" | "paused";

interface FilterProps {
  statusFilter: Status;
  setStatusFilter: (status: Status) => void;
}

const statusLabels: Record<Status, string> = {
  all: "All Statuses",
  active: "Active",
  paused: "Paused",
};

export const ProjectStatusFilter = ({
  statusFilter,
  setStatusFilter,
}: FilterProps) => {
  return (
    <div className="w-full md:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-full md:w-[220px] h-[40px] rounded-[12px] bg-[#34343d] py-3 pl-12 pr-10 text-sm text-white shadow-sm
                       focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer hover:bg-[#3e3e4a] transition-colors border-none
                       relative flex items-center"
          >
            {/* left icon - Menu/Hamburgery icon */}
            <Menu className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#AAB2C7]" />

            <span className="flex-1 text-left">
              {statusLabels[statusFilter]}
            </span>

            {/* right caret */}
            <ChevronDown className="pointer-events-none absolute right-2 md:left-48 lg:right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#AAB2C7]" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[220px] bg-[#34343d] border-none text-white"
          align="start"
        >
          <DropdownMenuItem
            onClick={() => setStatusFilter("all")}
            className="cursor-pointer hover:bg-[#3e3e4a] focus:bg-[#3e3e4a] focus:text-white"
          >
            All Statuses
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setStatusFilter("active")}
            className="cursor-pointer hover:bg-[#3e3e4a] focus:bg-[#3e3e4a] focus:text-white"
          >
            Active
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setStatusFilter("paused")}
            className="cursor-pointer hover:bg-[#3e3e4a] focus:bg-[#3e3e4a] focus:text-white"
          >
            Paused
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
