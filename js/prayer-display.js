/**
 * Prayer Times Display Manager
 * Handles displaying prayer times with automatic next prayer highlighting
 */

class PrayerDisplayManager {
    constructor() {
        this.prayerTimes = window.staticPrayerTimes;
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.createPrayerTimesHTML();
        this.updateDisplay();
        this.startAutoUpdate();
    }

    /**
     * Create prayer times HTML structure
     */
    createPrayerTimesHTML() {
        const prayerContainer = document.getElementById('prayer-times-container');
        if (!prayerContainer) {
            console.warn('Prayer times container not found');
            return;
        }

        prayerContainer.innerHTML = `
            <div class="prayer-times-header">
                <h3>Prayer Times</h3>
                <div class="current-time" id="current-time"></div>
                <div class="friday-indicator" id="friday-indicator" style="display: none;">
                    🕌 Friday - Juma Prayer
                </div>
            </div>
            <div class="next-prayer-highlight" id="next-prayer-highlight">
                <div class="next-prayer-label">Next Prayer:</div>
                <div class="next-prayer-name" id="next-prayer-name"></div>
                <div class="next-prayer-time" id="next-prayer-time"></div>
                <div class="next-prayer-countdown" id="next-prayer-countdown"></div>
            </div>
            <div class="prayer-times-list" id="prayer-times-list">
                <!-- Prayer times will be populated here -->
            </div>
        `;
    }

    /**
     * Update the prayer times display
     */
    updateDisplay() {
        if (!this.prayerTimes) return;

        // Update current time
        this.updateCurrentTime();
        
        // Get prayer times data
        const data = this.prayerTimes.getDisplayPrayerTimes();
        
        // Update Friday indicator
        this.updateFridayIndicator(data.isFriday);
        
        // Update next prayer highlight
        this.updateNextPrayer(data.nextPrayer);
        
        // Update prayer times list
        this.updatePrayerList(data.times);
    }

