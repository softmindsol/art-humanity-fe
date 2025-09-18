
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ContributionsList from './ContributionsList';
import { fetchContributionsByTiles, getContributionsByProject } from '@/redux/action/contribution';
import useAuth from '@/hook/useAuth';
import useAppDispatch from '@/hook/useDispatch';
import { clearCanvasData, selectCanvasData, selectIsLoadingOperation, selectPaginationInfo } from '@/redux/slice/contribution';
import { useSelector } from 'react-redux';
import ContributorsPanel from './ContributorsPanel';
import { AddContributorModal } from '../modal/AddContributorModal';
import useOnClickOutside from '@/hook/useOnClickOutside';
import CustomSelect from '../common/CustomSelect';


const SIDEBAR_WIDTH = 350; // Sidebar ki width ko ek variable mein rakhein

const ContributionSidebar = ({ projectId, selectedContributionId, onContributionSelect, listItemRefs, onGuestVoteAttempt, isOpen, setIsOpen }: any) => {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const { currentProject } = useSelector((state: any) => state.projects); // Project ka data hasil karein
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false)
    // States
    const [activeTab, setActiveTab] = useState('project');
    const [filter, setFilter] = useState('newest');

    // Redux Selectors
    const contributions = useSelector(selectCanvasData);
    const { currentPage, totalPages } = useSelector(selectPaginationInfo);
    const isLoading = useSelector(selectIsLoadingOperation('getContributions'));
    const isAdmin = user?.id === currentProject?.ownerId; // Check karein ke kya user admin hai
    // Refs
    const listContainerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef(null);
    const contributorsDropdownRef = useRef(null); // This ref will be for the dropdown content
    // --- ADD THIS STATE ---
    const [isContributorsDropdownOpen, setIsContributorsDropdownOpen] = useState(false);


    // --- YAHAN OPTIONS KA EK ARRAY BANAYEIN ---
    const filterOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'most-upvoted', label: 'Most Upvoted' },
        { value: 'most-downvoted', label: 'Most Downvoted' },
    ];

    // NAYI AUR THEEK CALL:
    useOnClickOutside([sidebarRef, contributorsDropdownRef], () => {

        if (isOpen) {
            setIsOpen(false);
        }
    });

    // === MASTER useEffect for Data Fetching ===
    // Yeh useEffect ab filter, projectId, aur activeTab teeno par chalega.
    useEffect(() => {
        if (projectId) {

            // (1) Pehle purana data saaf karein
            dispatch(clearCanvasData());

            // (2) Naye parameters ke saath pehla page fetch karein
            // dispatch(getContributionsByProject({
            //     projectId,
            //     sortBy: filter,
            //     page: 1,
            //     // Agar 'my' tab active hai to userId bhejein
            //     userId: activeTab === 'my' ? user?.id : undefined
            // }));
        }
    }, [filter, projectId, activeTab, user?.id, dispatch]); // activeTab ko dependency mein add karna sab se zaroori hai

    // Infinite Scroll Logic
    const handleScroll = useCallback(() => {
        const container = listContainerRef.current;
        if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 300;

            if (isNearBottom && !isLoading && currentPage < totalPages) {
                const nextPage = currentPage + 1;
                dispatch(getContributionsByProject({
                    projectId,
                    sortBy: filter,
                    page: nextPage,
                    userId: activeTab === 'my' ? user?.id : undefined
                }));
            }
        }
    }, [isLoading, currentPage, totalPages, projectId, filter, activeTab, user?.id, dispatch]);

    useEffect(() => {
        // Yeh effect tab chalega jab selection badlega ya sidebar khulega
        if (isOpen && selectedContributionId && listItemRefs.current[selectedContributionId]) {
            console.log(`Scrolling to contribution: ${selectedContributionId}`);
            // Foran scroll karne ke bajaye, thora sa delay dein taake sidebar ki animation poori ho jaye
            setTimeout(() => {
                listItemRefs.current[selectedContributionId].scrollIntoView({
                    behavior: 'smooth', // Aahista se scroll karega
                    block: 'center'    // Item ko screen ke center mein layega
                });
            }, 300); // 300ms ka delay (sidebar ki transition speed se match karein)
        }
    }, [selectedContributionId, isOpen, listItemRefs]);


    // Sidebar open/close effect
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);
    return (
        <div ref={sidebarRef} className={`fixed  top-0 right-0 h-screen z-40 flex items-center  `}
            style={{
                width: isOpen ? `${SIDEBAR_WIDTH}px` : '',
                right: isOpen ? '0px' : `-${SIDEBAR_WIDTH}px`, // Panel ki animation
                transition: 'right 0.3s ease-in-out',
            }}
        >

            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if(isOpen===false){
                        // dispatch(getContributionsByProject({
                        //     projectId,
                        //     sortBy: filter,
                        //     page: 1,
                        //     // Agar 'my' tab active hai to userId bhejein
                        //     userId: activeTab === 'my' ? user?.id : undefined
                        // }));
                                    dispatch(fetchContributionsByTiles({ projectId, tiles:'512' }));
                        
                    }

                }}
                className="absolute top-1/2 -translate-y-1/2 !bg-[#654321] !text-[17px] text-white py-2 px-8 rounded-l-md shadow-lg cursor-pointer z-50"
                style={{
                    right: '100%', // Yeh button ko panel ke bilkul bahar (left side) rakhega
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                }}
            >
                Contributions
            </button>


            {
                <div
                    className={`w-[350px] h-screen bg-[#f8f0e3] border-l-4 border-[#5d4e37] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >


                    <div className="flex ">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`flex-1 py-4 px-6 text-[19.2px] cursor-pointer ${activeTab === 'my' ? 'border-b-2 font-bold text-[#5d4e37]' : 'text-[#654321]'}`}
                        >
                            My Contributions
                        </button>
                        <button
                            onClick={() => setActiveTab('project')}
                            className={`flex p-4 text-[19.2px] cursor-pointer ${activeTab === 'project' ? 'border-b-2  font-bold text-[#5d4e37]' : 'text-[#654321]'}`}
                        >
                            Project Contributions
                        </button>

                    </div>

                    <div ref={listContainerRef} onScroll={handleScroll} className="p-4 flex-grow overflow-y-auto">
                        <p className="text-[14.4px] italic text-[#654321] mb-4">
                            If a contribution receives over 50% downvotes from all project contributors it will be rejected and permanently deleted from the canvas...
                        </p>


                        {isModalOpen && (
                            <AddContributorModal
                                projectId={currentProject?._id}
                                currentContributors={currentProject?.contributors || []}
                                onClose={() => setIsModalOpen(false)}
                                ownerId={currentProject?.ownerId}
                                currentProject={currentProject}
                                loading={loading}
                                setLoading={setLoading}
                            />
                        )}

                        {activeTab !== 'my' && <div className="flex items-center  gap-8 mb-4">
                            <label htmlFor="filter" className="!font-semibold text-[#654321]">
                                Filter By:
                            </label>

                            <div className="w-[200px]">
                                <CustomSelect
                                    options={filterOptions}
                                    value={filter}
                                    onChange={(newValue) => setFilter(newValue)}
                                />
                            </div>
                        </div>
                        }
                        {isAdmin && <ContributorsPanel
                            currentProject={currentProject}
                            loading={loading}
                            ref={contributorsDropdownRef}
                            setLoading={setLoading}
                            isDropdownOpen={isContributorsDropdownOpen}
                            onDropdownOpenChange={setIsContributorsDropdownOpen}
                        />}
                        {/* <div className='flex items-center justify-center mb-4'>
                            {
                                (activeTab === 'my' && user?.role === 'admin') && <button onClick={() => setIsModalOpen(true)} className="btn-primary  text-sm">
                                    + Add Contributor
                                </button>
                            }

                        </div> */}

                        <ContributionsList
                            contributions={contributions}
                            selectedContributionId={selectedContributionId}
                            onContributionSelect={onContributionSelect}
                            listItemRefs={listItemRefs}
                            projectId={projectId}
                            onGuestVoteAttempt={onGuestVoteAttempt}
                            loading={loading} setLoading={setLoading}
                            isLoading={isLoading}


                        />
                        {/* Loading Indicator */}
                        {isLoading && <div className="text-center p-4">Loading more contributions...</div>}

                        {/* No More Data Message */}
                        {!isLoading && contributions.length > 0 && currentPage >= totalPages && (
                            <div className="text-center p-4 text-gray-500">No more contributions to load.</div>
                        )}

                    </div>

                </div>
            }
        </div>
    );
};

export default React.memo(ContributionSidebar);
