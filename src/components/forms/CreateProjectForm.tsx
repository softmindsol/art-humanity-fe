// src/pages/AdminDashboard.js

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProject } from '@/redux/action/project';

// ShadCN UI & Icons
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'; // Icons
import useAppDispatch from '@/hook/useDispatch';
import { toast } from 'sonner';
import useAuth from '@/hook/useAuth';

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth()
  const { loading, error } = useSelector((state: any) => state.projects);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    canvasId: '',
    width: 1024,
    height: 1024,
    userId: user?.id || '', // Automatically set user ID from auth context
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Automatically create a URL-friendly canvasId from the title
    if (e.target.name === 'title') {
      const canvasId = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
        .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
      setFormData({ ...formData, title: e.target.value, canvasId: canvasId });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const projectFormData = new FormData();
    projectFormData.append('title', formData.title);
    projectFormData.append('description', formData.description);
    projectFormData.append('canvasId', formData.canvasId);
    projectFormData.append('width', String(formData.width));
    projectFormData.append('height', String(formData.height));
    projectFormData.append('userId', String(formData.userId));

    if (thumbnailFile) {
      projectFormData.append('thumbnail', thumbnailFile);
    }
    const resultAction = await dispatch(createProject( projectFormData));

    if (createProject.fulfilled.match(resultAction)) {
      const newProject = resultAction.payload;
      toast.success('Project created successfully!');
      navigate(`/project/${newProject.canvasId}`); // Navigate with canvasId for a clean URL
    } else {
      toast.error('Failed to create project. Please try again.');
      console.error('Failed to create project:', resultAction.error.message);
    }
  };

  return (
    <div className="min-h-screen font-serif p-4 md:px-5">
      <div className="container mx-auto">
        {/* Header with Back Button */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-[#5d4037]">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => navigate(-1)} className="bg-white/50 border-[#bcaaa4] hover:bg-white cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </header>

        <Card className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm border-2 border-white/30 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-normal text-[#3e2723] flex items-center text-center gap-3">
              <Sparkles className="w-6 h-6 text-[#d4af37]" />
              Create a New Project
            </CardTitle>
            <CardDescription className="text-[#8d6e63] ">
              Fill in the details to launch a new collaborative canvas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-medium text-[#5d4037]">Project Title <span className="text-red-500">*</span></Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Spring Community Mural" className="h-12" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-lg font-medium text-[#5d4037]">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="A short description of the project's theme..." />
              </div>

              {/* Canvas ID */}
              <div className="space-y-2">
                <Label htmlFor="canvasId" className="text-lg font-medium text-[#5d4037]">Canvas ID (Unique URL) <span className="text-red-500">*</span></Label>
                <Input id="canvasId" name="canvasId" value={formData.canvasId} onChange={handleChange} required placeholder="auto-generated-from-title" />
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width" className="font-medium text-[#5d4037]">Width (px)</Label>
                  <Input id="width" name="width" type="number" value={formData.width} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="font-medium text-[#5d4037]">Height (px)</Label>
                  <Input id="height" name="height" type="number" value={formData.height} onChange={handleChange} required />
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-lg font-medium text-[#5d4037]">Thumbnail Image <span className="text-red-500">*</span></Label>
                <Input id="thumbnail" name="thumbnail" type="file" onChange={handleFileChange} required accept="image/png, image/jpeg" />
                {thumbnailFile && <p className="text-sm text-gray-500 mt-2">Selected: {thumbnailFile.name}</p>}
              </div>

              <Button type="submit" disabled={loading.creating} className="w-full h-12 text-lg cursor-pointer text-white bg-[#5d4037] hover:bg-[#4e342e]">
                {loading.creating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>

              {error.creating && <p className="text-sm text-red-600 text-center font-semibold">{error.creating}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;