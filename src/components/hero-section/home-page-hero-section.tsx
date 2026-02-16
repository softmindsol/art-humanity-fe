import React from "react";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  return (
    <div className="w-full xl:max-h-[808px] lg:max-h-[758px] md:max-h-[650px] h-[510px] md:h-[650px] lg:h-[758px] xl:h-[808px] relative flex items-start lg:items-center bg-[#030303]">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/hero-section-img.svg"
          alt="Hero Background"
          className="w-full h-[510px] md:h-[650px] lg:h-[758px] xl:h-[808px] opacity-60 lg:opacity-100 object-[65%] object-cover md:object-cover"
        />
      </div>

      <div className="max-w-[1440px] md:px-10 px-8 mx-auto my-auto relative z-10 w-full">
        {/* Content Container */}
        <div className="w-full xl:w-1/2 flex flex-col items-start xl:space-y-8 lg:space-y-6 space-y-4">
          <span className="text-[#FFFFFF] text-sm md:text-base font-medium">
            Stunning Artworks
          </span>

          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl pr-10 !text-white !font-semibold leading-[1.1] lg:leading-[1.1] ">
            Join The Worlds Largest <br className="hidden lg:block" />
            Collaborative{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Art Project
            </span>
          </h1>

          <p className="!text-white !font-medium text-sm lg:text-base xl:text-lg lg:max-w-xl leading-relaxed drop-shadow-md">
            Project MurArt Offers Massive Digital Canvases For Collaborative
            Painting. Anyone Can Contribute, Create Stunning Art, And Leave
            Their Mark In History.
          </p>

          <Link to="/gallery">
            <div className="relative p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
              <Button className="rounded-full lg:!px-[27px] !px-[22px] py-[7px] bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 lg:text-base text-sm font-semibold border-none relative z-10">
                Explore Now
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
