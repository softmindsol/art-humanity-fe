import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createProject } from "@/redux/action/project";
import  useAppDispatch  from "@/hook/useDispatch";
import { toast } from "sonner";
import useAuth from "@/hook/useAuth";

// ShadCN UI & Icons
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"; // Icons

// Formik and Yup for validation
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error } = useSelector((state: any) => state.projects);

  // Form state and thumbnail file state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Validation Schema for Formik (using Yup)
  const validationSchema = Yup.object({
    title: Yup.string().required("Project title is required"),
    description: Yup.string()
      .required("Description is required")
      .test("wordCount", "Description must be no more than 50 words", (value: any) => {
        if (value) {
          const wordCount = value.trim().split(/\s+/).length; // Split by spaces and count words
          return wordCount <= 50; // Validate that word count is 50 or fewer
        }
        return true; // Allow empty field, since it's already validated by `.required()`
      }),    canvasId: Yup.string().required("Canvas ID is required"),
    width: Yup.number().required("Width is required").min(1, "Width must be a positive number"),
    height: Yup.number().required("Height is required").min(1, "Height must be a positive number"),
    thumbnail: Yup.mixed()
      .required("Thumbnail image is required")
      .test("fileType", "Invalid type (only PNG, JPEG, etc.)", (value: any) => {
        return value && (value.type === "image/jpeg" || value.type === "image/png");
      }),
  });

  // Form submission handler
  const handleSubmit = async (values: any) => {
    const projectFormData = new FormData();
    projectFormData.append("title", values.title);
    projectFormData.append("description", values.description);
    projectFormData.append("canvasId", values.canvasId);
    projectFormData.append("width", String(values.width));
    projectFormData.append("height", String(values.height));
    projectFormData.append("userId", String(user?.id));

    if (thumbnailFile) {
      projectFormData.append("thumbnail", thumbnailFile);
    }

    const resultAction = await dispatch(createProject(projectFormData));

    if (createProject.fulfilled.match(resultAction)) {
      const newProject = resultAction.payload;
      toast.success("Project created successfully!");
      navigate(`/project/${newProject.canvasId}`); // Navigate with canvasId for a clean URL
    } else {
      // toast.error("Failed to create project. Please try again.");
      console.error("Failed to create project:", resultAction.error.message);
    }
  };

  return (
    <div className="min-h-screen font-serif p-4 md:px-5">
      <div className="container mx-auto">
        {/* Header with Back Button */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-[#5d4037]">Admin Dashboard</h1>
          <Button variant="outline" onClick={() => navigate("/projects")} className="bg-white/50 border-[#bcaaa4] hover:bg-white cursor-pointer text-[#3e2723]">
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
            {/* Formik form */}
            <Formik
              initialValues={{
                title: "",
                description: "",
                canvasId: "",
                width: 1024,
                height: 1024,
                userId: user?.id || "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ setFieldValue, values }) => {
                // Automatically sync canvasId with title
                const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const title = e.target.value;
                  setFieldValue("title", title);
                  setFieldValue("canvasId", title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                };

                return (
                  <Form className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-lg font-medium text-[#5d4037]">Project Title <span className="text-red-500">*</span></Label>
                      <Field
                        id="title"
                        name="title"
                        value={values.title}
                        onChange={handleTitleChange}  // Automatically update canvasId
                        placeholder="e.g., Spring Community Mural"
                        className="h-12"
                        as={Input}
                      />
                      <ErrorMessage name="title" component="div" className="text-red-500 text-sm" />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-lg font-medium text-[#5d4037]">Description</Label>
                      <Field
                        id="description"
                        name="description"
                        as={Textarea}
                        placeholder="A short description of the project's theme..."
                        rows={4}
                      />
                      <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
                    </div>

                    {/* Canvas ID */}
                    <div className="space-y-2">
                      <Label htmlFor="canvasId" className="text-lg font-medium text-[#5d4037]">Canvas ID (Unique URL) <span className="text-red-500">*</span></Label>
                      <Field
                        id="canvasId"
                        name="canvasId"
                        value={values.canvasId}
                        placeholder="auto-generated-from-title"
                        className="h-12"
                        as={Input}
                        disabled
                      />
                      <ErrorMessage name="canvasId" component="div" className="text-red-500 text-sm" />
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width" className="font-medium text-[#5d4037]">Width (px)</Label>
                        <Field
                          id="width"
                          name="width"
                          type="number"
                          value={values.width}
                          placeholder="Width"
                          className="h-12"
                          as={Input}
                        />
                        <ErrorMessage name="width" component="div" className="text-red-500 text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="font-medium text-[#5d4037]">Height (px)</Label>
                        <Field
                          id="height"
                          name="height"
                          type="number"
                          value={values.height}
                          placeholder="Height"
                          className="h-12"
                          as={Input}
                        />
                        <ErrorMessage name="height" component="div" className="text-red-500 text-sm" />
                      </div>
                    </div>

                    {/* Thumbnail Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail" className="text-lg font-medium text-[#5d4037]">Thumbnail Image <span className="text-red-500">*</span></Label>

                      {/* Custom File Upload Button */}
                      <label
                        htmlFor="thumbnail"
                        className="cursor-pointer inline-block bg-[#5d4037] hover:bg-[#4e342e] text-white py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out text-center">
                        Choose Thumbnail
                      </label>

                      <input
                        id="thumbnail"
                        name="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            setThumbnailFile(e.target.files[0]);
                            setFieldValue("thumbnail", e.target.files[0]);
                          }
                        }}
                        className="hidden" // Hide the default file input
                      />

                      {/* Error Message */}
                      <ErrorMessage name="thumbnail" component="div" className="text-red-500 text-sm" />

                      {/* Display Selected File Name */}
                      {thumbnailFile && (
                        <p className="text-sm text-gray-500 mt-2">Selected: {thumbnailFile.name}</p>
                      )}
                    </div>


                    <Button type="submit" disabled={loading.creating} className="w-full h-12 text-lg cursor-pointer text-white bg-[#5d4037] hover:bg-[#4e342e]">
                      {loading.creating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Project"
                      )}
                    </Button>

                    {error.creating && <p className="text-sm text-red-600 text-center font-semibold">{error.creating}</p>}
                  </Form>
                );
              }}
            </Formik>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
