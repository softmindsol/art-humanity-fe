import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import useAppDispatch from '@/hook/useDispatch';
import { addContributors } from '@/redux/action/project';
import { toast } from 'sonner';
import { fetchAllRegisteredUsers } from '@/redux/action/auth';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { RootState } from '@/redux/store';
import { Checkbox } from '../ui/checkbox';

export const AddContributorModal = ({ projectId, currentContributors, onClose, ownerId, loading, setLoading }: any) => {
    const dispatch = useAppDispatch();
    
    // Step 1: Sahi slice se data hasil karein
    const { allUsers, loading:isLoading } = useSelector((state: RootState) => state?.auth);

    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        
        dispatch(fetchAllRegisteredUsers());
       
    }, [dispatch]);

    const handleSelect = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    
   const handleSave = () => {
       
        const newUsersToAdd = selectedUsers.filter(id => !currentContributorIds.has(id));

        if (newUsersToAdd.length === 0) {
            toast.info("No new contributors were selected.");
            onClose();
            return;
        }
       setLoading(true)
        dispatch(addContributors({ projectId, userIdsToAdd: newUsersToAdd,ownerId }))
            .unwrap()
            .then(() => {
                toast.success('Contributors added successfully!');
                setLoading(false)
                onClose();
            })
            .catch((err) =>{ 
                setLoading(false)
                toast.error(err)});
    };

    
    const currentContributorIds = useMemo(() => {
        // Safety check: Agar currentContributors mojood nahi ya empty hai, to khali Set return karein
        if (!currentContributors || currentContributors.length === 0) {
            return new Set<string>();
        }

        // Check karein ke array ka pehla element string hai ya object
        const isArrayOfStrings = typeof currentContributors[0] === 'string';

        if (isArrayOfStrings) {
            // Agar yeh IDs ka array hai, to direct Set banayein
            return new Set<string>(currentContributors);
        } else {
            // Agar yeh objects ka array hai, to har object se '_id' nikaal kar Set banayein
            return new Set<string>(currentContributors.map((c: any) => c._id));
        }
    }, [currentContributors]); // Yeh sirf tab dobara chalega jab prop badlega

    // Step 3: Users ki list ko filter karein
    const filteredUsers = useMemo(() =>
        (allUsers || []).filter((user: any) =>
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [allUsers, searchTerm]);

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="w-[35rem] p-6 bg-white rounded-lg shadow-md">
                <DialogHeader>
                    <h3 className="text-xl font-bold mb-4">Add Contributors</h3>
                </DialogHeader>

                <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full p-2 border rounded mb-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <ul className="max-h-64 overflow-y-auto">
                    {isLoading ? (
                        <p>Loading users...</p>
                    ) : (
                        filteredUsers.map((user: any) => {
                            // Step 4: Check karein ke user pehle se contributor hai ya nahi
                            const isAlreadyContributor = currentContributorIds.has(user._id);
                            return (
                                <li key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                                    <label htmlFor={`user-${user._id}`} className={`flex-grow cursor-pointer ${isAlreadyContributor ? 'text-[#5d4037]' : ''}`}>
                                        {user.fullName} ({user.email})
                                        {isAlreadyContributor && <span className="text-xs text-[#5d4037] ml-2">(Already a contributor)</span>}
                                    </label>
                                    <Checkbox
                                        id={`user-${user._id}`}
                                        checked={isAlreadyContributor || selectedUsers.includes(user._id)}
                                        disabled={isAlreadyContributor}
                                        onCheckedChange={() => handleSelect(user._id)} // <-- `onChange` ko `onCheckedChange` karein
                                        className="disabled:opacity-50 cursor-pointer"
                                    />
                                </li>
                            );
                        })
                    )}
                </ul>

                <DialogFooter className="mt-6 flex justify-end gap-4">
                    <Button variant="outline" className="cursor-pointer" onClick={onClose}>Cancel</Button>
                    <Button
                        className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50"
                        onClick={handleSave}
                        disabled={selectedUsers.length === 0 || loading}
                    >
                        {loading ?"Adding...":' Add Selected'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};