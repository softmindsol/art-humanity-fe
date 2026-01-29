import React from "react";
import { Link } from "react-router-dom";
import { Pencil, Grid3X3, Trash2 } from "lucide-react";

interface ProjectCardProps {
  imageSrc: string;
  title: string;
  progress: number;
  contributors: number;
  pixelsPainted: number;
  isActive?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  imageSrc,
  title,
  progress,
  contributors,
  pixelsPainted,
  isActive = true,
}) => {
  return (
    <div className="bg-[#1A1A1A] rounded-[8.03px] border border-white/10 overflow-hidden flex flex-col p-2.5 bg-[#2E2E2E]">
      {/* Image with Badge */}
      <div className="relative">
        <img
          src={imageSrc}
          alt={title}
          className="w-full aspect-[4/3] object-cover rounded-[8.03px]"
        />
        {isActive && (
          <span className="absolute top-3 right-3 px-4 py-1 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] !text-white text-xs font-semibold">
            Active
          </span>
        )}
      </div>

      {/* Content */}
      <div className="py-3  flex flex-col gap-2  ">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E23373] rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="!text-white text-xs">{progress}% Complete</span>
        </div>

        {/* Title and Actions */}
        <div className="flex items-center justify-between">
          <h3 className="!text-white text-sm lg:text-lg font-semibold">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center !text-white hover:!text-white hover:bg-white/20 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center !text-white hover:!text-white hover:bg-white/20 transition-colors">
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#BE0000] flex items-center justify-center !text-white hover:bg-red-600 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="!text-[#AAB2C7] text-xs mb-1">Contributor</p>
            <p className="!text-white lg:text-lg font-semibold">
              {contributors}
            </p>
          </div>
          <div className="text-center">
            <p className="!text-[#AAB2C7] text-xs mb-1">Pixel Painted</p>
            <p className="!text-white lg:text-lg font-semibold">
              {pixelsPainted.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-2">
          <button className="w-full py-3 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] !text-white font-semibold text-[11px] hover:opacity-90 transition-opacity">
            View Artwork
          </button>
          <div className="w-full p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133]">
            <button className="w-full py-3 rounded-full bg-[#1A1A1A] !text-white font-semibold text-[11px] hover:opacity-80 transition-opacity">
              Mark as Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeaturedArtworkProps {
  imageSrc: string;
  artistType: string;
  title: string;
  description: string;
}

const FeaturedArtwork: React.FC<FeaturedArtworkProps> = ({
  imageSrc,
  artistType,
  title,
  description,
}) => {
  return (
    <div className="flex flex-col gap-4 ">
      {/* Image */}
      <div className="rounded-2xl overflow-hidden">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-[401px] object-cover"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <span className="!text-[#AAB2C7] text-sm font-medium lg:text-base">
          {artistType}
        </span>
        <h3 className="!text-white text-[36px] font-semibold">{title}</h3>
        <p className="!text-white text-sm lg:text-base font-semibold leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

const ActiveProjectsSection: React.FC = () => {
  const projects = [
    {
      imageSrc:
        "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=2044&auto=format&fit=crop",
      title: "Building Test",
      progress: 15,
      contributors: 4,
      pixelsPainted: 11014,
    },
    {
      imageSrc:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1984&auto=format&fit=crop",
      title: "Building Test",
      progress: 15,
      contributors: 4,
      pixelsPainted: 11014,
    },
  ];

  const featuredArtwork = {
    imageSrc: "/assets/artistic-gem.svg",
    artistType: "Individual Artist",
    title: "Artistic Gem",
    description:
      "Unleash precise strokes and effortless control—an artistic gem designed for digital sketchers who demand clarity, detail, and elegance in every line.",
  };

  return (
    <section className="relative w-full bg-[#0F0D0D] py-20 lg:py-10 overflow-hidden">
      <div className="max-w-[1440px] px-6 2xl:px-8 mx-auto">
        {/* Main Layout - 2 Divs */}
        <div className="flex flex-col lg:flex-row lg:gap-8 gap-5">
          {/* Left Div - Active Projects Header + Button + Cards + See All */}
          <div className="flex-1">
            {/* Header Row */}
            <div className="flex justify-between items-start lg:mb-5 ">
              {/* Heading */}
              <h2 className="text-xl md:text-[28px] lg:text-[34px] lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-[#E13372] to-[#FEC133] bg-clip-text text-transparent">
                  Active Projects
                </span>
              </h2>

              {/* Button with Border */}
              <div className="bg-gradient-to-r from-[#E13372] to-[#FEC133] p-[1px] rounded-full">
                <button className="px-5 md:px-8 py-2 md:py-2.5 bg-clip-border bg-[#0F0D0D] rounded-full !text-white text-xs md:text-sm font-medium">
                  Projects
                </button>
              </div>
            </div>

            {/* Project Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6 gap-4">
              {projects.map((project, index) => (
                <ProjectCard
                  key={index}
                  imageSrc={project.imageSrc}
                  title={project.title}
                  progress={project.progress}
                  contributors={project.contributors}
                  pixelsPainted={project.pixelsPainted}
                />
              ))}
            </div>

            {/* See All Link */}
            <div className="text-center md:mt-8 mt-4.5">
              <Link
                to="/projects"
                className="!text-white text-sm font-medium hover:!underline underline-offset-4 hover:!text-white/80 transition-colors"
              >
                See All
              </Link>
            </div>
          </div>

          {/* Right Div - Featured Artwork */}
          <div className="lg:w-[450px] xl:w-[500px] flex-shrink-0">
            <FeaturedArtwork
              imageSrc={featuredArtwork.imageSrc}
              artistType={featuredArtwork.artistType}
              title={featuredArtwork.title}
              description={featuredArtwork.description}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActiveProjectsSection;
