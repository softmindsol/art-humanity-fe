import { Link, useLocation } from "react-router-dom";
import { FaYoutube, FaTiktok, FaInstagram, FaDiscord } from 'react-icons/fa';

const Footer = () => {
    const location = useLocation();

    if (location.pathname === "/signup" || location.pathname === "/login" || location.pathname === "/forgot-password" || location.pathname.startsWith("/reset-password")) {
        return null;
    }

  return (
    <footer className="w-full !bg-[#141414] pt-16 pb-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8 mb-16">
                
                {/* Brand Column */}
                <div className="flex flex-col items-center lg:items-start space-y-6">
                    <div className="flex flex-col items-center space-y-3">
                         <img src="/assets/logo.svg" alt="MurArt Logo" className="w-16 h-16 object-contain" />
                    </div>
                    
                    {/* Social Icons */}
                    <div className="flex items-center gap-4">
                        <a href="https://www.instagram.com/murart.io" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center !text-white hover:bg-white/10 transition-colors">
                            <FaInstagram className="text-lg" />
                        </a>
                        <a href="https://www.youtube.com/@MurArtio" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center !text-white hover:bg-white/10 transition-colors">
                            <FaYoutube className="text-lg" />
                        </a>
                        <a href="https://www.tiktok.com/@murart.io" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center !text-white hover:bg-white/10 transition-colors">
                            <FaTiktok className="text-lg" />
                        </a>
                        <a href="https://discord.gg/ZGWB9zZF" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center !text-white hover:bg-white/10 transition-colors">
                            <FaDiscord className="text-lg" />
                        </a>
                    </div>
                </div>

                {/* Navigation Columns */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-12 lg:gap-24">
                     {/* Explore */}
                     <div className="flex flex-col space-y-6">
                        <h3 className="!text-white text-[16px] font-semibold">Explore</h3>
                        <ul className="space-y-3 !text-white text-sm font-medium">
                            <li><Link to="/gallery" className="!text-white transition-colors">Gallery</Link></li>
                            <li><Link to="/projects" className="!text-white transition-colors">Projects</Link></li>
                            <li><Link to="/guideline" className="!text-white transition-colors">Guideline</Link></li>
                        </ul>
                     </div>

                     {/* Participate */}
                     <div className="flex flex-col space-y-6">
                        <h3 className="!text-white text-base font-semibold">Participate</h3>
                        <ul className="space-y-3 !text-white text-sm font-medium">
                            <li><Link to="/projects" className="!text-white transition-colors">Join a Project</Link></li>
                            <li><Link to="/demo" className="!text-white transition-colors">Try Demo</Link></li>
                        </ul>
                     </div>

                     {/* About */}
                     <div className="flex flex-col space-y-6">
                        <h3 className="!text-white text-base font-semibold">About</h3>
                        <ul className="space-y-3 !text-white text-sm font-medium">
                            <li><Link to="/contact-us" className="!text-white transition-colors">Contact</Link></li>
                        </ul>
                     </div>
                </div>

                {/* Description Column */}
                 <div className="w-sm md:w-full lg:w-sm text-center lg:text-left">
                    <p className="!text-white text-sm font-medium leading-relaxed">
                        Project MurArt provides enormous digital canvases that would be nearly impossible to fully paint by one person. We have developed a collaboration system that will allow the creation of the most stunning art pieces the world has ever seen. Anyone can paint a part of the canvas and solidify your spot in history!
                    </p>
                 </div>

            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-white/10 text-center">
                <p className="!text-white text-sm">
                    &copy; 2025 MurArt. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
  );
};

export default Footer;