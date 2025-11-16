class CustomFooter extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Press+Start+2P&display=swap');
          
          :host {
            display: block;
            background-color: rgba(17, 24, 39, 0.8);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          footer {
            max-width: 1440px;
            margin: 0 auto;
            padding: 4rem 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 3rem;
          }
          
          .footer-brand {
            display: flex;
            flex-direction: column;
          }
          
          .footer-logo {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
          }
          
          .footer-logo img {
            height: 2.5rem;
            margin-right: 0.75rem;
          }
          
          * {
            font-family: 'Orbitron', sans-serif;
          }
          
          .footer-logo span {
            font-size: 0.875rem;
            font-weight: 700;
            color: white;
            font-family: 'Press Start 2P', cursive;
            line-height: 1.4;
          }
          
          .footer-text {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
          
          .footer-social {
            display: flex;
            gap: 1rem;
          }
          
          .footer-social a {
            color: rgba(255, 255, 255, 0.7);
            transition: color 0.2s;
          }
          
          .footer-social a:hover {
            color: white;
          }
          
          .footer-links h3 {
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            font-family: 'Press Start 2P', cursive;
            line-height: 1.6;
          }
          
          .footer-links ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .footer-links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: color 0.2s;
          }
          
          .footer-links a:hover {
            color: white;
          }
          
          .footer-bottom {
            grid-column: 1 / -1;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }
          
          .footer-copyright {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.875rem;
          }
          
          .footer-legal {
            display: flex;
            gap: 1.5rem;
          }
          
          .footer-legal a {
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.2s;
          }
          
          .footer-legal a:hover {
            color: white;
          }
          
          .solana-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
          }
          
          .solana-badge img {
            height: 1.25rem;
          }
          
          @media (max-width: 768px) {
            footer {
              grid-template-columns: 1fr;
            }
          }
        </style>
        
        <footer>
          <div class="footer-brand">
            <div class="footer-logo">
              <img src="imgages/logo.png" alt="Ludo Cities">
              <span>Ludo Cities</span>
            </div>
            <p class="footer-text">
              The ultimate Web3 board game experience on Solana blockchain. Play, earn, and collect.
            </p>
            <div class="footer-social">
              <a href="https://twitter.com/ludocities" aria-label="Twitter"><i data-feather="twitter"></i></a>
              <a href="https://discord.gg/ludocities" aria-label="Discord"><i data-feather="message-square"></i></a>
              <a href="https://t.me/ludocities" aria-label="Telegram"><i data-feather="send"></i></a>
            </div>
          </div>
          
          <div class="footer-links">
            <h3>Game</h3>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#gameplay">Gameplay</a></li>
              <li><a href="#tokenomics">Tokenomics</a></li>
              <li><a href="https://www.ludocities.com/whitepaper.pdf">Whitepaper</a></li>
            </ul>
          </div>
          
          <div class="footer-links">
            <h3>Resources</h3>
            <ul>
              <li><a href="https://docs.ludocities.com">Documentation</a></li>
              <li><a href="https://blog.ludocities.com">Blog</a></li>
              <li><a href="https://github.com/ludocities">GitHub</a></li>
              <li><a href="https://solscan.io/token/LUDO...">Token Contract</a></li>
            </ul>
          </div>
          
          <div class="footer-links">
            <h3>Company</h3>
            <ul>
              <li><a href="#team">About Us</a></li>
              <li><a href="mailto:contact@ludocities.com">Contact</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press Kit</a></li>
            </ul>
          </div>
          
          <div class="footer-bottom">
            <div class="footer-copyright">
              &copy; ${new Date().getFullYear()} Ludo Cities. All rights reserved.
            </div>
            
            <div class="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
            
            <div class="solana-badge">
              <span>Powered by</span>
              <img src="https://www.playsolana.com/_next/image?url=%2Fbrandkit%2Flogos%2FLogoMark.png&w=640&q=75" alt="Solana">
            </div>
          </div>
        </footer>
      `;
      
      // Initialize feather icons
      const featherScript = document.createElement('script');
      featherScript.src = 'https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js';
      this.shadowRoot.appendChild(featherScript);
      
      featherScript.onload = () => {
        if (window.feather) {
          window.feather.replace();
        }
      };
    }
  }
  
  customElements.define('custom-footer', CustomFooter);