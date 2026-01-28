import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ContactUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F0D0D] text-white font-montserrat">
      {/* Hero Section */}
      <section className="relative w-full min-h-[100vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/contact-hero-section.svg"
            alt="Contact Hero"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 flex flex-col items-start gap-6 pt-20">
          <span className="!text-white text-base font-medium">Contact Us</span>
          <h1 className="text-5xl md:text-7xl font-semibold leading-tight !text-white mb-2">
            Contact
          </h1>
          <p className="text-white leading-relaxed max-w-2xl text-lg mix-blend-lighten drop-shadow-md">
            At MurArt, Our Mission Is To Empower Artists, Creators, And Curators
            With A Platform That's Easy To Use, Inspiring, And Fair. These
            Guidelines Help You Understand How To Participate, Create, And
            Engage Within The MurArt Community Whether You're Showcasing Work,
            Exploring Collections, Or Interacting With Other Creators.
          </p>

          <Link to="/gallery">
            <div className="relative w-fit p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
              <Button className="rounded-full px-[20px] py-[10px] bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 text-base font-semibold border-none relative z-10">
                Explore Now
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-6 !py-20 flex flex-col lg:flex-row gap-16 lg:gap-24 items-start justify-center">
        {/* Left Side: Details */}
        <div className="w-full lg:w-1/2 pt-4">
          <h2 className="text-4xl md:text-[34px] font-semibold !text-white mb-6">
            Get In{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Touch With Us
            </span>
          </h2>
          <p className="text-lg text-[#AAB2C7] font-medium leading-relaxed mb-8">
            We're here to help and would love to hear from you. Whether you have
            a question, need more information about our services, or want to
            discuss your ideas in detail, our team is always ready to assist. We
            believe that great results start with meaningful conversations, so
            don't hesitate to reach out and share your requirements with us.
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full relative lg:w-1/2 xl:w-2/2 bg-[#141414] p-6 rounded-[12px] z-50">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full h-12 rounded-[8px] bg-[#2E2E2E] border-none px-4 text-white placeholder:text-[#AAB2C7] focus:ring-1 focus:ring-white/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your Last Name"
                  className="w-full h-12 rounded-[8px] bg-[#2E2E2E] border-none px-4 text-white placeholder:text-[#AAB2C7] focus:ring-1 focus:ring-white/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">Email</label>
              <input
                type="email"
                placeholder="Enter your Email"
                className="w-full h-12 rounded-[8px] bg-[#2E2E2E] border-none px-4 text-white placeholder:text-[#AAB2C7] focus:ring-1 focus:ring-white/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="Enter your Description"
                className="w-full rounded-[8px] !font-montserrat !bg-[#2E2E2E] !border-none p-4 text-white placeholder:text-[#AAB2C7]  !focus:ring-1 !focus:ring-white/20 !outline-none resize-none transition-all"
              />
            </div>

            <Button className="w-full h-[42px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white font-semibold text-base border-none hover:opacity-90 transition-opacity mt-4 cursor-pointer">
              Send Message
            </Button>
          </form>

          <div className="absolute 2xl:-right-[352px] xl:-right-[16%] lg:-right-8 md:-right-6 -right-4 top-0">
            <img src="/assets/gradient.svg" alt="" className="" />
          </div>
        </div>
      </div>

      {/* Explore Famous Artwork Section */}
      <section className="relative w-full h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/contact-art-1.svg"
            alt="Famous Artwork"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10  mx-auto px-6 text-center py-5 flex flex-col items-center  gap-6">
          <h2 className="text-4xl md:text-[34px] font-bold !text-white">
            Explore Our Famous Artwork
          </h2>
          <p className="!text-white text-base md:text-xl max-w-4xl leading-relaxed">
            Step into a world of creativity where every artwork tells a story.
            Our famous collection showcases inspiring pieces created with
            passion, skill, and imagination, each reflecting a unique artistic
            journey. From bold concepts to intricate details, these artworks
            represent the finest expressions of collaborative and individual
            creativity.
          </p>
          <Link to="/gallery">
            <Button className="mt-4 px-8 py-6 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white font-semibold text-base border-none hover:opacity-90 transition-opacity">
              Explore Art Gallery
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
