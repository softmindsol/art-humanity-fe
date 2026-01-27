import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import CanvasBoard from './CanvasBoard'; // Importing the separated canvas component
import { Link } from 'react-router-dom';

const DemoPage: React.FC = () => {
    
    // Auto-scroll to canvas when "Explore Now" is clicked
    const canvasRef = useRef<HTMLDivElement>(null);
    const handleScrollToCanvas = () => {
        canvasRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#0F0D0D] text-white font-montserrat">
            
            {/* HERO SECTION */}
            <section className="relative w-full min-h-screen flex items-center overflow-hidden">
              
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-no-repeat bg-[center_right] md:bg-cover"
                    style={{ backgroundImage: "url('/assets/demo-hero-section.svg')" }}
                >
                </div>

                {/* Content Container */}
                <div className="container mx-auto px-6 relative z-10 flex items-center h-full">
                    <div className="max-w-2xl pt-20">
                        <span className="!text-white text-sm md:text-base tracking-widest  mb-4 block">
                            Start Your Artwork
                        </span>
                        
                        <h1 className="text-[34px] md:text-[46px] font-semibold !text-white mb-6 leading-tight">
                            Demo
                        </h1>
                        
                        <p className="!text-white text-[16px] md:text-[22px] leading-relaxed mb-10 max-w-2xl">
                            Explore Our Collection Of Completed Collaborative Canvases And Step Into A World Where Creativity Knows No Borders. Each Masterpiece You’ll Find Here Is The Result Of Countless Artists Contributing Their Unique Vision, Style, And Imagination To A Shared Digital Space. From Subtle Strokes To Bold Concepts, Every Detail Adds Depth, Character, And Emotion—Proving That Art Doesn’t Need A Single Creator To Feel Whole.
                        </p>

                        <Link to="/gallery">
                      <div className="relative inline-block w-fit p-[1px]  rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
                        <Button 
                          className="rounded-full !w-fit  px-[17px] py-[7px] bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 text-base font-semibold border-none relative z-10"
                        >
                          Explore Now
                          <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Button>
                      </div>
                  </Link>
                    </div>
                </div>
            </section>


            {/* CANVAS SECTION */}
            <section ref={canvasRef} className="relative w-full min-h-screen bg-[#141414]">
                <CanvasBoard />
            </section>

        </div>
    );
};

export default DemoPage;