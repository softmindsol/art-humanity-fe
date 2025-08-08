import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Palette, Image, Monitor, Sparkles, Upload, Eye, X } from 'lucide-react';

// Define the shape of the props the component expects
interface CreateProjectFormProps {
  onProjectCreated: (projectData: any) => void;
}

const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onProjectCreated }) => {
  // --- ID GENERATION & INITIALIZATION ---
  // Helper functions to generate unique IDs
  const generateProjectId = () => `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateCanvasId = () => `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // State to hold the generated IDs. They are created once when the component mounts.
  const [projectId] = useState(generateProjectId());
  const [canvasId] = useState(generateCanvasId());

  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    projectId,
    canvasId,
    title: '',
    description: '',
    width: 1024,
    height: 1024,
    palette: '',
    thumbnailUrl: '',
    baseImageUrl: '',
    targetCompletionDate: '',
    createdAt: new Date().toISOString()
  });

  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
 
  // Refs for triggering file inputs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const baseImageInputRef = useRef<HTMLInputElement>(null);

  // --- EVENT HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError('');
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file); // For local preview
      setFormData(prev => ({
        ...prev,
        [e.target.name]: fakeUrl
      }));
    }
  };

  const handleColorAdd = (color: string) => {
    if (color && !colorPalette.includes(color)) {
      const newPalette = [...colorPalette, color];
      setColorPalette(newPalette);
      setFormData(prev => ({ ...prev, palette: newPalette.join(', ') }));
    }
  };

  const removeColor = (colorToRemove: string) => {
    const newPalette = colorPalette.filter((color) => color !== colorToRemove);
    setColorPalette(newPalette);
    setFormData(prev => ({ ...prev, palette: newPalette.join(', ') }));
  };

  // --- NAVIGATION & SUBMISSION ---
  const handleNextStep = () => {
    if (currentStep === 1 && !formData.title.trim()) {
      setError('Project Title is required.');
      return;
    }
    if (currentStep === 2 && (!formData.width || !formData.height)) {
      setError('Canvas width and height are required.');
      return;
    }
    setError('');
    setCurrentStep(s => s + 1);
  };

  const handlePreviousStep = () => {
    setError('');
    setCurrentStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!formData.thumbnailUrl) {
      setError('A thumbnail image is required.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      // Create the final project data object
      const projectData = {
        ...formData,
        colorPalette: colorPalette.length > 0 ? colorPalette : [], // Use the array of colors
        updatedAt: new Date().toISOString()
      };

      console.log("Submitting Project Data:", projectData);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call parent callback with the complete project data
      if (onProjectCreated) {
        onProjectCreated(projectData);
      }

      console.log("Form submission complete. Parent will handle redirection.");

    } catch (err) {
      setError('Failed to create project. Please try again.');
      console.error('Project creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PRESET DATA ---
  const presetCanvasSizes = [
    { name: 'Default Square', width: 1024, height: 1024 },
    { name: 'Landscape', width: 1024, height: 768 },
    { name: 'Portrait', width: 768, height: 1024 },
    { name: 'Wide Banner', width: 1920, height: 1080 },
  ];

  const popularColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];

  // --- JSX RENDER ---
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#d4af37] to-[#5d4037] rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#3e2723] mb-2">Create New Project</h1>
          <p className="text-[#8d6e63] text-lg">Collaborative Canvases of Human Expression</p>
          <div className="mt-4 text-sm text-[#8d6e63]">
            <div>Project ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{projectId}</code></div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step ? 'bg-gradient-to-r from-[#d4af37] to-[#5d4037] text-white shadow-lg' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                  {step}
                </div>
                {step < 3 && <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${currentStep > step ? 'bg-gradient-to-r from-[#d4af37] to-[#5d4037]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="space-y-8">
            {error && <div className="p-3 text-center text-red-800 bg-red-100 border border-red-300 rounded-lg">{error}</div>}

            <div className={`${currentStep === 1 ? 'block' : 'hidden'}`}>
              <div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div><h2 className="text-2xl font-bold text-[#3e2723] mt-2">Project Details</h2></div>
              <div className="group space-y-6">
                <div><Label htmlFor="title" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><span>Project Title</span><span className="text-red-500">*</span></Label><Input id="title" name="title" value={formData.title} onChange={handleChange} className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 bg-white/50 backdrop-blur-sm" placeholder="Enter your project title..." required /></div>
                <div><Label htmlFor="description" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><span>Description</span></Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="min-h-32 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 resize-none bg-white/50 backdrop-blur-sm" placeholder="Describe your artistic vision..." /></div>
              </div>
            </div>

            <div className={`${currentStep === 2 ? 'block' : 'hidden'}`}>
              <div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center"><Monitor className="w-5 h-5 text-white" /></div><h2 className="text-2xl font-bold text-[#3e2723]  mt-2">Canvas & Design</h2></div>
              <div className="space-y-6">
                <div>
                  <Label className="text-[#5d4037] font-medium mb-3 block ">Quick Canvas Sizes</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">{presetCanvasSizes.map((preset) => (<button key={preset.name} type="button" onClick={() => setFormData(prev => ({ ...prev, width: preset.width, height: preset.height }))} className="p-3 text-sm border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-300 bg-white/70 backdrop-blur-sm"><div className="font-medium">{preset.name}</div><div className="text-gray-500 text-xs">{preset.width} × {preset.height}</div></button>))}</div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><Label htmlFor="width" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><Monitor className="w-4 h-4" /><span>Canvas Width (px)</span><span className="text-red-500">*</span></Label><Input id="width" type="number" name="width" value={formData.width} onChange={handleChange} className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200" required /></div>
                  <div><Label htmlFor="height" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><Monitor className="w-4 h-4" /><span>Canvas Height (px)</span><span className="text-red-500">*</span></Label><Input id="height" type="number" name="height" value={formData.height} onChange={handleChange} className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200" required /></div>
                </div>
                <div>
                  <Label className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><Palette className="w-4 h-4" /><span>Color Palette</span></Label>
                  <div className="mb-4"><p className="text-sm text-[#8d6e63] mb-2">Popular Colors:</p><div className="flex flex-wrap gap-2">{popularColors.map((color) => (<button key={color} type="button" onClick={() => handleColorAdd(color)} className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: color }} title={color} />))}</div></div>
                  {colorPalette.length > 0 && (<div className="mb-4"><p className="text-sm text-[#8d6e63] mb-2">Selected Colors:</p><div className="flex flex-wrap gap-2">{colorPalette.map((color, index) => (<div key={index} className="relative group"><div className="w-10 h-10 rounded-lg border-2 border-white shadow-md" style={{ backgroundColor: color }} /><button type="button" onClick={() => removeColor(color)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button></div>))}</div></div>)}
                  <Input type="color" onChange={(e) => handleColorAdd(e.target.value)} className="w-16 h-12 border-2 border-gray-200 rounded-xl cursor-pointer p-1" title="Pick a custom color" />
                </div>
              </div>
            </div>

            <div className={`${currentStep === 3 ? 'block' : 'hidden'}`}>
              <div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center"><Image className="w-5 h-5 text-white" /></div><h2 className="text-2xl font-bold text-[#3e2723] mt-2">Media & Timeline</h2></div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="thumbnailUrl" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><Eye className="w-4 h-4" /><span>Thumbnail Image</span><span className="text-red-500">*</span></Label>
                  <div className="flex space-x-3"><Input id="thumbnailUrl" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} className="h-12 border-2 border-gray-200 rounded-xl" placeholder="https://... or upload" required /><input type="file" ref={thumbnailInputRef} name="thumbnailUrl" onChange={handleFileChange} className="hidden" accept="image/*" /><Button type="button" variant="outline" onClick={() => thumbnailInputRef.current?.click()} className="h-12 px-4 border-2 border-gray-200 rounded-xl"><Upload className="w-4 h-4 mr-2" /> Upload</Button></div>
                  {formData.thumbnailUrl.startsWith('blob:') && <img src={formData.thumbnailUrl} alt="Thumbnail Preview" className="mt-4 rounded-lg max-h-40" />}
                </div>
                <div>
                  <Label htmlFor="baseImageUrl" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><Image className="w-4 h-4" /><span>Base Image (optional)</span></Label>
                  <div className="flex space-x-3"><Input id="baseImageUrl" name="baseImageUrl" value={formData.baseImageUrl} onChange={handleChange} className="h-12 border-2 border-gray-200 rounded-xl" placeholder="https://... or upload" /><input type="file" ref={baseImageInputRef} name="baseImageUrl" onChange={handleFileChange} className="hidden" accept="image/*" /><Button type="button" variant="outline" onClick={() => baseImageInputRef.current?.click()} className="h-12 px-4 border-2 border-gray-200 rounded-xl"><Upload className="w-4 h-4 mr-2" /> Upload</Button></div>
                  {formData.baseImageUrl.startsWith('blob:') && <img src={formData.baseImageUrl} alt="Base Image Preview" className="mt-4 rounded-lg max-h-40" />}
                </div>
                <div>
                  <Label htmlFor="targetCompletionDate" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3"><Calendar className="w-4 h-4" /><span>Target Completion Date</span></Label>
                  <Input id="targetCompletionDate" type="date" name="targetCompletionDate" value={formData.targetCompletionDate} onChange={handleChange} className="h-12 border-2 border-gray-200 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={currentStep === 1} className="h-12 px-8 border-2 border-gray-200 rounded-xl disabled:opacity-50">Previous</Button>
              <div className="flex space-x-4">
                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNextStep} className="h-12 px-8 bg-gradient-to-r from-[#d4af37] to-[#5d4037] text-white rounded-xl shadow-lg">Next</Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="h-12 px-8 bg-gradient-to-r from-[#3e2723] to-[#5d4037] text-white rounded-xl shadow-lg disabled:opacity-70">{isSubmitting ? (<div className="flex items-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Creating...</div>) : (<div className="flex items-center"><Sparkles className="w-4 h-4 mr-2" />Create Project</div>)}</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectForm;