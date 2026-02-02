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
            className="w-full h-full opacity-60 xl:opacity-100 object-[70%] object-cover md:object-cover"
          />
        </div>

        <div className="relative z-10 max-w-[1440px] w-full mx-auto md:px-10 px-8 flex flex-col items-start lg:gap-3 gap-2 pt-20">
          <span className="!text-white lg:text-base text-sm font-medium">
            Contact Us
          </span>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight !text-white">
            Contact
          </h1>
          <p className="text-white leading-relaxed xl:max-w-xl lg:text-base text-sm mix-blend-lighten drop-shadow-md mb-3">
            At MurArt, Our Mission Is To Empower Artists, Creators, And Curators
            With A Platform That's Easy To Use, Inspiring, And Fair. These
            Guidelines Help You Understand How To Participate, Create, And
            Engage Within The MurArt Community Whether You're Showcasing Work,
            Exploring Collections, Or Interacting With Other Creators.
          </p>

          <Link to="/gallery">
            <div className="relative w-fit p-[1px] rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] group hover:opacity-90 transition-opacity">
              <Button className="rounded-full lg:!px-[27px] !px-[22px] py-[10px] bg-black text-white hover:bg-black/90 transition-all duration-300 flex items-center gap-2 lg:text-base text-sm font-semibold border-none relative z-10">
                Explore Now
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </div>
          </Link>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto md:px-10 px-8 lg:!py-20 py-7 flex flex-col lg:flex-row xl:gap-12 gap-10 items-start justify-center">
        {/* Left Side: Details */}
        <div className="w-full pt-4">
          <h2 className="text-2xl md:text-3xl lg:text-[34px] font-semibold !text-white mb-6">
            Get In{" "}
            <span className="bg-gradient-to-r from-[#E23373] to-[#FEC133] bg-clip-text text-transparent">
              Touch With Us
            </span>
          </h2>
          <p className="lg:text-base text-sm text-[#AAB2C7] font-medium lg:mb-8">
            We're here to help and would love to hear from you. Whether you have
            a question, need more information about our services, or want to
            discuss your ideas in detail, our team is always ready to assist. We
            believe that great results start with meaningful conversations, so
            don't hesitate to reach out and share your requirements with us.
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full relative  bg-[#141414] p-6 rounded-[12px] z-50">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full xl:h-12 h-11 rounded-[8px] bg-[#2E2E2E] border-none px-4 text-white placeholder:text-[#AAB2C7] focus:ring-1 focus:ring-white/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your Last Name"
                  className="w-full xl:h-12 h-11 rounded-[8px] bg-[#2E2E2E] border-none px-4 text-white placeholder:text-[#AAB2C7] focus:ring-1 focus:ring-white/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">Email</label>
              <input
                type="email"
                placeholder="Enter your Email"
                className="w-full xl:h-12 h-11 rounded-[8px] bg-[#2E2E2E] border-none px-4 text-white placeholder:text-[#AAB2C7] focus:ring-1 focus:ring-white/20 outline-none transition-all"
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

          <img
            src="/assets/gradient.svg"
            alt=""
            className="absolute 2xl:-right-20 lg:top-100 md:top-104 md:-right-10 -right-8 -translate-y-1/2 w-1/2 h-[650px] opacity-70 pointer-events-none"
          />
        </div>
      </div>

      {/* Explore Famous Artwork Section */}
      <section className="relative z-50 w-full h-[450px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/contact-art-1.svg"
            alt="Famous Artwork"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10  mx-auto px-6 text-center py-5 flex flex-col items-center gap-3 lg:gap-6">
          <h2 className="text-2xl md:text-3xl lg:text-[34px] font-bold !text-white">
            Explore Our Famous Artwork
          </h2>
          <p className="!text-white text-sm md:text-base max-w-4xl leading-relaxed">
            Step into a world of creativity where every artwork tells a story.
            Our famous collection showcases inspiring pieces created with
            passion, skill, and imagination, each reflecting a unique artistic
            journey. From bold concepts to intricate details, these artworks
            represent the finest expressions of collaborative and individual
            creativity.
          </p>
          <Link to="/gallery">
            <Button className="mt-4 px-8 md:py-6 py-5 rounded-full bg-gradient-to-r from-[#E23373] to-[#FEC133] text-white font-semibold md:text-base text-sm border-none hover:opacity-90 transition-opacity">
              Explore Art Gallery
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
