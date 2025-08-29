import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="container">
      <main>
        <section className="hero">
          <div className="hero-content">
            <h2>Join the World's Largest Collaborative Art Project</h2>
            <p>
              Project Art of Humanity provides enormous digital canvases that would be nearly impossible to fully paint
              by one person. We have developed a collaboration system that will allow the creation of the most stunning
              art pieces the world has ever seen. Anyone can paint a part of the canvas and solidify your spot in
              history!
            </p>
          </div>
        </section>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">🖌️</div>
            <h3>Paint Your Section</h3>
            <p>Contribute to massive canvases by painting your own unique section.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Collaborate</h3>
            <p>Work alongside other artists to create something extraordinary.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗳️</div>
            <h3>Vote on Contributions</h3>
            <p>Help maintain quality by voting on other artists' contributions.</p>
          </div>
        </section>

     
      </main>
    </div>
  );
};

export default HeroSection;
