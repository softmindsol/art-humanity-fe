import { useEffect, useMemo, useState } from "react";
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


export default function ContributorsDropdown({ currentProject, loading, setLoading, ref }: any) {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    // --- STEP 1: Nayi state banayein jo search text ko store karegi ---
    const [searchValue, setSearchValue] = useState("");

    const contributors = useSelector(selectProjectContributors) as Array<{
        _id?: string;
        fullName?: string;
        email?: string;
    }> | string[];

    const isLoading = useSelector((state: RootState) => state.projects.loading.contributors);
    const [confirmUser, setConfirmUser] = useState<{ id: string; name: string } | null>(null);
    const ownerId = currentProject?.ownerId;


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
        let users = (normalized || []).filter((user: any) => user.id !== ownerId);

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
                    userId: user?.id,
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
        <div className="flex items-center gap-2 mb-5">
            <DropdownMenu>
                {/* <span className="!font-semibold text-[#654321]">Contributors:</span> */}
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                            <Users2 className="h-8 w-12" />
                            <span className="text-[16px]">Contributors</span>
                            <span className="rounded bg-muted  py-0.5 text-sm">({count})</span>
                        </div>

                        <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="bg-[#f8f0e3] w-80 border-2 border-[#f8f0e3] text-[#] font-[Georgia, serif]"
                    align="start"
                    sideOffset={8}
                    ref={ref} // <-- REF AB YAHAN HAI

                >
                    <DropdownMenuSeparator />

                    {isLoading ? (
                        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading contributors…
                        </div>
                    ) : (
                        <Command shouldFilter={false} >
                                <CommandInput placeholder="Search contributors…" value={searchValue} // Input ki value ko state se jorein
                                    onValueChange={setSearchValue} />
                            {filteredUsers.length === 0 ? (
                                <CommandEmpty className="py-8 text-muted-foreground text-center">No contributors yet.</CommandEmpty>
                            ) : (
                                <CommandGroup className="p-0">
                                    <div className="overflow-y-auto max-h-64">
                                        {/* The list of contributors will scroll when the height exceeds max-h-72 */}
                                        {filteredUsers.map((c) => {
                                            const isSelf = c.id && user?.id && c.id === user.id;
                                            return (
                                                <CommandItem key={c.id || c.name} className="flex w-full items-center justify-between gap-2 px-3 py-2">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="text-xs">
                                                                {initials(c.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{c.name}</div>
                                                            <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                                                <Mail className="h-3.5 w-3.5" />
                                                                <span className="truncate">{c.email || "—"}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                                                        disabled={!c.id || isSelf}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (c.id) setConfirmUser({ id: c.id, name: c.name });
                                                        }}
                                                        title={isSelf ? "You can't remove yourself" : `Remove ${c.name}`}
                                                    >
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
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Confirm Remove Dialog */}
            <AlertDialog open={!!confirmUser} onOpenChange={(o) => !o && setConfirmUser(null)}>
                <AlertDialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl !text-white text-center">Remove contributor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <strong>{confirmUser?.name}</strong> from the project. They will no longer be able to contribute.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                        <Button
                            className="cursor-pointer border-white bg-[#8b795e] text-white hover:bg-[#a1887f] disabled:opacity-50"
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


