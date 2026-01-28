import React from "react";

const AboutUsSection: React.FC = () => {
  return (
    <section className="relative w-full bg-[#0F0D0D] py-10 lg:py-20 overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute right-0 top-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
        {/* Left Side: Image */}
        <div className="relative w-full lg:w-1/2 flex justify-center items-center">
          <img
            src="/assets/about-us-img.svg"
            alt="About Us Artwork"
            className="w-full max-w-[550px] h-auto object-contain"
          />
        </div>

        {/* Right Side: Content */}
        <div className="w-full lg:w-1/2 text-left space-y-8">
          {/* Badge */}
          <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-[#E13372] to-[#FEC133]">
            <div className="px-8 py-2 rounded-full bg-[#0F0D0D] text-white tracking-widest text-xs font-semibold uppercase">
              About Us
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-[34px] font-bold !text-white leading-tight">
            Let’s Start Our Story With{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Artwork Development
            </span>
          </h2>

          {/* Description Paragraph with Gradient Background */}
          <div className="">
            {/* Gradient Background - Right Side */}
            <img
              src="/assets/gradient.svg"
              alt=""
              className="absolute 2xl:-right-86 xl:top-60 top-96 xl:-right-40 right-0  -translate-y-1/2 w-1/2 h-[650px] -z-10 opacity-70 pointer-events-none"
            />
            <p className="!text-white font-medium text-sm lg:text-base leading-relaxed text-justify relative z-10">
              Our journey begins with artwork development a collaborative space
              where ideas evolve, concepts gain clarity, and creativity is given
              the freedom to grow. We dive deep into your world, learning what
              inspires you, understanding your goals, and discovering what sets
              your vision apart. From raw sketches and moodboards to detailed
              illustrations and polished compositions, we shape a visual
              direction that captures your unique narrative. This process is
              immersive, intentional, and full of exploration, allowing us to
              build an artistic identity that feels authentic, expressive, and
              visually unforgettable. Here, art becomes the language of your
              story bold, meaningful, and ready to make an impact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
