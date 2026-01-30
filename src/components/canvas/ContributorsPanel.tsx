import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { X, Users2, Loader2, Mail, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    AlertDialog,

    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import useAppDispatch from "@/hook/useDispatch";
import useAuth from "@/hook/useAuth";
import type { RootState } from "@/redux/store";
import { fetchContributors, removeContributor } from "@/redux/action/project";
import { selectProjectContributors } from "@/redux/slice/project";
import useOnClickOutside from "@/hook/useOnClickOutside";


export default function ContributorsDropdown({ currentProject, loading, setLoading, ref,  }: any) {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    // --- STEP 1: Nayi state banayein jo search text ko store karegi ---
    const [searchValue, setSearchValue] = useState("");
    const [isOpen, setIsOpen] = useState(false); // Dropdown ki visibility ke liye

    const contributors = useSelector(selectProjectContributors) as Array<{
        _id?: string;
        fullName?: string;
        email?: string;
    }> | string[];
    const dropdownRef = useRef(null); // Dropdown ke container ke liye ref

    const isLoading = useSelector((state: RootState) => state.projects.loading.contributors);
    const [confirmUser, setConfirmUser] = useState<{ id: string; name: string } | null>(null);
    const ownerId = currentProject?.ownerId;
    useOnClickOutside([dropdownRef], () => {
        if (isOpen) {
            setIsOpen(false);
        }
    });

    const normalized = useMemo(
        () =>
            (contributors || []).map((c: any) =>
                // Check if the item in the array is a simple string (just an ID)
                typeof c === "string"
                    // If it's a string, create a basic object
                    ? { id: c, name: "Loading...", email: "..." }
                    // If it's an object, normalize its properties
                    : { id: c._id ?? "", name: c.fullName ?? "Unknown Contributor", email: c.email ?? "No email" }
            ),
        [contributors]
    );
    const filteredUsers = useMemo(() => {
        let users = (normalized || []).filter((user: any) => user._id !== ownerId);

        // Agar search value khali nahi hai, to aage filter karein
        if (searchValue) {
            users = users.filter(user =>
                user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                user.email.toLowerCase().includes(searchValue.toLowerCase())
            );
        }

        return users;
    }, [normalized, ownerId, searchValue]); // <-- `searchValue` ko dependency banayein
    useEffect(() => {
        if (currentProject?._id) dispatch(fetchContributors({ projectId: currentProject?._id }));
    }, [currentProject?._id, dispatch]);


    const count = normalized.length;
    const handleRemove = async (id: string, name: string) => {
        try {
            setLoading(true)
            await dispatch(
                removeContributor({
                    projectId: currentProject?._id,
                    userIdToRemove: id,
                    userId: user?._id,
                })
            ).unwrap();

            toast.success(`${name} has been removed.`);
        } catch (err: any) {
            toast.error(`Failed to remove contributor: ${err?.message || "Unknown error"}`);
        } finally {
            setConfirmUser(null);
            setLoading(false)
        }
    };

    // Exclude the project owner from the list of contributors

   

    return (
        <div ref={dropdownRef} className="relative w-full mb-5 border-[1px] border-[#ffffff]">
            <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-between gap-2 w-full"
                onClick={() => setIsOpen(!isOpen)} // Toggle visibility on click
            >
                <div className="flex items-center gap-2 text-[#ffffff] ">
                    <Users2 className="h-8 w-12 " />
                    <span className="text-[16px]">Other Contributors</span>
                    <span className="rounded bg-muted py-0.5 text-sm">({count})</span>
                </div>
                <ChevronDown className={`h-4 w-4 opacity-70 text-[#ffffff] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* STEP 3: Conditional Dropdown Content */}
            {isOpen && (
                <div
                    className="absolute top-full mt-2 w-full z-20 bg-[#141414] border-1 border-[#ffffff] rounded-lg shadow-xl text-[#] font-[Georgia, serif] p-1"
                >
                    {/* Baaqi saara content iske andar daal dein */}
                    {isLoading ? (
                        <div className="flex items-center gap-2 p-4 text-sm !text-white">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading contributors…
                        </div>
                    ) : (
                        <Command shouldFilter={false}>
                            <CommandInput className="placeholder:text-[#ffffff]" placeholder="Search contributors…" value={searchValue} onValueChange={setSearchValue} />
                            {filteredUsers.length === 0 ? (
                                <CommandEmpty className="py-8 text-muted-foreground text-center text-[#ffffff]">No contributors yet.</CommandEmpty>
                            ) : (
                                <CommandGroup className="p-0">
                                    <div className="overflow-y-auto max-h-64">
                                        {filteredUsers.map((c) => {
                                            // ... (User list ka poora JSX code yahan paste karein)
                                            const isSelf = c.id && user?._id && c.id === user._id;
                                            return (
                                                <CommandItem key={c.id || c.name} className="flex w-full items-center text-[#ffffff] justify-between gap-2 px-3 py-2">
                                                    {/* User info */}
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback></Avatar>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{c.name}</div>
                                                            <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                                                <Mail className="h-3.5 w-3.5" /><span className="truncate">{c.email || "—"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Remove Button */}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer" disabled={!c.id || isSelf} onClick={(e) => { e.stopPropagation(); if (c.id) setConfirmUser({ id: c.id, name: c.name }); }} title={isSelf ? "You can't remove yourself" : `Remove ${c.name}`}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </CommandItem>
                                            );
                                        })}
                                    </div>
                                </CommandGroup>
                            )}
                        </Command>
                    )}
                </div>
            )}

            {/* Confirm Remove Dialog */}
            <AlertDialog open={!!confirmUser} onOpenChange={(o) => !o && setConfirmUser(null)}>
                <AlertDialogContent className="bg-[#0F0D0D] border border-white/10 text-white !font-sans rounded-[12px] shadow-2xl max-w-[500px] p-8">
                    <AlertDialogHeader className="gap-2">
                        <AlertDialogTitle className="text-2xl sm:text-[28px] font-semibold !text-white text-center">Remove contributor?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-[#E0E0E0] text-base leading-relaxed pt-2">
                            This will remove <strong className="text-white">{confirmUser?.name}</strong> from the project. They will no longer be able to contribute.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-4 sm:justify-center mt-6 w-full">
                        <AlertDialogCancel className="w-full sm:w-[180px] PY-1 rounded-full border border-white/20 bg-transparent hover:bg-white/5 hover:text-white text-white transition-colors uppercase tracking-wide text-sm font-semibold">
                        Cancel
                      </AlertDialogCancel>
                        <Button
                            className="bg-[#BE0000] text-white hover:bg-[#B71C1C] px-5 py-1 text-sm font-medium rounded-full border-none transition-all disabled:opacity-50 min-w-[160px] cursor-pointer"
                            onClick={() => confirmUser && handleRemove(confirmUser.id, confirmUser.name)}
                            disabled={loading}
                        >
                            {loading ? "Removing..." : 'Yes, remove'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function initials(name?: string) {
    if (!name) return "U?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}


