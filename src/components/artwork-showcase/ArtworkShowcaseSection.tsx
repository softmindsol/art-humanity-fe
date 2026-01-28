import React from "react";

const ArtworkShowcaseSection: React.FC = () => {
  return (
    <section className="relative w-full h-[500px] lg:h-[700px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/assets/goat.svg"
          alt="Pastoral Stillness"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay for Text Readability */}
      </div>

      <div className="max-w-[1440px] px-6 2xl:px-8 mx-auto h-full flex items-end pb-8 lg:pb-16 relative z-10">
        <div className="max-w-3xl md:space-y-6 space-y-4">
          <p className="!text-white text-sm md:text-base font-medium">
            You can create artwork of this type and also you can contribute{" "}
            <br className="hidden md:block" /> to other people artworks
          </p>

          <h2 className="text-[24px] lg:text-[34px] font-semibold !text-white leading-[1.1]">
            Pastoral Stillness with Sheep <br />
            Anonymous{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Pastoral School
            </span>
          </h2>

          <p className="!text-white text-sm md:text-base font-semibold max-w-xl leading-relaxed">
            This piece is reminiscent of 19th-century pastoral realism, similar
            in tone to artists who focused on rural landscapes and livestock
          </p>
        </div>
      </div>
    </section>
  );
};

export default ArtworkShowcaseSection;
