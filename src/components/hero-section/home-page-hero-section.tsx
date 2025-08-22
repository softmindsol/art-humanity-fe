import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="container">
      <main>
        <section className="hero">
          <div className="hero-content">
            <h2 className="lg:!text-[46px] md:!text-4xl !text-2xl mt-6 sm:mt-0">
              Join the World's Largest Collaborative Art Project
            </h2>
            <p className="md:text-lg text-sm">
              Project Art of Humanity provides enormous digital canvases that
              would be nearly impossible to fully paint by one person. We have
              developed a collaboration system that will allow the creation of
              the most stunning art pieces the world has ever seen. Anyone can
              paint a part of the canvas and solidify your spot in history!
            </p>
          </div>
        </section>

        <section className="flex flex-col md:flex-row xl:gap-x-14 lg:gap-x-12 md:gap-x-8 gap-5 md:mt-10">
          <div className="w-full bg-[#f5f5dc] shadow-md shadow-[#0000001A] rounded-lg p-6">
            <div className="text-5xl md:text-4xl lg:text-5xl text-center mb-5">🖌️</div>
            <h3>Paint Your Section</h3>
            <p>
              Contribute to massive canvases by painting your own unique
              section.
            </p>
          </div>
          <div className="w-full bg-[#f5f5dc] shadow-md shadow-[#0000001A] rounded-lg p-6">
            <div className="text-5xl md:text-4xl lg:text-5xl text-center mb-5">👥</div>
            <h3>Collaborate</h3>
            <p>
              Work alongside other artists to create something extraordinary.
            </p>
          </div>
          <div className="w-full bg-[#f5f5dc] shadow-md shadow-[#0000001A] rounded-lg p-6">
            <div className="text-5xl md:text-4xl lg:text-5xl text-center mb-5">🗳️</div>
            <h3>Vote on Contributions</h3>
            <p>
              Help maintain quality by voting on other artists' contributions.
            </p>
          </div>
        </section>

        <section className="current-projects">
          <div className="section-heading">
            <h2>Active Projects</h2>
            <p>Check the Contribute Page for all active projects</p>
          </div>
          <div className="project-grid">
            <div className="project-card active medieval-theme">
              <div className="project-image">
                <div className="image-loading">
                  <div className="loading-spinner"></div>
                </div>
                <img
                  src=""
                  alt="Medieval Town"
                  data-preview="medieval_town"
                  style={{ display: "none" }}
                />
                <div className="project-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: "0%" }}
                    ></div>
                  </div>
                  <div className="progress-text">0% Complete</div>
                </div>
              </div>
              <div className="project-info">
                <h3>Medieval Town</h3>
                <div className="project-stats">
                  <div className="stat">
                    <span className="stat-value" data-stat="contributors">
                      0
                    </span>
                    <span className="stat-label">Contributors</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value" data-stat="pixels">
                      0
                    </span>
                    <span className="stat-label">Pixels Painted</span>
                  </div>
                </div>
                <a href="/medieval-town" className="btn-contribute">
                  Enter Project
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HeroSection;
