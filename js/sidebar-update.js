// Script to ensure all sidebars include the Hi-Lo game
document.addEventListener('DOMContentLoaded', function() {
    // Find the sidebar navigation
    const sidebarNav = document.querySelector('.main-nav ul');
    
    if (sidebarNav) {
        // Check if Hi-Lo is already in the sidebar
        const hiloLink = Array.from(sidebarNav.querySelectorAll('li a')).find(a => 
            a.textContent.trim().includes('Hi-Lo') || 
            a.innerHTML.includes('fa-exchange-alt')
        );
        
        // If Hi-Lo link doesn't exist, add it
        if (!hiloLink) {
            // Get the path prefix based on current page location
            const isHomePage = window.location.pathname.endsWith('index.html') || 
                               window.location.pathname.endsWith('/');
            const pathPrefix = isHomePage ? 'games/' : '';
            
            // Create the new Hi-Lo list item
            const hiloItem = document.createElement('li');
            hiloItem.innerHTML = `<a href="${pathPrefix}hilo.html"><i class="fas fa-exchange-alt"></i> Hi-Lo</a>`;
            
            // Find the position to insert (before Flappy Bird)
            const flappyBirdItem = Array.from(sidebarNav.querySelectorAll('li')).find(li => 
                li.textContent.includes('Flappy Bird') || 
                li.innerHTML.includes('fa-dove')
            );
            
            if (flappyBirdItem) {
                sidebarNav.insertBefore(hiloItem, flappyBirdItem);
            } else {
                // If Flappy Bird is not found, just append to the end
                sidebarNav.appendChild(hiloItem);
            }
        }
    }
}); 