import React from 'react';
import { Quote, Star } from 'lucide-react';

const TestimonialSection: React.FC = () => {
    return (
        <section className="relative w-full py-20 lg:py-32 overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
                <img 
                    src="/assets/founder.svg" 
                    alt="Background" 
                    className="w-full h-full object-cover"
                />
              
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center space-y-8">
                {/* Quote Icon */}
                <Quote className="w-16 h-16 text-gray-500/30 fill-current" />

                {/* Stars */}
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 text-[#FEC133] fill-current" />
                    ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-white text-base md:text-lg lg:text-xl leading-relaxed font-medium">
                    "Working with this team has been one of the best decisions I've made for my business. Not only did they bring expertise and creativity to the table, but they also made the entire process smooth and stress-free. They explained every step, offered helpful suggestions, and delivered high-quality results on time. It feels like a partnership, not just a service. Highly recommended!"
                </p>

                {/* Author Info */}
                <div className="flex flex-col items-center gap-4 mt-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                        <img 
                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop" 
                            alt="Jacob Jones" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="space-y-1">
                        <h4 className="!text-white text-xl font-semibold">Jacob Jones</h4>
                        <p className="text-[#E23373] text-sm lg:text-base  font-medium">Chief Product Executive</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialSection;
