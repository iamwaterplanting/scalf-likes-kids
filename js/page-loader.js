// Page Loader - Quick loading animation for tab switches
console.log('Page loader script loaded');

// Global variable to track if animations are already running
let animationsStarted = false;

// Create and add loader when page starts loading
document.addEventListener('DOMContentLoaded', () => {
    console.log('Creating page loader');
    createLoader();
    
    // Generate a random loading time between 0.2 and 0.44 seconds
    const loadingTime = Math.random() * (0.44 - 0.2) + 0.2;
    console.log(`Loading for ${loadingTime.toFixed(2)} seconds`);
    
    // Show loader for the random time
    setTimeout(() => {
        hideLoader();
        // Start page animations after loader is hidden
        startPageAnimations();
    }, loadingTime * 1000);
});

// Create loader element and add to page
function createLoader() {
    // Check if loader already exists
    if (document.getElementById('pageLoader')) {
        return;
    }
    
    // Create loader element
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-loader';
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'loader-spinner';
    
    // Create loading text
    const loadingText = document.createElement('div');
    loadingText.className = 'loader-text';
    loadingText.textContent = 'Loading...';
    
    // Add spinner and text to loader
    loader.appendChild(spinner);
    loader.appendChild(loadingText);
    
    // Add loader to the body
    document.body.appendChild(loader);
    
    // Prevent animations from starting before loader is done
    pausePageAnimations();
}

// Hide loader with fade effect
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('fade-out');
        
        // Remove loader after animation completes
        setTimeout(() => {
            if (loader && loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        }, 300); // Match the CSS transition time
    }
}

// Pause all existing page animations until loader completes
function pausePageAnimations() {
    // Set global flag to indicate animations should be paused
    animationsStarted = false;
    
    // Remove animation classes from elements with animations
    document.querySelectorAll('.slide-in').forEach(el => {
        el.classList.remove('animate-slide-in');
    });
    
    document.querySelectorAll('.floating').forEach(el => {
        el.style.animationPlayState = 'paused';
    });
    
    document.querySelectorAll('.rotate-slow').forEach(el => {
        el.style.animationPlayState = 'paused';
    });
    
    document.querySelectorAll('.pulse-slow').forEach(el => {
        el.style.animationPlayState = 'paused';
    });
    
    document.querySelectorAll('.bounce-slow').forEach(el => {
        el.style.animationPlayState = 'paused';
    });
}

// Start page animations after loader completes
function startPageAnimations() {
    if (animationsStarted) return;
    animationsStarted = true;
    
    // Add animation classes back
    const slideElements = document.querySelectorAll('.slide-in');
    slideElements.forEach((element, index) => {
        // Stagger the animations
        setTimeout(() => {
            element.classList.add('animate-slide-in');
        }, index * 100); // Reduced stagger time for quicker animation start
    });
    
    document.querySelectorAll('.floating, .rotate-slow, .pulse-slow, .bounce-slow').forEach(el => {
        el.style.animationPlayState = 'running';
    });
    
    // If animations.js exists in the page, call its init function
    if (typeof initAnimations === 'function') {
        console.log('Calling initAnimations from animations.js');
        initAnimations();
    }
    
    // Check for game-specific animations
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'hilo.html' && typeof startHiLoAnimations === 'function') {
        startHiLoAnimations();
    }
}

// Optional: Function to manually trigger loading animation on demand
function showPageLoading(callback, customTime = null) {
    createLoader();
    
    const loadingTime = customTime || Math.random() * (0.44 - 0.2) + 0.2;
    
    setTimeout(() => {
        hideLoader();
        if (typeof callback === 'function') {
            callback();
        }
    }, loadingTime * 1000);
}

// For game-specific animations, we'll create placeholder functions
// that games can implement if needed
function startHiLoAnimations() {
    console.log('Hi-Lo specific animations would start here');
    // Games can override this function with their own implementation
}

// Make available to global scope
window.PageLoader = {
    show: showPageLoading,
    hide: hideLoader
}; 