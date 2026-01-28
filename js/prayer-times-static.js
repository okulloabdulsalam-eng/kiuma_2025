/**
 * Static Prayer Times Configuration
 * Developer-controlled only - no database dependencies
 * Automatically detects next prayer and handles Friday Juma
 */

// Developer-controlled prayer times (24-hour format) - Updated from screenshot
// Last updated: 2025-01-28 21:30
const PRAYER_TIMES = {
    // Regular weekday prayer times
    weekday: {
        fajr: { adhan: '05:40', iqaama: '06:05' },
        dhuhr: { adhan: '13:00', iqaama: '13:15' },
        asr: { adhan: '16:00', iqaama: '16:30' },
        maghrib: { adhan: '19:00', iqaama: '19:05' },
        isha: { adhan: '20:00', iqaama: '20:20' }
    },
    
    // Friday prayer times (Juma instead of Dhuhr)
    friday: {
        fajr: { adhan: '05:40', iqaama: '06:05' },
        juma: { adhan: '13:00', iqaama: '13:40' }, // Friday Juma prayer
        asr: { adhan: '16:00', iqaama: '16:30' },
        maghrib: { adhan: '19:00', iqaama: '19:05' },
        isha: { adhan: '20:00', iqaama: '20:20' }
    }
};

// Prayer display names
const PRAYER_NAMES = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    juma: 'Juma (Friday)',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha'
};

// Prayer order for checking next prayer
const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const FRIDAY_PRAYER_ORDER = ['fajr', 'juma', 'asr', 'maghrib', 'isha'];

class StaticPrayerTimes {
    constructor() {
        this.currentTime = new Date();
        this.isFriday = this.currentTime.getDay() === 5; // 5 = Friday
        this.prayerTimes = this.isFriday ? PRAYER_TIMES.friday : PRAYER_TIMES.weekday;
        this.prayerOrder = this.isFriday ? FRIDAY_PRAYER_ORDER : PRAYER_ORDER;
    }

    /**
     * Get current prayer times based on day of week
     */
    getPrayerTimes() {
        return this.prayerTimes;
    }

    /**
     * Check if it's Friday
     */
    isFridayPrayer() {
        return this.isFriday;
    }

    /**
     * Convert time string to minutes since midnight
     */
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convert minutes since midnight to time string
     */
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Get current time in minutes since midnight
     */
    getCurrentTimeMinutes() {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    }

    /**
     * Find the next prayer
     */
    getNextPrayer() {
        const currentMinutes = this.getCurrentTimeMinutes();
        let nextPrayer = null;
        let nextPrayerTime = null;
        let minDiff = Infinity;

        // Check all prayers for today
        for (const prayerName of this.prayerOrder) {
            const prayer = this.prayerTimes[prayerName];
            if (!prayer || !prayer.adhan) continue;

            const adhanMinutes = this.timeToMinutes(prayer.adhan);
            const diff = adhanMinutes - currentMinutes;

            // If prayer is in the future today
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextPrayer = prayerName;
                nextPrayerTime = prayer.adhan;
            }
        }

        // If no prayer left today, return first prayer of tomorrow
        if (!nextPrayer) {
            const firstPrayer = this.prayerOrder[0];
            if (this.prayerTimes[firstPrayer] && this.prayerTimes[firstPrayer].adhan) {
                nextPrayer = firstPrayer;
                nextPrayerTime = this.prayerTimes[firstPrayer].adhan;
                minDiff = (24 * 60) - currentMinutes + this.timeToMinutes(nextPrayerTime);
            } else {
                // Fallback if no prayer found
                return {
                    name: 'unknown',
                    displayName: 'Unknown',
                    time: '00:00',
                    minutesUntil: 0,
                    hoursUntil: 0,
                    minutesUntilPrayer: 0,
                    isJuma: false
                };
            }
        }

        // Ensure we have valid values
        const hoursUntil = Math.floor(minDiff / 60) || 0;
        const minutesUntilPrayer = minDiff % 60 || 0;

        return {
            name: nextPrayer,
            displayName: PRAYER_NAMES[nextPrayer] || nextPrayer,
            time: nextPrayerTime,
            minutesUntil: minDiff || 0,
            hoursUntil: hoursUntil,
            minutesUntilPrayer: minutesUntilPrayer,
            isJuma: nextPrayer === 'juma'
        };
    }

    /**
     * Check if a specific prayer time has passed
     */
    hasPrayerPassed(prayerName) {
        const prayer = this.prayerTimes[prayerName];
        if (!prayer) return false;

        const prayerMinutes = this.timeToMinutes(prayer.adhan);
        const currentMinutes = this.getCurrentTimeMinutes();
        return currentMinutes >= prayerMinutes;
    }

    /**
     * Get prayer status (upcoming, current, or passed)
     */
    getPrayerStatus(prayerName) {
        const prayer = this.prayerTimes[prayerName];
        if (!prayer) return 'unknown';

        const prayerMinutes = this.timeToMinutes(prayer.adhan);
        const iqaamaMinutes = this.timeToMinutes(prayer.iqaama);
        const currentMinutes = this.getCurrentTimeMinutes();

        if (currentMinutes < prayerMinutes) {
            return 'upcoming';
        } else if (currentMinutes >= prayerMinutes && currentMinutes < iqaamaMinutes) {
            return 'adhan-time';
        } else if (currentMinutes >= iqaamaMinutes && currentMinutes < iqaamaMinutes + 30) {
            return 'iqaama-time';
        } else {
            return 'passed';
        }
    }

    /**
     * Format time for display
     */
    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const minute = minutes;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${minute} ${ampm}`;
    }

    /**
     * Get prayer times for display
     */
    getDisplayPrayerTimes() {
        const displayTimes = {};
        const nextPrayer = this.getNextPrayer();

        for (const [prayerName, prayer] of Object.entries(this.prayerTimes)) {
            const status = this.getPrayerStatus(prayerName);
            const isNext = prayerName === nextPrayer.name;

            displayTimes[prayerName] = {
                displayName: PRAYER_NAMES[prayerName],
                adhan: prayer.adhan,
                iqaama: prayer.iqaama,
                adhanDisplay: this.formatTime(prayer.adhan),
                iqaamaDisplay: this.formatTime(prayer.iqaama),
                status: status,
                isNext: isNext,
                isJuma: prayerName === 'juma'
            };
        }

        return {
            times: displayTimes,
            nextPrayer: nextPrayer,
            isFriday: this.isFriday,
            currentTime: new Date().toLocaleTimeString()
        };
    }

    /**
     * Update current time and recalculate
     */
    update() {
        this.currentTime = new Date();
        this.isFriday = this.currentTime.getDay() === 5;
        this.prayerTimes = this.isFriday ? PRAYER_TIMES.friday : PRAYER_TIMES.weekday;
        this.prayerOrder = this.isFriday ? FRIDAY_PRAYER_ORDER : PRAYER_ORDER;
    }
}

// Create global instance
window.staticPrayerTimes = new StaticPrayerTimes();

// Log the loaded prayer times for verification
console.log('Static Prayer Times loaded - Developer controlled only');
console.log('Current prayer times:', PRAYER_TIMES);
console.log('Current time:', new Date().toLocaleTimeString());

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StaticPrayerTimes, PRAYER_TIMES, PRAYER_NAMES };
}
