import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, XCircle, Edit } from 'lucide-react';
import { updateProjectStatus } from '@/redux/action/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import useAppDispatch from '@/hook/useDispatch';

export const ProjectList = ({ projects }: any) => {
    const dispatch = useAppDispatch();

    const handleStatusUpdate = (projectId: any, statusUpdate: any) => {
        if (confirm(`Are you sure you want to update this project?`)) {
            dispatch(updateProjectStatus({ projectId, statusUpdate }));
        }
    };
 
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Manage Projects</CardTitle>
                <CardDescription>View, pause, or close active projects.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Canvas ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map((project: any) => (
                            <TableRow key={project._id}>
                                <TableCell className="font-medium">{project.title}</TableCell>
                                <TableCell>{project.canvasId}</TableCell>
                                <TableCell>
                                    {project.isPaused ? (
                                        <Badge variant="destructive">Paused</Badge>
                                    ) : (
                                        <Badge className="bg-green-500">Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {project.isPaused ? (
                                        <Button variant="outline" size="icon" onClick={() => handleStatusUpdate(project._id, { isPaused: false })}>
                                            <Play className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="icon" onClick={() => handleStatusUpdate(project._id, { isPaused: true })}>
                                            <Pause className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="destructive" size="icon" onClick={() => handleStatusUpdate(project._id, { isClosed: true })}>
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};