import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="flex flex-col justify-end ">


      <div className="flex flex-col lg:flex-row items-start w-[90%] lg:w-[900px]  m-auto lg:items-start lg:justify-between gap-10 lg:gap-[110px]  pt-3 lg:pb-8">
        <div className="">
          <h2 className="text-[1.8rem] sm:!text-[2rem] !text-[#efebe9]  ">MurArt</h2>
          <p className="text-[14px] md:text-[16px] !italic">Collaborative Canvases of Human Expression</p>
        </div>
        <div className="flex !items-start gap-14  mb-2 ">
          <div className="footer-column ">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li><Link to="/guideline">Guideline</Link></li>
            </ul>
          </div>
          <div className="footer-column ">
            <h3>Participate</h3>
            <ul>
              <li><Link to="/projects">Join a Project</Link></li>
              <li><Link to="/demo">Try the Demo</Link></li>

            </ul>
          </div>
          <div className="footer-column ">
            <h3>About</h3>
            <ul>
              {/* <li><a href="/our-mission">Our Mission</a></li> */}
              <li><Link to="contact-us">Contact</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="copyright">
        <p>&copy; 2025 MurArt. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;