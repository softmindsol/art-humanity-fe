import React from 'react';
import { Button } from '../ui/button';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <div className="w-full min-h-screen relative flex items-start lg:items-center bg-[#030303]">
      
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
          <img 
            src="/assets/hero-section-img.svg" 
            alt="Hero Background" 
            className="w-full h-full object-cover "
          />
         
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-40 relative z-10 w-full">
        
        {/* Content Container */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
           <span className="text-[#FFFFFF] text-sm md:text-base  font-medium font- ">Stunning Artworks</span>

           <h1 className="text-4xl md:text-6xl !text-white lg:text-[46px] font-bold text-white leading-[1.1] lg:leading-[1.1] ">
            Join The Worlds Largest <br className="hidden lg:block"/>
            Collaborative <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">Art Project</span>
          </h1>

          <p className="!text-white !font-medium text-base md:text-lg max-w-xl leading-relaxed drop-shadow-md">
            Project MurArt Offers Massive Digital Canvases For Collaborative Painting.
            Anyone Can Contribute, Create Stunning Art, And Leave Their Mark In History.
          </p>

          <Link to="/gallery">
              <div className="relative p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
                <Button 
                  className="rounded-full px-[17px] py-[7px] bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 text-base font-semibold border-none relative z-10"
                >
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