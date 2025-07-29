import  { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Palette, Image, Monitor, Sparkles, Upload, Eye, X } from 'lucide-react';

const CreateProjectForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    width: 1000,
    height: 1000,
    palette: '',
    thumbnailUrl: '',
    baseImageUrl: '',
    targetCompletionDate: ''
  });

  const [previewVisible, setPreviewVisible] = useState(false);
  const [colorPalette, setColorPalette] = useState<any>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleColorAdd = (color:any) => {
    if (color && !colorPalette.includes(color)) {
      const newPalette = [...colorPalette, color];
      setColorPalette(newPalette);
      setFormData(prev => ({
        ...prev,
        palette: newPalette.join(', ')
      }));
    }
  };

  const removeColor = (colorToRemove:any) => {
    const newPalette = colorPalette.filter((color:any) => color !== colorToRemove);
    setColorPalette(newPalette);
    setFormData(prev => ({
      ...prev,
      palette: newPalette.join(', ')
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Submit to backend:', formData);
    setIsSubmitting(false);
    // TODO: call POST /api/projects
  };

  const presetCanvasSizes = [
    { name: 'Square Canvas', width: 1000, height: 1000 },
    { name: 'Landscape', width: 1200, height: 800 },
    { name: 'Portrait', width: 800, height: 1200 },
    { name: 'Wide Banner', width: 1920, height: 600 },
  ];

  const popularColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];

  return (
    <div className="min-h-screen ">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#d4af37] to-[#5d4037] rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#3e2723] mb-2">Create New Project</h1>
          <p className="text-[#8d6e63] text-lg">Collaborative Canvases of Human Expression</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#5d4037]  text-white shadow-lg'
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${currentStep > step ? 'bg-gradient-to-r from-[#d4af37] to-[#5d4037] ' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 z-0" style={{zIndex:'unset'}}>
          <div className="space-y-8">

            {/* Step 1: Basic Info */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 1 ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <div className="flex items-center  space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#3e2723] mt-2">Project Details</h2>
              </div>

              <div className="group">
                <Label htmlFor="title" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                  <span>Project Title</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  placeholder="Enter your project title..."
                  required
                />
              </div>

              <div className="group">
                <Label htmlFor="description" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                  <span>Description</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-32 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 resize-none bg-white/50 backdrop-blur-sm"
                  placeholder="Describe your artistic vision..."
                />
              </div>
            </div>

            {/* Step 2: Canvas & Design */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 2 ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#3e2723]  mt-2">Canvas & Design</h2>
              </div>

              {/* Canvas Size Presets */}
              <div>
                <Label className="text-[#5d4037] font-medium mb-3 block ">Quick Canvas Sizes</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {presetCanvasSizes.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, width: preset.width, height: preset.height }))}
                      className="p-3 text-sm border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-gray-500 text-xs">{preset.width} × {preset.height}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Canvas Size */}
              <div className="grid grid-cols-2 gap-6">
                <div className="group">
                  <Label htmlFor="width" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                    <Monitor className="w-4 h-4" />
                    <span>Canvas Width (px)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleChange}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="group">
                  <Label htmlFor="height" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                    <Monitor className="w-4 h-4" />
                    <span>Canvas Height (px)</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <Label className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                  <Palette className="w-4 h-4" />
                  <span>Color Palette</span>
                </Label>

                {/* Popular Colors */}
                <div className="mb-4">
                  <p className="text-sm text-[#8d6e63] mb-2">Popular Colors:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorAdd(color)}
                        className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Selected Colors */}
                {colorPalette.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-[#8d6e63] mb-2">Selected Colors:</p>
                    <div className="flex flex-wrap gap-2">
                      {colorPalette.map((color: any, index: any) => (
                        <div key={index} className="relative group">
                          <div
                            className="w-10 h-10 rounded-lg border-2 border-white shadow-md"
                            style={{ backgroundColor: color }}
                          />
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  type="color"
                  onChange={(e) => handleColorAdd(e.target.value)}
                  className="w-16 h-12 border-2 border-gray-200 rounded-xl cursor-pointer"
                  title="Pick a custom color"
                />
              </div>
            </div>

            {/* Step 3: Media & Timeline */}
            <div className={`space-y-6 transition-all duration-500 ${currentStep === 3 ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#3e2723]  mt-2">Media & Timeline</h2>
              </div>

              <div className="group">
                <Label htmlFor="thumbnailUrl" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                  <Eye className="w-4 h-4" />
                  <span>Thumbnail URL</span>
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex space-x-3">
                  <Input
                    id="thumbnailUrl"
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleChange}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="https://example.com/thumbnail.jpg"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-300"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="group">
                <Label htmlFor="baseImageUrl" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                  <Image className="w-4 h-4" />
                  <span>Base Image URL (optional)</span>
                </Label>
                <div className="flex space-x-3">
                  <Input
                    id="baseImageUrl"
                    name="baseImageUrl"
                    value={formData.baseImageUrl}
                    onChange={handleChange}
                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="https://example.com/base-image.jpg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-300"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="group">
                <Label htmlFor="targetCompletionDate" className="text-[#5d4037] font-medium flex items-center space-x-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Target Completion Date</span>
                </Label>
                <Input
                  id="targetCompletionDate"
                  type="date"
                  name="targetCompletionDate"
                  value={formData.targetCompletionDate}
                  onChange={handleChange}
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="h-12 px-8 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-300 disabled:opacity-50"
              >
                Previous
              </Button>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewVisible(!previewVisible)}
                  className="h-12 px-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewVisible ? 'Hide Preview' : 'Preview'}
                </Button>

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    className="h-12 px-8 bg-gradient-to-r from-[#d4af37] to-[#5d4037]  hover:from-[#d4af37] hover:to-[#212121] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                      className="h-12 px-8 bg-gradient-to-r from-[#3e2723] to-[#5d4037] cursor-pointer hover:opacity-75 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Project
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {previewVisible && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-[#3e2723] mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Project Preview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Title:</strong> {formData.title || 'Untitled Project'}</div>
                <div><strong>Canvas Size:</strong> {formData.width} × {formData.height}px</div>
                <div><strong>Colors:</strong> {colorPalette.length} selected</div>
                <div><strong>Target Date:</strong> {formData.targetCompletionDate || 'Not set'}</div>
              </div>
              {formData.description && (
                <div className="mt-3">
                  <strong>Description:</strong> {formData.description}
                </div>
              )}
              {colorPalette.length > 0 && (
                <div className="mt-3">
                  <strong>Color Palette:</strong>
                  <div className="flex gap-2 mt-2">
                    {colorPalette.map((color: any, index: any) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      
      </div>
    </div>
  );
};

export default CreateProjectForm;