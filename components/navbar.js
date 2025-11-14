class CustomNavbar extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Press+Start+2P&display=swap');
          
          :host {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
            background-color: rgba(17, 24, 39, 0.8);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            max-width: 1440px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
            gap: 1rem;
          }
          
          * {
            font-family: 'Orbitron', sans-serif;
          }
          
          .logo {
            display: flex;
            align-items: center;
            font-size: 0.75rem;
            font-weight: 700;
            color: white;
            text-decoration: none;
            z-index: 1001;
            font-family: 'Press Start 2P', cursive;
            line-height: 1.4;
          }
          
          .logo img {
            height: 2rem;
            margin-right: 0.5rem;
          }
          
          .nav-links {
            display: flex;
            gap: 1.5rem;
            list-style: none;
            margin: 0;
            padding: 0;
            flex-shrink: 0;
          }
          
          .nav-links li {
            flex-shrink: 0;
          }
          
          .nav-links a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
            position: relative;
            cursor: pointer;
            font-size: 0.95rem;
          }
          
          .nav-links a:hover {
            color: white;
          }
          
          .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, #8b5cf6, #ec4899);
            transition: width 0.3s;
          }
          
          .nav-links a:hover::after {
            width: 100%;
          }
          
          .nav-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-shrink: 0;
          }
          
          .wallet-btn {
            background-color: #8b5cf6;
            color: white;
            border: none;
            padding: 0.5rem 1.25rem;
            border-radius: 9999px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            white-space: nowrap;
            font-size: 0.875rem;
          }
          
          .wallet-btn:hover {
            background-color: #7c3aed;
          }
          
          .wallet-btn i {
            margin-right: 0.5rem;
          }
          
          .social-links {
            display: flex;
            gap: 0.75rem;
            align-items: center;
          }
          
          .social-link {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            transition: color 0.2s, transform 0.2s;
            display: flex;
            align-items: center;
            padding: 0.5rem;
          }
          
          .social-link:hover {
            color: white;
            transform: translateY(-2px);
          }
          
          .mobile-menu-btn {
            display: none;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.5rem;
            z-index: 1001;
          }
          
          .mobile-menu {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 80%;
            max-width: 400px;
            background: rgba(17, 24, 39, 0.98);
            backdrop-filter: blur(20px);
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            overflow-y: auto;
            padding-top: 6rem;
            z-index: 1002;
          }
          
          .mobile-menu.active {
            transform: translateX(0);
          }
          
          .mobile-menu-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
            pointer-events: none;
            z-index: 1001;
          }
          
          .mobile-menu-overlay.active {
            opacity: 1;
            visibility: visible;
            pointer-events: all;
          }
          
          .mobile-menu .nav-links {
            display: flex;
            flex-direction: column;
            gap: 0;
            padding: 2rem;
            list-style: none;
          }
          
          .mobile-menu .nav-links li {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1.5rem 0;
          }
          
          .mobile-menu .nav-links a {
            font-size: 1.5rem;
            display: block;
          }
          
          .mobile-menu .nav-actions {
            padding: 2rem;
            margin-top: auto;
          }
          
          @media (max-width: 1200px) {
            .nav-links {
              gap: 1rem;
            }
            
            .nav-links a {
              font-size: 0.875rem;
            }
            
            .wallet-btn {
              padding: 0.5rem 1rem;
              font-size: 0.875rem;
            }
          }
          
          @media (max-width: 900px) {
            .nav-links {
              gap: 0.75rem;
            }
            
            .nav-links a {
              font-size: 0.8125rem;
            }
            
            .wallet-btn {
              padding: 0.5rem 0.875rem;
              font-size: 0.8125rem;
            }
            
            .wallet-btn i {
              margin-right: 0.375rem;
            }
          }
          
          @media (max-width: 1024px) {
            nav {
              padding: 1rem;
              gap: 0.5rem;
            }
            
            .logo {
              font-size: 1rem;
              flex-shrink: 1;
              min-width: 0;
            }
            
            .logo img {
              height: 1.75rem;
            }
            
            .nav-links,
            .nav-actions {
              display: none;
            }
            
            .mobile-menu-btn {
              display: block;
              flex-shrink: 0;
            }
            
            .mobile-menu {
              display: block;
            }
            
            .mobile-menu .social-links {
              display: flex;
              margin-bottom: 1rem;
            }
          }
          
          @media (max-width: 640px) {
            nav {
              padding: 0.75rem 0.5rem;
            }
            
            .logo {
              font-size: 0.625rem;
              white-space: nowrap;
              overflow: hidden;
            }
            
            .logo img {
              height: 1.5rem;
              margin-right: 0.25rem;
            }
            
            .wallet-btn {
              padding: 0.5rem 1rem;
              font-size: 0.75rem;
            }
            
            .wallet-btn i {
              margin-right: 0.25rem;
            }
          }
        </style>
        
        <nav>
          <a href="#" class="logo">
              <img src="https://www.ludocities.com/img/logo.png" alt="Ludo Cities">
            Ludo Cities
          </a>
          
          <ul class="nav-links" id="desktop-nav">
            <li><a data-section="features">Features</a></li>
            <li><a data-section="gameplay">Gameplay</a></li>
            <li><a data-section="tokenomics">Tokenomics</a></li>
            <li><a data-section="traction">Traction</a></li>
            <li><a data-section="socials">Socials</a></li>
          </ul>
          
          <div class="nav-actions">
            <div class="social-links">
              <a href="#" class="social-link" aria-label="Discord">
                <i data-feather="discord"></i>
              </a>
              <a href="https://twitter.com/ludocities" class="social-link" aria-label="Twitter">
                <i data-feather="twitter"></i>
              </a>
            </div>
           
          </div>
          
          <button class="mobile-menu-btn" id="mobile-menu-toggle">
            <i data-feather="menu"></i>
          </button>
        </nav>
        
        <div class="mobile-menu-overlay" id="menu-overlay"></div>
        <div class="mobile-menu" id="mobile-menu">
          <ul class="nav-links">
            <li><a data-section="features">Features</a></li>
            <li><a data-section="gameplay">Gameplay</a></li>
            <li><a data-section="tokenomics">Tokenomics</a></li>
            <li><a data-section="traction">Traction</a></li>
            <li><a data-section="socials">Socials</a></li>
          </ul>
          <div class="nav-actions">
            <div class="social-links">
              <a href="#" class="social-link" aria-label="Discord">
                <i data-feather="discord"></i>
              </a>
              <a href="https://twitter.com/ludocities" class="social-link" aria-label="Twitter">
                <i data-feather="twitter"></i>
              </a>
            </div>
          
          </div>
        </div>
      `;
      
      // Initialize feather icons
      const featherScript = document.createElement('script');
      featherScript.src = 'https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js';
      this.shadowRoot.appendChild(featherScript);
      
      featherScript.onload = () => {
        if (window.feather) {
          window.feather.replace();
        }
        
        // Add click handlers for navigation
        const links = this.shadowRoot.querySelectorAll('[data-section]');
        links.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = link.getAttribute('data-section');
            this.scrollToSection(sectionName);
            
            // Close mobile menu if open
            const mobileMenu = this.shadowRoot.getElementById('mobile-menu');
            const menuOverlay = this.shadowRoot.getElementById('menu-overlay');
            const mobileMenuToggle = this.shadowRoot.getElementById('mobile-menu-toggle');
            
            if (mobileMenu.classList.contains('active')) {
              mobileMenu.classList.remove('active');
              menuOverlay.classList.remove('active');
              
              // Update icon back to menu
              const icon = mobileMenuToggle.querySelector('i');
              icon.setAttribute('data-feather', 'menu');
              window.feather.replace();
            }
          });
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = this.shadowRoot.getElementById('mobile-menu-toggle');
        const mobileMenu = this.shadowRoot.getElementById('mobile-menu');
        const menuOverlay = this.shadowRoot.getElementById('menu-overlay');
        
        const toggleMenu = () => {
          mobileMenu.classList.toggle('active');
          menuOverlay.classList.toggle('active');
          
          // Update icon
          const icon = mobileMenuToggle.querySelector('i');
          if (mobileMenu.classList.contains('active')) {
            icon.setAttribute('data-feather', 'x');
          } else {
            icon.setAttribute('data-feather', 'menu');
          }
          window.feather.replace();
        };
        
        mobileMenuToggle.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', toggleMenu);
      };
    }
    
    scrollToSection(sectionName) {
      const section = document.getElementById(sectionName);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  
  customElements.define('custom-navbar', CustomNavbar);