    /**
     * Update current time display
     */
    updateCurrentTime() {
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    /**
     * Update Friday indicator
     */
    updateFridayIndicator(isFriday) {
        const indicator = document.getElementById('friday-indicator');
        if (indicator) {
            indicator.style.display = isFriday ? 'block' : 'none';
        }
    }

    /**
     * Update next prayer highlight
     */
    updateNextPrayer(nextPrayer) {
        const nameElement = document.getElementById('next-prayer-name');
        const timeElement = document.getElementById('next-prayer-time');
        const countdownElement = document.getElementById('next-prayer-countdown');

        if (nameElement && timeElement && countdownElement) {
            nameElement.textContent = nextPrayer.displayName;
            timeElement.textContent = this.prayerTimes.formatTime(nextPrayer.time);
            
            // Format countdown
            if (nextPrayer.hoursUntil > 0) {
                countdownElement.textContent = `in ${nextPrayer.hoursUntil}h ${nextPrayer.minutesUntilPrayer}m`;
            } else {
                countdownElement.textContent = `in ${nextPrayer.minutesUntilPrayer} minutes`;
            }

            // Add special styling for Juma
            const highlightDiv = document.getElementById('next-prayer-highlight');
            if (nextPrayer.isJuma) {
                highlightDiv.classList.add('juma-highlight');
            } else {
                highlightDiv.classList.remove('juma-highlight');
            }
        }
    }

    /**
     * Update prayer times list - Show both next prayer and full table
     */
    updatePrayerList(times) {
        const container = document.getElementById('prayer-times-container');
        if (!container) return;

        // Find the next prayer
        let nextPrayer = null;
        for (const [prayerName, prayerData] of Object.entries(times)) {
            if (prayerData.isNext) {
                nextPrayer = prayerData;
                break;
            }
        }

        let html = '';

        // Add next prayer display at the top
        if (nextPrayer) {
            const jumaClass = nextPrayer.isJuma ? 'juma-prayer' : '';
            html += `
                <div class="next-prayer-display ${jumaClass}">
                    <div class="next-prayer-header">
                        <i class="fas fa-mosque"></i>
                        <span class="next-prayer-label">Next Prayer</span>
                    </div>
                    <div class="next-prayer-name">${nextPrayer.displayName}</div>
                    <div class="next-prayer-times">
                        <div class="prayer-time-item">
                            <span class="time-label">Adhan</span>
                            <span class="time-value adhan-time">${nextPrayer.adhanDisplay}</span>
                        </div>
                        <div class="prayer-time-item">
                            <span class="time-label">Iqaama</span>
                            <span class="time-value iqaama-time">${nextPrayer.iqaamaDisplay}</span>
                        </div>
                    </div>
                    <div class="next-prayer-countdown">
                        <i class="fas fa-clock"></i>
                        <span class="countdown-text">in ${this.formatCountdown(nextPrayer)}</span>
                    </div>
                </div>
            `;
        }

        // Add full prayer times table
        html += `
            <div class="prayer-table-section">
                <div class="prayer-table-header">
                    <div class="header-cell">Prayer</div>
                    <div class="header-cell">Adhan</div>
                    <div class="header-cell">Iqaama</div>
                </div>
        `;

        for (const [prayerName, prayerData] of Object.entries(times)) {
            const statusClass = this.getStatusClass(prayerData.status);
            const nextClass = prayerData.isNext ? 'active' : '';
            const jumaClass = prayerData.isJuma ? 'juma-prayer' : '';

            html += `
                <div class="prayer-item ${statusClass} ${nextClass} ${jumaClass}">
                    <span class="prayer-name">${prayerData.displayName}</span>
                    <span class="prayer-time adhan-time">${prayerData.adhanDisplay}</span>
                    <span class="prayer-time iqaama-time">${prayerData.iqaamaDisplay}</span>
                </div>
            `;
        }

        html += `</div>`; // Close prayer-table-section

        container.innerHTML = html;
    }

    /**
     * Format countdown display
     */
    formatCountdown(prayerData) {
        if (!prayerData) return 'calculating...';
        
        const hoursUntil = prayerData.hoursUntil || 0;
        const minutesUntil = prayerData.minutesUntilPrayer || 0;
        
        if (hoursUntil > 0) {
            return `${hoursUntil}h ${minutesUntil}m`;
        } else if (minutesUntil > 0) {
            return `${minutesUntil} minutes`;
        } else {
            return 'now';
        }
    }

    /**
     * Get CSS class for prayer status
     */
    getStatusClass(status) {
        switch (status) {
            case 'upcoming': return 'prayer-upcoming';
            case 'adhan-time': return 'prayer-adhan';
            case 'iqaama-time': return 'prayer-iqaama';
            case 'passed': return 'prayer-passed';
            default: return '';
        }
    }

    /**
     * Get status text for display
     */
    getStatusText(status) {
        switch (status) {
            case 'upcoming': return 'Upcoming';
            case 'adhan-time': return '🕌 Adhan Time';
            case 'iqaama-time': return '🙏 Iqaama Time';
            case 'passed': return 'Passed';
            default: return '';
        }
    }

    /**
     * Start automatic updates
     */
    startAutoUpdate() {
        // Update every minute
        this.updateInterval = setInterval(() => {
            this.prayerTimes.update();
            this.updateDisplay();
        }, 60000); // 1 minute

        // Also update every second for current time
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    /**
     * Stop automatic updates
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Force refresh display
     */
    refresh() {
        this.prayerTimes.update();
        this.updateDisplay();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.staticPrayerTimes) {
        window.prayerDisplayManager = new PrayerDisplayManager();
        // Start the display immediately
        window.prayerDisplayManager.startAutoUpdate();
        // Force immediate update
        setTimeout(() => {
            window.prayerDisplayManager.refresh();
        }, 100);
        console.log('Prayer Display Manager initialized and started');
    } else {
        console.error('Static Prayer Times not loaded');
    }
});

// CSS styles for prayer times display
const prayerStyles = `
<style>
.prayer-times-container {
    margin: 20px 0;
}

/* Next Prayer Display */
.next-prayer-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px;
    padding: 25px;
    text-align: center;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
}

.next-prayer-display::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: float 6s ease-in-out infinite;
}

.next-prayer-display.juma-prayer {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #333;
}

.next-prayer-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 15px;
    font-size: 14px;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.next-prayer-header i {
    font-size: 18px;
}

.next-prayer-name {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 20px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.next-prayer-times {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 20px;
}

.prayer-time-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.time-label {
    font-size: 12px;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.time-value {
    font-size: 24px;
    font-weight: 600;
}

.time-value.adhan-time {
    color: #ffcc80;
}

.time-value.iqaama-time {
    color: #81c784;
}

.next-prayer-display.juma-prayer .time-value.adhan-time {
    color: #ff6b35;
}

.next-prayer-display.juma-prayer .time-value.iqaama-time {
    color: #2e7d32;
}

.next-prayer-countdown {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 16px;
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 25px;
    padding: 10px 20px;
    margin-top: 15px;
}

.next-prayer-countdown i {
    font-size: 14px;
}

.next-prayer-display.juma-prayer .next-prayer-countdown {
    background: rgba(0, 0, 0, 0.1);
}

/* Prayer Table Section */
.prayer-table-section {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
}

.prayer-table-header {
    display: flex;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
}

.header-cell {
    flex: 1;
    padding: 15px;
    text-align: center;
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.header-cell:first-child {
    text-align: left;
    padding-left: 20px;
}

.prayer-item {
    display: flex;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.3s ease;
}

.prayer-item:last-child {
    border-bottom: none;
}

.prayer-item:hover {
    background-color: #f9f9f9;
}

.prayer-item.active {
    background-color: #e8f5e8;
    border-left: 4px solid #4CAF50;
}

.prayer-item.active .prayer-name {
    color: #2e7d32;
    font-weight: 700;
}

.prayer-name {
    flex: 1;
    padding: 15px 20px;
    font-weight: 600;
    color: #333;
    font-size: 15px;
}

.prayer-time {
    flex: 1;
    padding: 15px;
    text-align: center;
    color: #555;
    font-size: 14px;
    font-weight: 500;
}

.prayer-time.adhan-time {
    color: #ff6b35;
}

.prayer-time.iqaama-time {
    color: #2e7d32;
}

.juma-prayer .prayer-name {
    color: #d4af37;
    font-weight: 700;
}

@keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
}

@media (max-width: 768px) {
    .next-prayer-display {
        margin: 15px;
        padding: 20px;
    }
    
    .next-prayer-name {
        font-size: 28px;
    }
    
    .next-prayer-times {
        gap: 30px;
    }
    
    .time-value {
        font-size: 20px;
    }
    
    .next-prayer-countdown {
        font-size: 14px;
        padding: 8px 16px;
    }
    
    .prayer-item {
        flex-direction: column;
    }
    
    .prayer-time {
        text-align: left;
        padding: 8px 20px;
        border-top: 1px solid #f0f0f0;
    }
}
</style>
`;

// Inject styles into the page
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', prayerStyles);
}

console.log('Prayer Display Manager loaded');
