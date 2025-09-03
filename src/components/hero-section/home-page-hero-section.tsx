import React from 'react';

const HeroSection: React.FC = () => {
  return (
    // 'container' class ke liye Tailwind ki classes
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <main>
        {/* Hero Section */}
        {/* Outer container for margin, border, shadow, and background image */}
        <section
          className="relative my-8 h-[500px] flex items-center justify-center bg-[#3e2723b3] border-[15px] border-[#f5f5dc] shadow-xl bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1482245294234-b3f2f8d5f1a4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-primary-dark opacity-70"></div>

          {/* Hero Content */}
          <div className="relative z-10 text-center  text-[#efebe9] px-5 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold xs:leading-16 mb-6 font-playfair !text-[#efebe9] [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">
              Join the World's Largest Collaborative Art Project
            </h2>
            <p className="text-base md:text-lg mb-8 xs:mt-14 max-w-3xl mx-auto">
              Project Art of Humanity provides enormous digital canvases that would be nearly impossible to fully paint
              by one person. We have developed a collaboration system that will allow the creation of the most stunning
              art pieces the world has ever seen. Anyone can paint a part of the canvas and solidify your spot in
              history!
            </p>
          </div>
        </section>

        {/* Features Section */}
        {/* Responsive grid: 1 column on small screens, 3 on medium screens and up */}
        <section className="my-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="bg-[#f5f5dc] p-8 text-center rounded-md shadow-lg border border-[#a1887f] transition-transform duration-300 ease-in-out hover:-translate-y-2.5">
            <div className="text-5xl mb-5">🖌️</div>
            <h3 className="text-2xl font-bold mb-4 font-playfair text-primary-dark">Paint Your Section</h3>
            <p>Contribute to massive canvases by painting your own unique section.</p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-[#f5f5dc] p-8 text-center rounded-md shadow-lg border border-[#a1887f] transition-transform duration-300 ease-in-out hover:-translate-y-2.5">
            <div className="text-5xl mb-5">👥</div>
            <h3 className="text-2xl font-bold mb-4 font-playfair text-primary-dark">Collaborate</h3>
            <p>Work alongside other artists to create something extraordinary.</p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-[#f5f5dc] p-8 text-center rounded-md shadow-lg border border-[#a1887f] transition-transform duration-300 ease-in-out hover:-translate-y-2.5">
            <div className="text-5xl mb-5">🗳️</div>
            <h3 className="text-2xl font-bold mb-4 font-playfair text-primary-dark">Vote on Contributions</h3>
            <p>Help maintain quality by voting on other artists' contributions.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HeroSection;