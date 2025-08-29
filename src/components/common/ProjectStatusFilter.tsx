
type Status = 'all' | 'active' | 'paused';

interface FilterProps {
    statusFilter: Status;
    setStatusFilter: (status: Status) => void;
}

export const ProjectStatusFilter = ({ statusFilter, setStatusFilter }: FilterProps) => (
    <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as Status)}
        className="w-full cursor-pointer text-[14px] md:w-auto p-2 bg-white border border-gray-300 rounded-md shadow-sm"
    >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
    </select>
);