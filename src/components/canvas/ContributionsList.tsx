import useAuth from '@/hook/useAuth';
import useAppDispatch from '@/hook/useDispatch';
import { deleteContribution, voteOnContribution } from '@/redux/action/contribution';
import { Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Helper to format date
const formatDate = (dateString: any) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

const ContributionsList = ({
    isContributor,
    contributions,
    selectedContributionId,
    onContributionSelect,
    listItemRefs,
    onGuestVoteAttempt,
    isLoading,
    activeContributionId
}: any) => {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const [isLoadingVoted, setIsLoadingVoted] = useState(false);

    const handleVote = async (e: any, contributionId: any, voteType: any) => {
        e.stopPropagation();

        if (!user) {
            onGuestVoteAttempt();
            return;
        }
        setIsLoadingVoted(true);
        try {

            // Step 1: Action dispatch karne se pehle, purana vote status check karein
            const originalContribution = contributions.find((c: any) => c._id === contributionId);
            const previousVote = originalContribution?.voters?.find((v: any) => v.userId === user._id);

            // Step 2: Action ko dispatch karein aur backend se naya, updated contribution object hasil karein
            // Humne iska naam 'response' rakha hai, iske andar 'wasDeleted' ya 'updatedContribution' ho sakta hai
            const response = await dispatch(voteOnContribution({ contributionId, voteType, userId: user._id })).unwrap();

            // Agar contribution delete ho gayi to kuch na karein (is a toast in slice already)
            if (response.wasDeleted) {
                toast.info("Contribution was auto-deleted due to high downvotes.");
                return;
            }

            const updatedContribution = response;

            // Step 3: Ab purane aur naye vote status ko compare karke sahi message dikhayein
            const newVote = updatedContribution.voters.find((v: any) => v.userId === user._id);

            let toastMessage = '';

            if (!previousVote && newVote) {
                // Case A: Pehle vote nahi tha, ab hai (Naya vote laga hai)
                toastMessage = `You ${voteType === 'up' ? 'upvoted' : 'downvoted'} this contribution.`;
                toast.success(toastMessage);
            } else if (previousVote && !newVote) {
                // Case B: Pehle vote tha, ab nahi hai (Vote hataya gaya hai)
                toastMessage = `Your ${voteType === 'up' ? 'upvote' : 'downvote'} has been removed.`;
                toast.info(toastMessage);
            } else if (previousVote && newVote && previousVote.voteType !== newVote.voteType) {
                // Case C: Pehle vote tha, aur ab bhi hai, lekin type badal gaya hai (upvote se downvote ya vice versa)
                toastMessage = `Your vote has been changed to an ${voteType === 'up' ? 'upvote' : 'downvote'}.`;
                toast.success(toastMessage);
            }
            // Case D: Agar user ne dobara same button dabaya aur vote remove ho gaya (Case B handle kar lega),
            // ya agar koi aur unexpected case ho to hum kuch nahi dikhayeinge taake user confuse na ho.

        } catch (err: any) {
            console.error('Voting failed:', err);
            toast.error(err.response?.data?.message || 'Failed to register your vote.');
        }
        finally {
            setIsLoadingVoted(false);
        }
    };
    const handleDelete = (e: any, contributionId: any) => {
        e.stopPropagation();
        // if (confirm('Are you sure you want to delete this contribution?')) {
        dispatch(deleteContribution({ contributionId }));
        // }
    };

    useEffect(() => {
        // Yeh effect tab chalega jab selection badlega
        if (selectedContributionId && listItemRefs.current[selectedContributionId]) {
            console.log(`Scrolling to card: ${selectedContributionId}`);

            // Thora sa delay dein taake DOM update ho jaye
            setTimeout(() => {
                const element = listItemRefs.current[selectedContributionId];
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100); // 100ms ka chota sa delay
        }
    }, [selectedContributionId, listItemRefs, activeContributionId]);

    if ((!contributions || contributions.length === 0) && !isLoading) {
        return <div className="p-4 text-center text-gray-500">No project contributions</div>;
    }

    return (
        <ul className="space-y-4 font-serif">
            {contributions?.map((contrib: any) => {
                const isSelected = contrib?._id === selectedContributionId;
                const isActive = contrib?._id === activeContributionId; // <-- Check if this is the active one
                if (isActive) {
                    console.log(`[List] Item ${contrib._id} IS ACTIVE.`);
                }
                const artistName = contrib.userId?.fullName || 'Artist';
                const totalVotes = (contrib.upvotes || 0) + (contrib.downvotes || 0);
                const downvotePercentage = totalVotes === 0 ? 0 : ((contrib.downvotes || 0) / totalVotes) * 100;
                const pixelCount = (contrib.strokes || [])
                    .reduce((total: number, stroke: any) => {
                        if (stroke && stroke.strokePath) {
                            return total + (stroke.strokePath.length || 0);
                        }
                        return total;
                    }, 0);
                return (
                    <li
                        key={contrib?._id}
                        ref={el => {
                            if (listItemRefs.current) {
                                listItemRefs.current[contrib._id] = el;
                            }
                        }}
                        className={`bg-white rounded-lg border transition-all shadow-sm p-2 cursor-pointer  ${isActive
                                ? 'border-2 border-blue-500' // If it's ACTIVE, always apply this
                                : isSelected
                                    ? 'border-[#a1887f] shadow-lg' // Othewise, if it's SELECTED, apply this
                                    : 'border-gray-200 hover:border-[#d7ccc8]' // Otherwise, apply the default
        }`}
                        onClick={() => onContributionSelect(contrib._id)}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-2 py-4 bg-[#f8f0e3] rounded-t-md border-b border-gray-300">
                            <span className="text-[11.7px] text-[#5d4037]">Pixels: {pixelCount}</span>
                            <span className="text-[13px] font-semibold text-[#3e2723]">By: {artistName}</span>
                        </div>

                        {/* Thumbnail */}
                        <div className="h-40 bg-gray-200 flex items-center justify-center p-2">
                            {contrib.thumbnailUrl ? (
                                <img
                                    src={contrib.thumbnailUrl}
                                    alt={`Contribution by ${artistName}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <div className="text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" x2="12" y1="3" y2="15" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="flex justify-end items-center p-2 bg-[#f8f0e3] border-y border-gray-300">
                            <span className="text-[11px] text-[#654321]">Created: {formatDate(contrib.createdAt)}</span>
                            {/* <span className="text-[11px] text-[#654321]">Modified: {formatDate(contrib.updatedAt)}</span> */}
                        </div>

                        {/* Voting and Actions */}
                        <div className="flex justify-between items-center bg-[#f8f0e3] p-1 rounded-[2px] mt-2">
                            <div className="flex items-center justify-center gap-3 w-full">
                                <button title={!isContributor ? "Only contributors can vote" : "Upvote"} disabled={isLoadingVoted || !isContributor} onClick={(e) => handleVote(e, contrib._id, 'up')} className="flex text-[14px] items-center gap-1 text-[#5d4037] cursor-pointer cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                                    ▲ <span  className="font-bold" >{contrib.upvotes || 0}</span>
                                </button>
                                <button disabled={isLoadingVoted || !isContributor} title={!isContributor ? "Only contributors can vote" : "Downvote"} onClick={(e) => handleVote(e, contrib._id, 'down')} className="flex text-[14px] items-center gap-1 text-[#f44336] cursor-pointer cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                                    ▼ <span className="font-bold">{contrib.downvotes || 0}</span>
                                    <span className=" text-[#654321] font-semibold">({downvotePercentage.toFixed(1)}%)</span>
                                </button>
                            </div>
                            {user?.role === 'admin' && (
                                <button
                                    onClick={(e) => handleDelete(e, contrib._id)}
                                    className="text-[#654321] cursor-pointer hover:text-[#f44336]"
                                    title="Admin: Delete Contribution"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default React.memo(ContributionsList);
 