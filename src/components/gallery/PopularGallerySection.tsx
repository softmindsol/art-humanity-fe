import React from 'react';
import { Link } from 'react-router-dom';

interface GalleryCardProps {
    imageSrc: string;
    title: string;
    artist: string;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ imageSrc, title, artist }) => {
    return (
        <div className="bg-[#2E2E2E] rounded-[12px] p-3 flex flex-col gap-4 border border-white/5 hover:border-white/20 transition-all duration-300">
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
                <h3 className="!text-white  lg:text-[20px] font-semibold truncate">{title}</h3>
                <p className="!text-white  lg:text-lg">By {artist}</p>
            </div>
        </div>
    );
};

const PopularGallerySection: React.FC = () => {
    const artworks = [
        {
            imageSrc: "/assets/popular-1.svg",
            title: "Red Velvet Lady",
            artist: "John Doe"
        },
        
        {
            imageSrc: "/assets/popular-2.svg",
            title: "The Beauty Praiser",
            artist: "John Doe"
        },
         {
            imageSrc: "/assets/popular-3.svg",
            title: "Red Velvet Lady",
            artist: "John Doe"
        },
        
        {
            imageSrc: "/assets/popular-4.svg",
            title: "The Beauty Praiser",
            artist: "John Doe"
        }
    ];

    return (
        <section className="relative w-full bg-[#0F0D0D] py-20 lg:py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                     {/* Heading */}
                     <h2 className="text-3xl md:text-4xl lg:text-[34px] font-semibold !text-white">
                        Our Popular{' '}
                        <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
                            Gallery Artwork
                        </span>
                    </h2>
                    
                    {/* Button with Gradient Border */}
                    <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133]">
                        <Link to="/gallery" className="block  px-[17px] py-[7px] rounded-full bg-[#0F0D0D] text-white text-sm font-semibold hover:bg-[#1a1a1a] transition-colors">
                            Artworks
                        </Link>
                    </div>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
