// Apply consistent sidebar styling across all pages
document.addEventListener('DOMContentLoaded', function() {
    // Apply enhanced sidebar styling
    const sidebar = document.querySelector('.sidebar');
    const logo = document.querySelector('.logo');
    const mainNav = document.querySelector('.main-nav');
    
    if (sidebar && logo && mainNav) {
        // Apply enhanced box shadow to sidebar
        sidebar.style.boxShadow = '5px 0 15px rgba(0, 0, 0, 0.2)';
        
        // Center and enhance the logo
        logo.style.textAlign = 'center';
        logo.style.marginBottom = '40px';
        
        // Add version tag if not already present
        if (!logo.querySelector('.version-tag')) {
            const versionTag = document.createElement('div');
            versionTag.className = 'version-tag';
            versionTag.textContent = 'Beta v0.9';
            logo.appendChild(versionTag);
            
            // Add styles for version tag if not present
            if (!document.querySelector('#version-tag-style')) {
                const versionStyle = document.createElement('style');
                versionStyle.id = 'version-tag-style';
                versionStyle.textContent = `
                    .version-tag {
                        font-size: 12px;
                        color: var(--primary-color);
                        opacity: 0.8;
                        margin-top: -5px;
                        letter-spacing: 1px;
                        font-weight: 600;
                        text-shadow: 0 0 10px rgba(24, 231, 124, 0.3);
                    }
                `;
                document.head.appendChild(versionStyle);
            }
        }
        
        const logoText = logo.querySelector('h1');
        if (logoText) {
            logoText.style.fontSize = '28px';
            logoText.style.fontWeight = '800';
            logoText.style.letterSpacing = '2px';
            logoText.style.marginBottom = '5px';
            
            // Enhanced glow effect
            const glowTextElement = document.querySelector('.glow-text');
            if (glowTextElement) {
                glowTextElement.style.textShadow = '0 0 15px rgba(24, 231, 124, 0.7), 0 0 30px rgba(24, 231, 124, 0.4), 0 0 5px rgba(255, 255, 255, 0.5)';
                
                // Add animation if it doesn't exist
                if (!document.querySelector('#logo-pulse-animation')) {
                    const styleElement = document.createElement('style');
                    styleElement.id = 'logo-pulse-animation';
                    styleElement.textContent = `
                        @keyframes logo-pulse {
                            0% { text-shadow: 0 0 15px rgba(24, 231, 124, 0.7), 0 0 30px rgba(24, 231, 124, 0.4), 0 0 5px rgba(255, 255, 255, 0.3); }
                            100% { text-shadow: 0 0 25px rgba(24, 231, 124, 0.9), 0 0 50px rgba(24, 231, 124, 0.6), 0 0 10px rgba(255, 255, 255, 0.5); }
                        }
                        .glow-text {
                            animation: logo-pulse 3s infinite alternate;
                        }
                    `;
                    document.head.appendChild(styleElement);
                }
            }
            
            // Bold the GAMES part of the logo
            const spanElement = logoText.querySelector('span');
            if (spanElement) {
                spanElement.style.fontWeight = '900';
            }
        }
        
        // Enhance nav items
        const navItems = mainNav.querySelectorAll('li');
        navItems.forEach(item => {
            item.style.padding = '16px 20px';
            item.style.marginBottom = '6px';
            item.style.borderRadius = '8px';
            item.style.transition = 'background-color 0.3s, transform 0.2s, box-shadow 0.3s';
            
            // Enhanced hover effect
            item.addEventListener('mouseover', function() {
                if (!this.classList.contains('active')) {
                    this.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                    this.style.transform = 'translateX(7px)';
                    this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }
            });
            
            item.addEventListener('mouseout', function() {
                if (!this.classList.contains('active')) {
                    this.style.backgroundColor = '';
                    this.style.transform = '';
                    this.style.boxShadow = '';
                }
            });
            
            // Apply active styles if active
            if (item.classList.contains('active')) {
                item.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
                item.style.transform = 'translateX(7px)';
                item.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }
            
            // Enhance indicator bar
            const beforeStyle = document.createElement('style');
            beforeStyle.textContent = `
                .main-nav li::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 4px;
                    background-color: var(--primary-color);
                    transform: scaleY(0);
                    transition: transform 0.3s;
                    box-shadow: 0 0 10px rgba(24, 231, 124, 0.5);
                }
                
                .main-nav li:hover::before, .main-nav li.active::before {
                    transform: scaleY(1);
                }
            `;
            document.head.appendChild(beforeStyle);
            
            // Enhance nav links
            const link = item.querySelector('a');
            if (link) {
                link.style.fontSize = '16px';
                link.style.fontWeight = '500';
                link.style.letterSpacing = '0.5px';
                
                // Enhance icons
                const icon = link.querySelector('i');
                if (icon) {
                    icon.style.marginRight = '12px';
                    icon.style.width = '24px';
                    icon.style.fontSize = '18px';
                    
                    // Icon hover effect
                    item.addEventListener('mouseover', function() {
                        icon.style.transform = 'scale(1.2)';
                        icon.style.color = '#ffffff';
                    });
                    
                    item.addEventListener('mouseout', function() {
                        if (!this.classList.contains('active')) {
                            icon.style.transform = '';
                            icon.style.color = '';
                        }
                    });
                    
                    // Apply active styles if active
                    if (item.classList.contains('active')) {
                        icon.style.transform = 'scale(1.2)';
                        icon.style.color = '#ffffff';
                    }
                }
            }
        });
    }
    
    // Add padding to nav list
    const navList = document.querySelector('.main-nav ul');
    if (navList) {
        navList.style.padding = '0 10px';
    }

    // Add release banner to game pages if it doesn't exist
    if (!document.querySelector('.release-banner') && window.location.pathname.includes('/games/')) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            // Create release banner
            const banner = document.createElement('div');
            banner.className = 'release-banner';
            banner.innerHTML = `
                <i class="fas fa-info-circle"></i> Beta release, official full release will be from May 30 - June 7
                <button class="close-banner"><i class="fas fa-times"></i></button>
            `;
            
            // Insert banner at the top of main content
            const firstChild = mainContent.firstChild;
            mainContent.insertBefore(banner, firstChild);
            
            // Add banner styles if not present
            if (!document.querySelector('#release-banner-style')) {
                const bannerStyle = document.createElement('style');
                bannerStyle.id = 'release-banner-style';
                bannerStyle.textContent = `
                    .release-banner {
                        background: linear-gradient(90deg, rgba(24, 231, 124, 0.15), rgba(24, 231, 124, 0.05));
                        padding: 10px 20px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        border-left: 4px solid var(--primary-color);
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        font-size: 14px;
                        position: relative;
                    }
                    
                    .release-banner i {
                        color: var(--primary-color);
                        margin-right: 10px;
                    }
                    
                    .close-banner {
                        background: none;
                        border: none;
                        color: rgba(255, 255, 255, 0.7);
                        cursor: pointer;
                        padding: 0 5px;
                        transition: color 0.2s;
                    }
                    
                    .close-banner:hover {
                        color: #fff;
                    }
                    
                    @media (max-width: 768px) {
                        .release-banner {
                            font-size: 12px;
                            padding: 8px 15px;
                        }
                    }
                `;
                document.head.appendChild(bannerStyle);
            }
            
            // Add close button functionality
            const closeButton = banner.querySelector('.close-banner');
            if (closeButton) {
                closeButton.addEventListener('click', function() {
                    banner.style.display = 'none';
                    // Store in localStorage to remember user closed it
                    localStorage.setItem('release_banner_closed', 'true');
                });
                
                // Check if user previously closed the banner
                if (localStorage.getItem('release_banner_closed') === 'true') {
                    banner.style.display = 'none';
                }
            }
        }
    }
}); 