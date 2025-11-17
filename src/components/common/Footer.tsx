import { Link } from "react-router-dom";
import { FaYoutube, FaTiktok, FaInstagram, FaDiscord } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="flex flex-col justify-end ">


      <div className="flex flex-col lg:flex-row justify-center items-start  lg:gap-[13.5rem] xl:gap-[28.5rem]">

        <span className="logo-link-footer">
          <img src="/favicon.PNG" alt="Logo" className="logo -ml-4 md:-ml-0 lg:-ml-4" />
          <div>
            <div className=" ">
              <h1 className='text-[1.8rem] sm:!text-[2rem] !text-[#efebe9]  '>MurArt</h1>
              <p className="text-[14px] md:text-[16px] !italic !text-[#efebe9]">Collaborative Canvases of Human Expression</p>
            </div>
            <div className="flex my-4">
              <a href="https://www.youtube.com/@MurArtio" target="_blank" rel="noopener noreferrer" className="!text-white mr-4 text-2xl hover:text-gray-400">
                <FaYoutube />
              </a>
              <a href="https://www.tiktok.com/@murart.io" target="_blank" rel="noopener noreferrer" className="!text-white mx-4 text-2xl hover:text-gray-400">
                <FaTiktok />
              </a>
              <a href="https://www.instagram.com/murart.io" target="_blank" rel="noopener noreferrer" className="!text-white mx-4 text-2xl hover:text-gray-400">
                <FaInstagram />
              </a>
              <a href="https://discord.gg/ZGWB9zZF" target="_blank" rel="noopener noreferrer" className="!text-white mx-4 text-2xl hover:text-gray-400">
                <FaDiscord />
              </a>
            </div>
          </div>

        </span>
        <div className="flex lg:!items-start md:gap-14  mb-2 ">
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