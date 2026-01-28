import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProject } from "@/redux/action/project";
import useAppDispatch from "@/hook/useDispatch";
import { toast } from "sonner";
import useAuth from "@/hook/useAuth";

// ShadCN UI & Icons
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Pencil, Loader2 } from "lucide-react";

// Formik and Yup for validation
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading } = useSelector((state: any) => state.projects);

  // Form state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Validation Schema
  const validationSchema = Yup.object({
    title: Yup.string()
      .required("Project title is required")
      .min(5, "Title must be at least 5 characters")
      .max(20, "Title cannot exceed 20 characters")
      .matches(/^[a-zA-Z0-9 ]*$/, "Title must not contain special characters"),
    description: Yup.string()
      .required("Description is required")
      .test("wordCount", "Description must be no more than 50 words", (value: any) => {
        if (value) {
          return value.trim().split(/\s+/).length <= 50;
        }
        return true; 
      }),
    canvasId: Yup.string().required("Canvas ID is required"),
    thumbnail: Yup.mixed().required("Thumbnail image is required")
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: any) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setFieldValue("thumbnail", file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: any) => {
    const projectFormData = new FormData();
    projectFormData.append("title", values.title);
    projectFormData.append("description", values.description);
    projectFormData.append("canvasId", values.canvasId);
    projectFormData.append("width", String(1024)); // Default width
    projectFormData.append("height", String(1024)); // Default height
    projectFormData.append("userId", String(user?._id));

    if (thumbnailFile) {
      projectFormData.append("thumbnail", thumbnailFile);
    }

    const resultAction = await dispatch(createProject(projectFormData));

    if (createProject.fulfilled.match(resultAction)) {
      const newProject = resultAction.payload;
      toast.success("Project created successfully.");
      navigate(`/project/${newProject.canvasId}`);
    } else {
      console.error("Failed to create project");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0F0D0D] text-white flex overflow-y-auto font-montserrat">
      <div className="w-full max-w-7xl relative m-auto p-4 md:p-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-[34px] !text-white font-semibold mb-2">Create a new Project</h1>
                <p className="text-white text-sm lg:text-base">Fill in the details to launch a new collaborative canvas</p>
            </div>
            <button 
                onClick={() => navigate('/projects')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
                <X className="w-6 h-6 text-gray-400" />
            </button>
        </div>

        <Formik
          initialValues={{
            title: "",
            description: "",
            canvasId: "",
            thumbnail: null,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue, values }) => (
            <Form className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              
              {/* Left Column - Project Cover */}
              <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <label className="text-sm lg:text-base font-semibold !text-white">Project Cover</label>
                
                <div className="relative w-full aspect-video bg-[#2E2E2E] rounded-xl overflow-hidden border border-white/10 group">
                    {thumbnailPreview ? (
                        <img 
                            src={thumbnailPreview} 
                            alt="Project Cover" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white text-sm">
                            No cover image selected
                        </div>
                    )}
                    
                    {/* Hidden File Input */}
                    <input
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleThumbnailChange(e, setFieldValue)}
                        className="hidden"
                    />
                </div>

                <label 
                    htmlFor="thumbnail-upload"
                    className="flex items-center gap-2 text-[#E23373] text-sm lg:text-base font-semibold cursor-pointer hover:underline w-fit"
                >
                    <Pencil className="w-4 h-4" />
                    Edit Cover Image
                </label>
                <ErrorMessage name="thumbnail" component="div" className="text-red-500 text-sm" />
              </div>

              {/* Right Column - Form Fields */}
              <div className="w-full lg:w-1/2 flex flex-col gap-4">
                 
                 <div className="space-y-4">
                     <h3 className="text-sm lg:text-base font-semibold !text-white">Project Information</h3>
                     
                     <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs text-white font-semibold">Project Title <span className="text-[#AAB2C7]">(required)</span> </Label>
                        <Field
                            id="title"
                            name="title"
                            className="w-full bg-[#2E2E2E] border-none rounded-lg p-3 text-white placeholder:text-[#AAB2C7] focus:ring-1 focus:ring-white/20 h-12"
                            placeholder="Enter your Project Title"
                            onChange={(e: any) => {
                                const title = e.target.value;
                                setFieldValue("title", title);
                                setFieldValue("canvasId", title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                            }}
                        />
                        <ErrorMessage name="title" component="div" className="text-red-500 text-xs" />
                     </div>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm lg:text-base font-semibold text-white">Description</Label>
                    <Field
                        as="textarea"
                        id="description"
                        name="description"
                        className="w-full !bg-[#2E2E2E] !border-none rounded-lg p-3 text-white placeholder:text-[#AAB2C7] focus:!ring-1 focus:!ring-white/20 min-h-[100px] resize-none"
                        placeholder="A Short description of the project's theme"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-xs" />
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="canvasId" className="text-sm lg:text-base font-semibold text-white">Canvas ID</Label>
                    <Field
                        id="canvasId"
                        name="canvasId"
                        disabled
                        className="w-full bg-[#2E2E2E] border-none rounded-lg p-3 text-gray-400 h-12 cursor-not-allowed"
                        placeholder="auto-generated-id"
                    />
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-end items-center gap-4 mt-8 pt-4">
                    <Button 
                        type="button"
                        onClick={() => navigate('/projects')}
                        className="px-8 py-2.5 rounded-full border border-gray-600 bg-transparent text-white hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit"
                        disabled={loading.creating}
                        className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white font-semibold border-none hover:opacity-90 transition-opacity"
                    >
                        {loading.creating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : "Create project"}
                    </Button>
                 </div>

              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AdminDashboard;
