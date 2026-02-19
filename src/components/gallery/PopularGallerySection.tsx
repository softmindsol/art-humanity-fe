import React from "react";
import { Link } from "react-router-dom";

interface GalleryCardProps {
  imageSrc: string;
  title: string;
  artist: string;
}

const GalleryCard: React.FC<GalleryCardProps> = ({
  imageSrc,
  title,
  artist,
}) => {
  return (
    <div className="bg-[#2E2E2E] rounded-[12px] p-3 flex flex-col md:gap-4 gap-3 border border-white/5 hover:border-white/20 transition-all duration-300">
      {/* Image */}
      <div className="w-full aspect-square rounded-[6px] overflow-hidden">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="!text-white lg:text-[20px] font-semibold truncate !mb-0">
          {title}
        </h3>
        <p className="!text-white lg:text-lg text-sm">By {artist}</p>
      </div>
    </div>
  );
};

const PopularGallerySection: React.FC = () => {
  const artworks = [
    {
      imageSrc: "/assets/popular-1.svg",
      title: "Red Velvet Lady",
      artist: "John Doe",
    },

    {
      imageSrc: "/assets/popular-2.svg",
      title: "The Beauty Praiser",
      artist: "John Doe",
    },
    {
      imageSrc: "/assets/popular-3.svg",
      title: "Red Velvet Lady",
      artist: "John Doe",
    },

    {
      imageSrc: "/assets/popular-4.svg",
      title: "The Beauty Praiser",
      artist: "John Doe",
    },
  ];

  return (
    <section className="relative w-full bg-[#0F0D0D] py-10 lg:py-20 overflow-hidden">
      <div className="max-w-[1440px] px-6 2xl:px-8 mx-auto">
        {/* Header Row */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-start lg:gap-6 gap-3 md:mb-12 mb-1">
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl lg:text-[34px] !font-semibold !text-white">
            Our Popular{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Gallery Artwork
            </span>
          </h2>

          {/* Button with Gradient Border */}
          <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133]">
            <Link
              to="/gallery"
              className="block px-[17px] py-[7px] rounded-full bg-[#0F0D0D] !text-white xl:text-base md:text-sm text-xs font-semibold hover:bg-[#1a1a1a] transition-colors"
            >
              Artworks
            </Link>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:gap-6 gap-4">
          {artworks.map((artwork, index) => (
            <GalleryCard
              key={index}
              imageSrc={artwork.imageSrc}
              title={artwork.title}
              artist={artwork.artist}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularGallerySection;
