// src/components/common/Pagination.tsx

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
    if (totalPages <= 1) return null; // Agar 1 ya us se kam page ho to kuch na dikhayein

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="flex justify-center items-center gap-4">
            <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#8b795e] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>

            <span className="text-gray-700">
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#8b795e] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    );
};