
import { ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';

const ContributionsList = ({ contributions, selectedContributionId, onContributionSelect }: any) => {
    if (!contributions || contributions.length === 0) {
        return <div className="p-4 text-center text-gray-500">Loading project contributions...</div>;
    }
    console.log("contributions:", contributions)    
    return (
        <ul className="space-y-4">
            {contributions?.map((contrib: any) => {
                const isSelected = contrib?._id === selectedContributionId;
                console.log("isSelected:", isSelected)
                return (
                    <li
                        key={contrib?._id}
                        className={`bg-white p-3 rounded-lg border-2 transition-all ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-400'}`}
                        onClick={() => onContributionSelect(contrib._id)}
                    >
                        <div className="flex gap-3">
                            {/* Thumbnail Placeholder */}
                            <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0">
                                {/* TODO: Yahan contribution ka thumbnail aayega */}
                            </div>

                            <div className="flex-grow">
                                <p className="font-bold text-gray-800">By: {contrib.userId}</p>
                                <p className="text-xs text-gray-500">ID: {contrib?._id}</p>

                                {/* Vote and Comment Section */}
                                <div className="flex items-center gap-4 mt-2">
                                    {/* Upvote */}
                                    <div className="flex items-center gap-1">
                                        <button className="text-gray-500 hover:text-green-600"><ArrowBigUp size={20} /></button>
                                        <span className="font-semibold text-green-600">5</span>
                                    </div>
                                    {/* Downvote */}
                                    <div className="flex items-center gap-1">
                                        <button className="text-gray-500 hover:text-red-600"><ArrowBigDown size={20} /></button>
                                        <span className="font-semibold text-red-600">2</span>
                                    </div>
                                    {/* Comments */}
                                    <div className="flex items-center gap-1">
                                        <button className="text-gray-500 hover:text-blue-600"><MessageSquare size={18} /></button>
                                        <span className="font-semibold text-blue-600">1</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default ContributionsList;