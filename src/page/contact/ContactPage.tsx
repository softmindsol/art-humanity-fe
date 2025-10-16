// src/pages/ContactPage.tsx

import React from 'react';
import { Mail, MessageSquare, Heart } from 'lucide-react'; // Kuch aala se icons
import { toast } from 'sonner';

const ContactUs: React.FC = () => {
    const email = "murartio@outlook.com";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(email);
        toast.success("Email address copied to clipboard!"); // `toast` ka istemal karein
    };

    return (
        <div className=" min-h-screen">
            <div className="container mx-auto px-4 py-16 sm:py-10 text-center">

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl py-5 font-bold font-serif text-[#3e2723] mb-4">
                    Get in Touch
                </h1>
                <p className="text-lg text-[#5d4037] max-w-3xl mx-auto mb-12">
                    We are a community-driven platform and your voice matters. Whether you have a brilliant idea, a question about a project, or just want to say hello, we would love to hear from you.
                </p>

                {/* Contact Card */}
                <div
                    className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 border-2 border-[#d4af37]"
                    style={{ fontFamily: 'Georgia, serif' }}
                >
                    <div className="flex flex-col items-center">
                        <Mail size={40} className="text-[#5d4037] mb-4" />

                        <p className="text-xl text-[#5d4037] mb-2">
                            Contact us with any comments, questions, or concerns at:
                        </p>

                        {/* Clickable Email Link */}
                        <a
                            href={`mailto:${email}`}
                            className="text-2xl font-bold text-[#3e2723] hover:text-[#d4af37] transition-colors duration-300"
                        >
                            {email}
                        </a>

                        {/* Copy to Clipboard Button */}
                        <button
                            onClick={copyToClipboard}
                            className="mt-6 bg-transparent cursor-pointer border border-[#a1887f] text-[#5d4037] hover:bg-[#f8f0e3] font-semibold py-2 px-4 rounded-full text-sm transition-colors duration-300"
                        >
                            Copy Email Address
                        </button>
                    </div>
                </div>

                {/* Extra Info Section */}
                <div className="mt-16 grid md:grid-cols-2 gap-8  md:w-2xl lg:w-4xl py-10 md:py-0  mx-auto text-left">
                    <div className="bg-white/50 p-6 rounded-lg">
                        <MessageSquare size={28} className="text-[#d4af37] mb-3" />
                        <h3 className="font-bold text-xl text-[#3e2723] mb-2">Feedback & Ideas</h3>
                        <p className="text-[#5d4037]">Have an idea for a new feature or a suggestion for improvement? We are all ears!</p>
                    </div>
                    <div className="bg-white/50 p-6 rounded-lg">
                        <Heart size={28} className="text-[#d4af37] mb-3" />
                        <h3 className="font-bold text-xl text-[#3e2723] mb-2">Collaborate With Us</h3>
                        <p className="text-[#5d4037]">Are you an artist, a community, or a brand interested in sponsoring a project? Let’s talk.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ContactUs;