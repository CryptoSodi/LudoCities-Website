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
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.05);
          }
          
          .footer-social a:hover {
            color: white;
            background: rgba(139, 92, 246, 0.3);
            transform: translateY(-2px);
          }
          
          .footer-social svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
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
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .footer-links a:hover {
            color: white;
          }
          
          .footer-links a svg {
            width: 14px;
            height: 14px;
            opacity: 0;
            transition: opacity 0.2s;
          }
          
          .footer-links a:hover svg {
            opacity: 1;
          }
          
          .external-link {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
          }
          
          .external-link svg {
            width: 12px;
            height: 12px;
            opacity: 0.5;
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
            height: 1.5rem;
          }
          
          @media (max-width: 768px) {
            footer {
              grid-template-columns: 1fr;
            }
            
            .footer-bottom {
              flex-direction: column;
              text-align: center;
            }
            
            .footer-legal {
              flex-wrap: wrap;
              justify-content: center;
            }
          }
        </style>
        
        <footer>
          <div class="footer-brand">
            <div class="footer-logo">
              <img src="images/logo.png" alt="Ludo Cities">
              <span>Ludo Cities</span>
            </div>
            <p class="footer-text">
              The ultimate Web3 board game experience on Solana blockchain. Play, earn, and collect.
            </p>
            <div class="footer-social">
              <a href="https://twitter.com/ludocities" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://discord.gg/v7D3EprRdY" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.08.08 0 0 0-.084.04c-.21.375-.444.864-.608 1.249a18.18 18.18 0 0 0-5.454 0 12.5 12.5 0 0 0-.617-1.249.08.08 0 0 0-.084-.04A19.79 19.79 0 0 0 3.68 4.369a.08.08 0 0 0-.038.03C.533 9.046-.32 13.58.099 18.057a.09.09 0 0 0 .032.058 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .09-.03c.462-.63.874-1.296 1.226-1.995a.08.08 0 0 0-.043-.109 13 13 0 0 1-1.872-.892.08.08 0 0 1-.01-.13c.127-.094.253-.192.373-.291a.08.08 0 0 1 .084-.011c3.927 1.793 8.18 1.793 12.061 0a.08.08 0 0 1 .085.01c.12.1.246.199.373.293a.08.08 0 0 1-.008.13 12.3 12.3 0 0 1-1.873.89.08.08 0 0 0-.042.11c.36.699.773 1.364 1.226 1.994a.08.08 0 0 0 .09.03 19.87 19.87 0 0 0 6.002-3.03.08.08 0 0 0 .032-.057c.5-5.177-.838-9.673-3.548-13.662a.07.07 0 0 0-.035-.03ZM8.02 15.33c-1.183 0-2.157-1.084-2.157-2.419 0-1.335.96-2.42 2.157-2.42 1.213 0 2.177 1.095 2.157 2.42 0 1.335-.953 2.42-2.157 2.42Zm7.974 0c-1.183 0-2.157-1.084-2.157-2.419 0-1.335.953-2.42 2.157-2.42 1.213 0 2.177 1.095 2.157 2.42 0 1.335-.944 2.42-2.157 2.42Z"/>
                </svg>
              </a>
              <a href="https://t.me/ludocities" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div class="footer-links">
            <h3>Game</h3>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#gameplay">Gameplay</a></li>
              <li><a href="#roadmap">Roadmap</a></li>
              <li>
                <a href="https://ludo-cities.gitbook.io/ludo-cities-whitepaper/" target="_blank" rel="noopener noreferrer" class="external-link">
                  Whitepaper
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          
          <div class="footer-links">
            <h3>Resources</h3>
            <ul>
              <li>
                <a href="https://ludo-cities.gitbook.io/ludo-cities-whitepaper/" target="_blank" rel="noopener noreferrer" class="external-link">
                  Documentation
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://play.google.com/store/apps/details?id=com.ludoengine.ludocities" target="_blank" rel="noopener noreferrer" class="external-link">
                  Google Play
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://github.com/ludocities" target="_blank" rel="noopener noreferrer" class="external-link">
                  GitHub
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          
          <div class="footer-links">
            <h3>Community</h3>
            <ul>
              <li>
                <a href="https://discord.gg/v7D3EprRdY" target="_blank" rel="noopener noreferrer" class="external-link">
                  Discord
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://twitter.com/ludocities" target="_blank" rel="noopener noreferrer" class="external-link">
                  Twitter / X
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://t.me/ludocities" target="_blank" rel="noopener noreferrer" class="external-link">
                  Telegram
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
              <li><a href="mailto:contact@ludocities.com">Contact Us</a></li>
            </ul>
          </div>
          
          <div class="footer-bottom">
            <div class="footer-copyright">
              &copy; ${new Date().getFullYear()} Ludo Cities. All rights reserved.
            </div>
            
            <div class="footer-legal">
              <a href="https://ludo-cities.gitbook.io/ludo-cities-whitepaper/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <a href="https://ludo-cities.gitbook.io/ludo-cities-whitepaper/" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            </div>
            
            <div class="solana-badge">
              <span>Powered by</span>
              <img src="https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png" alt="Solana">
            </div>
          </div>
        </footer>
      `;
    }
  }
  
  customElements.define('custom-footer', CustomFooter);
