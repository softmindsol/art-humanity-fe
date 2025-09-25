
const Footer = () => {
  return (
    <footer className="flex flex-col justify-end ">


      <div className="flex flex-col lg:flex-row items-start w-[80%] sm:w-[90%] lg:w-[900px]  m-auto lg:items-start lg:justify-between gap-10 lg:gap-[110px]  pt-3 lg:pb-8">
        <div className="">
          <h2 className="text-[1.8rem] sm:!text-[2rem] !text-[#efebe9]  ">MurArt</h2>
          <p className="text-[14px] md:text-[16px] !italic">Collaborative Canvases of Human Expression</p>
        </div>
        <div className="flex !items-start gap-14  mb-2 ">
          <div className="footer-column ">
            <h3>Explore</h3>
            <ul>
              <li><a href="/gallery">Gallery</a></li>
              <li><a href="/projects">Projects</a></li>
              <li><a href="/guideline">Guideline</a></li>
            </ul>
          </div>
          <div className="footer-column ">
            <h3>Participate</h3>
            <ul>
              <li><a href="/projects">Join a Project</a></li>
              <li><a href="/demo">Try the Demo</a></li>

            </ul>
          </div>
          <div className="footer-column ">
            <h3>About</h3>
            <ul>
              <li><a href="/our-mission">Our Mission</a></li>
              <li><a href="#">Contact</a></li>
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