import React from "react";

interface ServiceCardProps {
  number: string;
  imageSrc: string;
  title: string;
  description: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  number,
  imageSrc,
  title,
  description,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 md:p-6 p-4 flex flex-col md:gap-4 gap-3 hover:border-white/20 transition-colors duration-300">
      {/* Number */}
      <span className="text-white md:text-[34px] text-3xl font-semibold">
        {number}
      </span>

      {/* Image */}
      <div className="w-full aspect-video rounded-xl overflow-hidden">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title */}
      <h3 className="!text-white md:text-[28px] text-2xl font-semibold !mb-0">
        {title}
      </h3>

      {/* Description */}
      <p className="!text-white text-sm lg:text-[18px] leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
};

const ServicesSection: React.FC = () => {
  const services = [
    {
      number: "01",
      imageSrc: "/assets/services-1.svg",
      title: "Paint your Section",
      description:
        "Contribute to massive canvases by painting your own unique section.",
    },
    {
      number: "02",
      imageSrc: "/assets/services-2.svg",
      title: "Collaborate",
      description:
        "Work alongside other artists to create something extraordinary.",
    },
    {
      number: "03",
      imageSrc: "/assets/services-3.svg",
      title: "Vote on Contributions",
      description:
        "Help maintain quality by voting on other artist's contributions.",
    },
  ];

  return (
    <section className="relative w-full bg-[#0F0D0D] py-10 lg:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header Row */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-start !sm:items-center md:gap-6 gap-3 lg:mb-16 md:mb-5 mb-3">
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl lg:text-[34px] font-semibold !text-white">
            Our Amazing{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Artwork Services
            </span>
          </h2>

          {/* Button with Gradient Border */}
          <div className="inline-block p-[1.5px] rounded-full bg-gradient-to-r from-[#E13372] to-[#FEC133]">
            <button className="px-[17px] py-[7px] rounded-full bg-[#0F0D0D] text-white text-sm lg:text-base font-semibold hover:bg-[#1a1a1a] transition-colors">
              Our Services
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-6 gap-4">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              number={service.number}
              imageSrc={service.imageSrc}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
