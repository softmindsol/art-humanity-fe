
import { useEffect, useState } from 'react';
import ContributionsList from './ContributionsList';


const SIDEBAR_WIDTH = 350; // Sidebar ki width ko ek variable mein rakhein

const ContributionSidebar = ({ contributions, selectedContributionId, onContributionSelect, canvasStats, infoBoxData }: any) => {
    const [isOpen, setIsOpen] = useState(false); // Sidebar ki open/close state
    const [activeTab, setActiveTab] = useState('project'); // 'project' ya 'my'
    const [filter, setFilter] = useState('most-downvoted');


    const filteredContributions = contributions;
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
                    className={`w-[350px] h-screen bg-[#f3f0e9] border-l-4 border-[#5d4e37] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >


                    <div className="flex border-b-2 border-gray-300">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`flex-1 p-4 text-lg ${activeTab === 'my' ? 'bg-white font-bold text-[#5d4e37]' : 'text-gray-500'}`}
                        >
                            My Contributions
                        </button>
                        <button
                            onClick={() => setActiveTab('project')}
                            className={`flex-1 p-4 text-lg ${activeTab === 'project' ? 'bg-white font-bold text-[#5d4e37]' : 'text-gray-500'}`}
                        >
                            Project Contributions
                        </button>
                    </div>

                    <div className="p-4 flex-grow overflow-y-auto">


                        <p className="text-sm text-gray-600 mb-4">
                            If a contribution receives over 50% downvotes from all project contributors it will be rejected and permanently deleted from the canvas...
                        </p>
                        <div className="flex items-center gap-2 mb-4">
                            <label htmlFor="filter" className="font-semibold text-gray-700">Filter By:</label>
                            <select
                                id="filter"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="p-2 border border-gray-300 rounded-md flex-1"
                            >
                                <option value="most-downvoted">Most Downvoted</option>
                                <option value="most-upvoted">Most Upvoted</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>



                        <ContributionsList
                            contributions={filteredContributions}
                            selectedContributionId={selectedContributionId}
                            onContributionSelect={onContributionSelect}
                        />


                    </div>

                </div>}
        </div>
    );
};

export default ContributionSidebar;