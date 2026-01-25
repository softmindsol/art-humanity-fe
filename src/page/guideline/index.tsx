import React from 'react';
import {  ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const GuidelinePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F0D0D] text-gray-200 font-montserrat">
      {/* Hero Section */}
      <section className="relative w-full h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src='/assets/guideline-hero-section.svg' 
            alt="Guideline Hero" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-6 relative z-10 pt-20">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3  !text-[#ffffff] text-sm lg:text-base font-medium tracking-wider mb-4 ">
              Project Guideline
            </span>
            <h1 className="text-5xl md:text-[46px] font-semibold !text-white mb-6 leading-tight">
              Guideline
            </h1>
            <p className="text-lg md:text-base !text-white mb-8 leading-relaxed font-medium">
              At MurArt, Our Mission Is To Empower Artists, Creators, And Curators With A Platform That's Easy To Use, Inspiring, And Fair. 
              These Guidelines Help You Understand How To Participate, Create, And Engage Within The MurArt Community.
            </p>
              <Link to="/gallery">
              <div className="relative p-[1px] w-fit rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
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
      </section>

      {/* Main Content */}
      <main id="rules-content" className="relative z-10 py-12  bg-[#0F0D0D]">
        <div className="container mx-auto px-6 py-20">
          
          <div className="flex flex-col lg:flex-row items-center gap-16">
             
             {/* Left Collage Section */}
             <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 items-center w-full max-w-[600px]">
                   
                   {/* Col 1 - Left */}
                   <div className="flex flex-col gap-4">
                      <div className="h-[200px] w-full rounded-[12px] overflow-hidden">
                        <img src="/assets/guideline-art-1.svg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Art 1" />
                      </div>
                      <div className="h-[200px] w-full rounded-[12px] overflow-hidden">
                        <img src="/assets/guideline-art-4.svg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Art 4" />
                      </div>
                   </div>

                   {/* Col 2 - Center Tall */}
                   <div className="h-[416px] w-full rounded-[12px] overflow-hidden shadow-2xl z-10">
                     <img src="/assets/guideline-art-3.svg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Art 2" />
                   </div>

                   {/* Col 3 - Right */}
                   <div className="flex flex-col gap-4">
                       <div className="h-[200px] w-full rounded-[12px] overflow-hidden">
                        <img src="/assets/guideline-art-2.svg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Art 3" />
                      </div>
                      <div className="h-[200px] w-full rounded-[12px] overflow-hidden">
                         <img src="/assets/guideline-art-5.svg" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="Art 5" />
                      </div> 
                   </div>
                   
                </div>
             </div>

             {/* Right Text Section */}
             <div className="w-full lg:w-1/2 space-y-6">
                <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-[#E13372] to-[#FEC133]">
                        <div className="px-8 py-2 rounded-full bg-[#0F0D0D] text-white tracking-widest text-xs font-semibold uppercase">
                            Guideline
                        </div>
                    </div>
                
                <h2 className="text-4xl md:text-[34px] font-semibold !text-white">
                  How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E23373] to-[#FEC133]">Works</span>
                </h2>

                <p className="!text-white leading-relaxed text-base text-justify">
                    Make a contribution in the contributions page and start painting. Each pixel you 
                    paint will become yours and cannot be changed by other contributors. All 
                    painted pixels will be automatically saved to the currently selected contribution. 
                    Each user is allowed 10 contributions per project and can be as big or as small as 
                    you want. If you want to paint on a different section of the canvas, create a new 
                    contribution and have it selected as you paint. All other contributors can upvote 
                    your contribution to permanently keep it in the canvas or downvote it to be 
                    deleted from the canvas. If a contribution receives over 50% downvotes from all 
                    project contributors, it will be rejected and deleted from the canvas. The project 
                    is only complete when almost all pixels are painted and not a single contribution 
                    receives over 50% downvotes.
                </p>
             </div>

          </div>
        </div>

        {/* Rules Section */}
        <div className="w-full bg-[#141414] py-20 mt-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            {/* Left Content */}
            <div className="w-full lg:w-1/2 space-y-8">
                <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-[#E13372] to-[#FEC133]">
                    <div className="px-6 py-2 rounded-full bg-[#0F0D0D] text-white tracking-widest text-base font-semibold uppercase">
                        Rules For Contribution
                    </div>
                </div>

                <h2 className="text-4xl md:text-[34px] font-semibold !text-white">
                  The Rules Are Simple
                </h2>

                {/* 3 Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1 */}
                    <div className=" border border-[#AAB2C7] rounded-[12px] p-6 flex flex-col items-center text-center gap-4 hover:border-[#E23373]/50 transition-colors group h-full justify-start">
                        <div className="text-[#FEC133] h-8 flex items-center justify-center">
                           <div className="flex flex-col items-center gap-1">
                              {/* Triangle */}
                              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-[#FEC133]"></div>
                              <div className="flex gap-1">
                                {/* Circle */}
                                <div className="w-3 h-3 bg-[#FEC133] rounded-full"></div>
                                {/* Square */}
                                <div className="w-3 h-3 bg-[#FEC133]"></div>
                              </div>
                           </div>
                        </div>
                        <p className="text-sm text-gray-300 font-medium">
                           Your Contribution Must Follow The Theme Of The Project.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className=" border border-[#AAB2C7] rounded-[12px] p-6 flex flex-col items-center text-center gap-4 hover:border-[#E23373]/50 transition-colors group h-full justify-start">
                        <div className="text-[#FEC133] h-8 flex items-center justify-center">
                           {/* Cross Icon */}
                           <div className="relative w-6 h-6 flex items-center justify-center">
                              <div className="absolute w-1.5 h-6 bg-[#FEC133] rounded-full"></div>
                              <div className="absolute w-6 h-1.5 bg-[#FEC133] rounded-full transform rotate-90"></div>
                           </div>
                        </div>
                        <p className="text-sm text-gray-300 font-medium">
                           Your Contribution Must Be As Detailed And As Realistic As Possible.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className=" border border-[#AAB2C7] rounded-[12px] p-6 flex flex-col items-center text-center gap-4 hover:border-[#E23373]/50 transition-colors group h-full justify-start">
                        <div className="text-[#FEC133] h-8 flex items-center justify-center">
                           {/* Sun Icon (Lucide Sun fallback or similar shape) */}
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="4"></circle>
                              <path d="M12 2v2"></path>
                              <path d="M12 20v2"></path>
                              <path d="M4.93 4.93l1.41 1.41"></path>
                              <path d="M17.66 17.66l1.41 1.41"></path>
                              <path d="M2 12h2"></path>
                              <path d="M20 12h2"></path>
                              <path d="M6.34 17.66l-1.41 1.41"></path>
                              <path d="M19.07 4.93l-1.41 1.41"></path>
                           </svg>
                        </div>
                        <p className="text-sm text-gray-300 font-medium">
                           Your Contribution, Its Colors, And Lighting Must Integrate And Flow With Other Contributions.
                        </p>
                    </div>
                </div>

                <div className="space-y-1 text-justify  font-medium">
                    <p className="!text-white text-base leading-[20px]">
                        Graphic Content Is Allowed As Long As It Follows The Other Rules. Nudity Is Prohibited. Moderators Will Be Monitoring Contributions Live And At Any Point Can Immediately Reject Your Contribution From The Canvas If Your Contribution Clearly And Obviously Doesn't Follow The Rules. If A Moderator Rejects 1 Of Your Contributions, You Will Automatically Be Removed From The Project And Will Not Be Able To Paint Again In The Project.
                    </p>
                    <p className="!text-white text-base leading-[20px]">
                        When Zooming In To Draw, Your Contribution Should Maintain An Isometric-Like Perspective So The Canvas Is Consistent As Seen When Fully Zoomed Out. This Approach Ensures Other Contributions Can Integrate Smoothly With Each Other, Resulting In A Cohesive And Consistent Final Piece.
                    </p>
                    <p className="!text-white text-base leading-[20px]">
                        We Have Three Fundamental Rules That All Contributions Must Follow And Should Be Taken Into Account When Voting For Other Contributions:
                    </p>
                </div>

            </div>

            {/* Right Image */}
            <div className="w-full lg:w-1/2 h-full">
                <div className="rounded-[20px] overflow-hidden h-[600px] w-full border border-white/5">
                    <img 
                        src="/assets/guideline-art-6.svg" 
                        alt="Guideline Art Rules" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                </div>
            </div>

            </div>
        </div>
        </div>

      </main>

        {/* Troll Prevention Section */}
        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
             
             {/* Left Image */}
             <div className="w-full lg:w-1/3">
                <div className="rounded-[20px] overflow-hidden h-[500px] w-full border border-white/5">
                    <img 
                        src="/assets/guideline-art-7.svg" 
                        alt="Troll Prevention Art" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                </div>
             </div>

             {/* Right Content */}
             <div className="w-full lg:w-2/3 space-y-8">
                <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-[#E13372] to-[#FEC133]">
                    <div className="px-6 py-2 rounded-full bg-[#0F0D0D] text-white tracking-widest text-base font-semibold uppercase">
                        Quality Over Quantity
                    </div>
                </div>

                <h2 className="text-4xl md:text-[34px] font-semibold !text-white leading-tight">
                  Troll Prevention And Promoting Quality Over Quantity
                </h2>

                <p className="!text-white text-sm 2xl:text-base leading-relaxed text-justify">
                   We only want painters who are passionate about the project, no matter how small your contribution is. The painting system is designed to emphasize a slow and steady process for your contribution. Take your time, even if it means painting one small detail, and solidify your spot in the canvas. With all of these systems in place, you still might encounter trolls interfering with your contribution. And you still might have to wait until it gets rejected to continue your contribution. The process will be long and vigorous but eventually, pixel by pixel, the canvas will become one breathtaking, cohesive, final piece of art.
                </p>

                <div className="pt-4">
                   <p className="text-2xl 2xl:text-[34px] font-semibold !text-white leading-snug">
                     “Success Is The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E23373] to-[#FEC133]">Sum Of Small Efforts,</span> Repeated Day In And Day Out ”
                   </p>
                   <p className="text-white mt-4 text-lg font-medium">
                     -Robert Collier
                   </p>
                </div>
             </div>

          </div>
        </div>
    </div>
  );
};

export default GuidelinePage;
