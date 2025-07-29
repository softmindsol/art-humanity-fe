
const Footer = () => {
  return (
    <footer className="flex flex-col justify-end">


      <div className="footer-content">
        <div className="footer-logo">
          <h2>Project Art of Humanity</h2>
          <p>Collaborative Canvases of Human Expression</p>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h3>Explore</h3>
            <ul>
              <li><a href="/gallery">Gallery</a></li>
              <li><a href="/projects">Projects</a></li>
              <li><a href="/guideline">Guideline</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Participate</h3>
            <ul>
              <li><a href="/projects">Join a Project</a></li>
              <li><a href="/demo">Try the Demo</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>About</h3>
            <ul>
              <li><a href="/our-mission">Our Mission</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="copyright">
        <p>&copy; 2025 Project Art of Humanity. All rights reserved.</p>
        </div>   
    </footer>
  );
};

export default Footer;