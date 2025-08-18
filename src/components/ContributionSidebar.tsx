
import { useEffect, useMemo, useState } from 'react';
import ContributionsList from './ContributionsList';
import { getContributionsByProject } from '@/redux/action/contribution';
import type { AppDispatch, RootState } from '@/redux/store';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';


const SIDEBAR_WIDTH = 350; // Sidebar ki width ko ek variable mein rakhein

const ContributionSidebar = ({ projectId, contributions, selectedContributionId, onContributionSelect, listItemRefs }: any) => {
    const [isOpen, setIsOpen] = useState(false); // Sidebar ki open/close state
    const [activeTab, setActiveTab] = useState('project'); // 'project' ya 'my'
    const [filter, setFilter] = useState('newest'); // Default filter
    const dispatch = useDispatch<AppDispatch>(); // Dispatch function hasil karein
    const user = useSelector((state: RootState) => state?.auth?.user);
    const currentUserId = user?.id; // Current user ID

    const displayedContributions = useMemo(() => {
        // Hamesha ek nayi copy par kaam karein taake original data mehfooz rahe
        let processedContributions = [...(contributions || [])];

        // Step 2: Active tab ke hisab se list ko filter karein
        if (activeTab === 'my' && currentUserId) {
            processedContributions = processedContributions.filter(
                (contrib: any) => contrib.userId?._id === currentUserId
            );
        }

        // Note: Sorting ab backend se ho rahi hai, isliye yahan dobara sort karne ki zaroorat nahi.
        // Agar aap frontend par sorting karna chahein, to woh logic yahan aayegi.

        return processedContributions;

    }, [contributions, activeTab, currentUserId]); // Jab yeh cheezein badlengi, to list re-calculate hogi
    // --- NEW useEffect for triggering data refetch on filter change ---
    useEffect(() => {
        // Yeh effect tab chalega jab component load hoga, ya jab 'filter' ya 'projectId' badlega.
        if (projectId) {
            console.log(`Refetching contributions for project ${projectId} with filter: ${filter}`);
            // Naye 'sortBy' parameter ke sath thunk ko dispatch karein
            dispatch(getContributionsByProject({ projectId, sortBy: filter }));
        }
    }, [filter, projectId, dispatch]); // Dependency array


    useEffect(() => {
        // Action: Jab sidebar khulta hai
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'auto'; // Scrolling ko wapas normal kar dein
        };
    }, [isOpen]); // Dependency array: Yeh effect sirf tab chalega jab `isOpen` ki value badlegi.
    return (
        <div className={`fixed  top-0 right-0 h-screen z-40 flex items-center  `}
            style={{
                width: isOpen ? `${SIDEBAR_WIDTH}px` : '',
                right: isOpen ? '0px' : `-${SIDEBAR_WIDTH}px`, // Panel ki animation
                transition: 'right 0.3s ease-in-out',
            }}
        >

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-1/2 -translate-y-1/2 bg-[#5d4e37] text-white py-2 px-5 rounded-l-lg shadow-lg cursor-pointer z-50"
                style={{
                    right: '100%', // Yeh button ko panel ke bilkul bahar (left side) rakhega
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                }}
            >
                Contributions
            </button>

            {/* --- Main Sidebar Panel --- */}
            {
                <div
                    className={`w-[350px] h-screen bg-[#f8f0e3] border-l-4 border-[#5d4e37] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >


                    <div className="flex ">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`flex-1 py-4 px-6 text-lg cursor-pointer ${activeTab === 'my' ? 'border-b-2 font-bold text-[#5d4e37]' : 'text-[#654321]'}`}
                        >
                            My Contributions
                        </button>
                        <button
                            onClick={() => setActiveTab('project')}
                            className={`flex-1 p-4 text-lg cursor-pointer ${activeTab === 'project' ? 'border-b-2  font-bold text-[#5d4e37]' : 'text-[#654321]'}`}
                        >
                            Project Contributions
                        </button>
                    </div>

                    <div className="p-4 flex-grow overflow-y-auto">


                        <p className="text-sm text-gray-600 mb-4">
                            If a contribution receives over 50% downvotes from all project contributors it will be rejected and permanently deleted from the canvas...
                        </p>
                        <div className="flex items-center gap-4 mb-4">
                            <label htmlFor="filter" className="font-semibold text-gray-700">
                                Filter By:
                            </label>

                            <div className="relative w-[230px]">
                                <select
                                    id="filter"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="block w-full appearance-none p-2 pr-8 border border-gray-300 rounded-md"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="most-upvoted">Most Upvoted</option>
                                    <option value="most-downvoted">Most Downvoted</option>
                                </select>

                                {/* Custom dropdown arrow */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>



                        <ContributionsList
                            contributions={displayedContributions}
                            selectedContributionId={selectedContributionId}
                            onContributionSelect={onContributionSelect}
                            listItemRefs={listItemRefs}
                            projectId={projectId}
                        />


                    </div>

                </div>}
        </div>
    );
};

export default ContributionSidebar;