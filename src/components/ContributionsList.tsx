
import useAuth from '@/hook/useAuth';
import useAppDispatch from '@/hook/useDispatch';
import { deleteContribution, getContributionsByProject, voteOnContribution } from '@/redux/action/contribution';
import { ArrowBigUp, ArrowBigDown, Trash2 } from 'lucide-react';


const ContributionsList = ({ projectId, contributions, selectedContributionId, onContributionSelect, listItemRefs, onGuestVoteAttempt }: any) => {
    const dispatch = useAppDispatch();
    const { user } = useAuth();

    const handleVote = (contributionId: any, voteType: any, userId: any) => {
        if (!user) {
            // Step 2: Agar nahi, to parent ko khabar dein aur function rok dein
            onGuestVoteAttempt();
            return;
        }
        // Thunk ko zaroori data ke sath dispatch karein
        dispatch(voteOnContribution({ contributionId, voteType, userId })).unwrap()
        dispatch(getContributionsByProject({ projectId, sortBy:"newest" })); // Contributions ko update karne ke liye
        

    };

    if (!contributions || contributions.length === 0) {
        return <div className="p-4 text-center text-gray-500">No project contributions</div>;
    }

    return (
        <ul className="space-y-4">
            {contributions?.map((contrib: any) => {
                const isSelected = contrib?._id === selectedContributionId;
                const artistName = contrib.userId?.fullName || 'Unknown Artist';
                return (
                    <li
                        key={contrib?._id}
                        ref={el => {
                            if (listItemRefs.current) {
                                listItemRefs.current[contrib._id] = el;
                            }
                        }}
                        className={`bg-white p-3 rounded-lg border-2 transition-all ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-400'}`}
                        onClick={() => onContributionSelect(contrib._id)}
                    >
                        <div className="flex gap-3">
                            {/* Thumbnail Placeholder */}
                            <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0">
                                {contrib.thumbnailUrl ? (
                                    <img
                                        src={`${import.meta.env.VITE_BASE}${contrib?.thumbnailUrl}`} // Poora URL banayein
                                        alt={`Contribution by ${contrib?.userId?.username}`}
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                ) : (
                                    // Agar thumbnail na ho to placeholder dikhayein
                                    <div className="w-full h-full bg-gray-300 rounded-md"></div>
                                )}
                            </div>

                            <div className="flex-grow">
                                <p className="font-bold text-gray-800">By: {artistName}</p>
                                <p className="text-xs text-gray-500">ID: {contrib?._id}</p>

                                {/* Vote and Comment Section */}
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleVote(contrib._id, 'up', user?.id)}
                                            className="text-gray-500 hover:text-green-600 cursor-pointer"
                                        >
                                            <ArrowBigUp size={20} />
                                        </button>
                                        <span className="font-semibold text-green-600">
                                            {contrib.upvotes || 0}
                                        </span>
                                    </div>
                                    {/* Downvote */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleVote(contrib._id, 'down', user?.id)}
                                            className="text-gray-500 hover:text-red-600 cursor-pointer"
                                        >
                                            <ArrowBigDown size={20} />
                                        </button>
                                        <span className="font-semibold text-red-600">
                                            {contrib.downvotes || 0}
                                        </span>
                                    </div>
                                    {/* Comments */}
                                    {/* <div className="flex items-center gap-1">
                                        <button className="text-gray-500 hover:text-blue-600"><MessageSquare size={18} /></button>
                                        <span className="font-semibold text-blue-600">1</span>
                                    </div> */}
                                    {user?.role ==='admin' && (
                                        <button
                                            onClick={() => dispatch(deleteContribution({ contributionId: contrib._id }))}
                                            className="text-gray-500 hover:text-red-700 ml-auto cursor-pointer"
                                            title="Admin: Delete Contribution"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
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