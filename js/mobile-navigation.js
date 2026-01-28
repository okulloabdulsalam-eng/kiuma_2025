/**
 * Mobile Navigation System with Back Button Support
 * 
 * This system ensures proper step-by-step navigation through all pages
 * using the phone's back button and browser history.
 */

class MobileNavigationManager {
    constructor() {
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.navigationHistory = [];
        this.maxHistoryLength = 20;
        this.init();
    }

    init() {
        // Initialize navigation history
        this.updateNavigationHistory();
        
        // Add mobile back button to UI
        this.addMobileBackButton();
        
        // Listen for browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Listen for page visibility changes (app switching)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateNavigationHistory();
            }
        });

        // Override all navigation links to use history API
        this.overrideNavigationLinks();
        
        // Add back button listener for mobile
        this.setupMobileBackButton();
        
        console.log('[Mobile Navigation] Initialized with back button support');
    }

    /**
     * Add mobile back button to the UI
     */
    addMobileBackButton() {
        // Create back button
        const backButton = document.createElement('button');
        backButton.id = 'mobileBackButton';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        backButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 15px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        `;

        // Add hover effects
        backButton.addEventListener('mouseenter', () => {
            backButton.style.background = 'rgba(0, 0, 0, 0.9)';
            backButton.style.transform = 'scale(1.1)';
        });

        backButton.addEventListener('mouseleave', () => {
            backButton.style.background = 'rgba(0, 0, 0, 0.7)';
            backButton.style.transform = 'scale(1)';
        });

        // Add click handler
        backButton.addEventListener('click', () => {
            this.handleMobileBackButton();
        });

        // Add to page
        document.body.appendChild(backButton);
        
        // Hide on home page
        if (this.currentPage === 'index.html' || this.currentPage === '') {
            backButton.style.display = 'none';
        }
        
        console.log('[Mobile Navigation] Back button added to UI');
    }

    /**
     * Navigate to a new page with proper history management
     */
    navigateTo(page, options = {}) {
        const { addToHistory = true, replaceState = false, state = {} } = options;
        
        // Normalize page name
        if (!page.includes('.html') && page !== '') {
            page = page + '.html';
        }
        
        // Update navigation history
        if (addToHistory && !replaceState) {
            this.navigationHistory.push({
                page: this.currentPage,
                timestamp: Date.now(),
                state: state
            });
            
            // Limit history length
            if (this.navigationHistory.length > this.maxHistoryLength) {
                this.navigationHistory.shift();
            }
        }

        // Update current page
        this.currentPage = page;
        
        // Update back button visibility
        this.updateBackButtonVisibility();

        // Update browser history
        const url = page === 'index.html' ? './' : page;
        
        if (replaceState) {
            window.history.replaceState(state, '', url);
        } else {
            window.history.pushState(state, '', url);
        }

        // Navigate to the page
        if (page === 'index.html' || page === '') {
            window.location.href = './';
        } else {
            window.location.href = page;
        }
    }

    /**
     * Update back button visibility based on current page
     */
    updateBackButtonVisibility() {
        const backButton = document.getElementById('mobileBackButton');
        if (backButton) {
            // Hide on home page, show on all other pages
            if (this.currentPage === 'index.html' || this.currentPage === '') {
                backButton.style.display = 'none';
            } else {
                backButton.style.display = 'flex';
            }
        }
    }

    /**
     * Handle browser back/forward button clicks
     */
    handlePopState(event) {
        if (event.state && event.state.fromMobileNavigation) {
            console.log('[Mobile Navigation] Handling back/forward navigation');
            this.updateNavigationHistory();
        }
    }

    /**
     * Override all navigation links to use history API
     */
    overrideNavigationLinks() {
        // Find all navigation links
        const links = document.querySelectorAll('a[href$=".html"], a[href="./"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip external links and special links
            if (href.startsWith('http') || href.startsWith('#') || href.includes('mailto:') || href.includes('tel:')) {
                return;
            }

            // Add click listener for smooth navigation
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Extract page name from href
                let page = href;
                if (href === './' || href === '') {
                    page = 'index.html';
                } else if (href.startsWith('./')) {
                    page = href.substring(2);
                }
                
                // Navigate with history
                this.navigateTo(page, {
                    state: { fromMobileNavigation: true, timestamp: Date.now() }
                });
            });
        });
    }

    /**
     * Setup mobile back button support
     */
    setupMobileBackButton() {
        // For Android devices with hardware back buttons
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.App) {
            Capacitor.Plugins.App.addListener('backButton', () => {
                this.handleMobileBackButton();
            });
        }

        // Add keyboard back button support for mobile browsers
        document.addEventListener('keydown', (e) => {
            // Alt + Left Arrow (back button equivalent)
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.handleMobileBackButton();
            }
        });
    }

    /**
     * Handle mobile back button press
     */
    handleMobileBackButton() {
        console.log('[Mobile Navigation] Back button pressed');
        
        // If we have navigation history, go back
        if (this.navigationHistory.length > 0) {
            const previousPage = this.navigationHistory.pop();
            
            // Navigate back to previous page
            if (previousPage.page === 'index.html' || previousPage.page === '') {
                window.history.back();
            } else {
                window.location.href = previousPage.page;
            }
        } else {
            // No history, go to home page
            if (this.currentPage !== 'index.html' && this.currentPage !== '') {
                this.navigateTo('index.html', { replaceState: true });
            } else {
                // Already on home page, exit app (if in mobile app)
                if (typeof navigator !== 'undefined' && navigator.app) {
                    navigator.app.exitApp();
                }
            }
        }
    }

    /**
     * Update navigation history based on current state
     */
    updateNavigationHistory() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        // Only update if page actually changed
        if (currentPage !== this.currentPage) {
            this.currentPage = currentPage;
            
            // Add to history if not already there
            const exists = this.navigationHistory.some(item => item.page === currentPage);
            if (!exists && currentPage !== 'index.html') {
                this.navigationHistory.push({
                    page: currentPage,
                    timestamp: Date.now(),
                    state: { fromMobileNavigation: true }
                });
            }
        }
    }

    /**
     * Get current navigation path
     */
    getCurrentPath() {
        return this.navigationHistory.map(item => item.page);
    }

    /**
     * Clear navigation history
     */
    clearHistory() {
        this.navigationHistory = [];
        console.log('[Mobile Navigation] History cleared');
    }

    /**
     * Add breadcrumb navigation
     */
    addBreadcrumbs() {
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'mobile-breadcrumbs';
        breadcrumbContainer.style.cssText = `
            padding: 10px 15px;
            background: #f5f5f5;
            border-bottom: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            display: flex;
            align-items: center;
            gap: 5px;
        `;

        const path = this.getCurrentPath();
        if (path.length > 0) {
            const breadcrumbText = path.join(' > ');
            breadcrumbContainer.innerHTML = `<i class="fas fa-home"></i> > ${breadcrumbText}`;
        }

        // Insert at the top of the body
        const existing = document.querySelector('.mobile-breadcrumbs');
        if (existing) {
            existing.remove();
        }
        
        document.body.insertBefore(breadcrumbContainer, document.body.firstChild);
    }
}

// Initialize mobile navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileNavigation = new MobileNavigationManager();
    
    // Add global navigation function for easy access
    window.navigateToPage = (page, options) => {
        if (window.mobileNavigation) {
            window.mobileNavigation.navigateTo(page, options);
        }
    };
    
    // Add back button function
    window.goBack = () => {
        if (window.mobileNavigation) {
            window.mobileNavigation.handleMobileBackButton();
        }
    };
    
    console.log('[Mobile Navigation] Global functions attached');
});
