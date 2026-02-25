import React from "react";

const ArtworkShowcaseSection: React.FC = () => {
  return (
    <section className="relative w-full h-[500px] lg:h-[700px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/assets/pastoral-stillness.webp"
          alt="Pastoral Stillness"
          className="w-full h-full object-cover opacity-65"
        />
        {/* Gradient Overlay for Text Readability */}
      </div>

      <div className="max-w-[1440px] px-6 2xl:px-8 mx-auto h-full flex items-end pb-8 lg:pb-16 relative z-10">
        <div className="max-w-3xl md:space-y-6 space-y-4">
          <p className="!text-white text-sm md:text-base font-semibold">
            You can help paint parts of artwork like this
          </p>

          <h2 className="text-[24px] lg:text-[34px] capitalize font-semibold !text-white leading-[1.1]">
            Medieval Farming Town with{" "}
            <p className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Background Castle
            </p>
          </h2>

          <p className="!text-white text-sm md:text-base font-semibold max-w-xl leading-relaxed">
            This piece is reminiscent of the medieval times focusing on rural
            landscapes and breathtaking views.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ArtworkShowcaseSection;
