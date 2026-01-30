// Helper function to open WhatsApp links (mobile-friendly)
window.openWhatsApp = function(phoneNumber, message = '') {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    
    // Build WhatsApp URL
    let whatsappUrl = `https://wa.me/${cleanNumber}`;
    if (message) {
        const encodedMessage = encodeURIComponent(message);
        whatsappUrl += `?text=${encodedMessage}`;
    }
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     (window.innerWidth <= 768);
    
    if (isMobile) {
        // On mobile, use direct navigation (works better)
        window.location.href = whatsappUrl;
    } else {
        // On desktop, try window.open first
        const newWindow = window.open(whatsappUrl, '_blank');
        
        // If blocked, fall back to direct navigation
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup blocked, use direct navigation
            window.location.href = whatsappUrl;
        }
    }
};

// Mobile-friendly alert replacement
window.showMobileAlert = function(message, title = 'Notice') {
    // Create custom modal instead of browser alert
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; justify-content: center; align-items: center; padding: 20px;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);';
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <i class="fas fa-info-circle" style="font-size: 48px; color: var(--primary-green);"></i>
        </div>
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px; font-weight: 600;">${title}</h3>
        <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.5; white-space: pre-line;">${message}</p>
        <button onclick="this.closest('div[style*=position]').remove()" style="background: var(--primary-green); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;">OK</button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 5000);
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Navigation Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navClose = document.getElementById('navClose');
const overlay = document.createElement('div');
overlay.className = 'overlay';
document.body.appendChild(overlay);

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.add('active');
        overlay.classList.add('active');
    });
}

if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
    });
}

overlay.addEventListener('click', () => {
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
});

// Update dates (auto-updates) - Hijri from Ummah API and Gregorian
async function updateDates() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    // Display Gregorian date (below Hijri) - Show immediately
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = now.toLocaleDateString('en-US', dateOptions);
    }
    
    // Fetch and display Hijri date from Ummah API (main date, shown first)
    const hijriDate = document.getElementById('hijriDate');
    if (hijriDate) {
        // Check cache for today's accurate date first
        const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        const cachedDate = localStorage.getItem(`hijriDate_${todayKey}`);
        
        if (cachedDate) {
            // Use cached accurate date immediately
            hijriDate.textContent = cachedDate;
            console.log('[Dates] Using cached Hijri date');
        } else {
            // Show loading state while fetching accurate date
            hijriDate.textContent = 'Loading...';
        }
        
        try {
            // Get current date in YYYY-MM-DD format
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const currentDate = `${yyyy}-${mm}-${dd}`;
            
            // Use Aladhan API with Umm al-Qura (Makkah/Madina) method for accurate Hijri dates
            // This is the official Saudi calendar used in Makkah and Madina
            // Method 4 = Umm al-Qura, Makkah
            const apiEndpoints = [
                `https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}?method=4`, // Umm al-Qura (Makkah/Madina)
                `https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}?method=2`, // Islamic Society of North America (fallback)
                `https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}` // Default method
            ];
            
            let data = null;
            let response = null;
            
            // Try each endpoint until one works
            for (const apiUrl of apiEndpoints) {
                try {
                    // Add timeout to fetch request
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                    
                    response = await fetch(apiUrl, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        data = await response.json();
                        break; // Success, exit loop
                    }
                } catch (fetchError) {
                    // Continue to next endpoint
                    console.log(`API endpoint failed: ${apiUrl}`, fetchError.message);
                    continue;
                }
            }
            
            if (!data || !response || !response.ok) {
                throw new Error('All API endpoints failed');
            }
            
            // Format and display Hijri date based on API response
            // Also check for white days notification
            // Format: "16 Jumada al-thani, 1447 AH"
            const hijriMonths = ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 
                               'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 
                               'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];
            
            // Helper function to format Hijri date consistently
            const formatHijriDate = (day, month, year) => {
                if (!day || !month || !year) return null;
                const monthName = typeof month === 'number' ? hijriMonths[month - 1] : month;
                return `${day} ${monthName}, ${year} AH`;
            };
            
            let hijriDay = null;
            let hijriMonth = null;
            let hijriYear = null;
            
            // Handle Aladhan API response format (Umm al-Qura / Makkah method)
            if (data.data && Array.isArray(data.data)) {
                // Aladhan calendar format - get today's date (exact match)
                const todayData = data.data.find(d => {
                    const gregDay = parseInt(d.gregorian.day);
                    const gregMonth = parseInt(d.gregorian.month.number);
                    return gregDay === parseInt(dd) && gregMonth === parseInt(mm);
                }) || data.data[0];
                if (todayData && todayData.hijri) {
                    hijriDay = parseInt(todayData.hijri.day);
                    hijriMonth = parseInt(todayData.hijri.month.number);
                    hijriYear = parseInt(todayData.hijri.year);
                    if (hijriDay && hijriMonth && hijriYear) {
                        const accurateDate = formatHijriDate(hijriDay, hijriMonth, hijriYear);
                    hijriDate.textContent = accurateDate;
                    
                    // Cache the accurate date for today
                    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
                    localStorage.setItem(`hijriDate_${todayKey}`, accurateDate);
                    console.log('[Dates] ✅ Accurate Hijri date loaded and cached');
                    }
                }
            } else if (data.data && data.data.hijri) {
                // Aladhan single date format (Umm al-Qura method) - This is the primary format
                hijriDay = parseInt(data.data.hijri.day);
                hijriMonth = parseInt(data.data.hijri.month.number);
                hijriYear = parseInt(data.data.hijri.year);
                
                // Verify we got valid data from Makkah/Madina calculation
                if (hijriDay && hijriMonth && hijriYear) {
                    hijriDate.textContent = formatHijriDate(hijriDay, hijriMonth, hijriYear);
                } else {
                    console.error('Invalid Hijri date from API:', data.data.hijri);
                    throw new Error('Invalid date data from API');
                }
            } else if (data.hijri) {
                // Ummah API format
                if (typeof data.hijri.day === 'number') {
                    hijriDay = data.hijri.day;
                } else if (data.hijri.date) {
                    const dayMatch = data.hijri.date.match(/(\d+)/);
                    if (dayMatch) hijriDay = parseInt(dayMatch[1]);
                }
                
                if (typeof data.hijri.month === 'number') {
                    hijriMonth = data.hijri.month;
                } else if (data.hijri.monthNumber) {
                    hijriMonth = data.hijri.monthNumber;
                }
                
                hijriYear = data.hijri.year;
                
                // Format for display - ensure consistent format: "16 Jumada al-thani, 1447 AH"
                if (hijriDay && hijriMonth && hijriYear) {
                    const monthName = typeof hijriMonth === 'number' 
                        ? hijriMonths[hijriMonth - 1] 
                        : hijriMonth;
                    const accurateDate = `${hijriDay} ${monthName}, ${hijriYear} AH`;
                    hijriDate.textContent = accurateDate;
                    
                    // Cache the accurate date for today
                    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
                    localStorage.setItem(`hijriDate_${todayKey}`, accurateDate);
                    console.log('[Dates] ✅ Accurate Hijri date loaded and cached');
                } else if (data.hijri.date) {
                    // Try to parse and reformat if needed
                    const dateStr = data.hijri.date;
                    if (dateStr.match(/\d+\s+\w+.*\d{4}/)) {
                        hijriDate.textContent = dateStr;
                    } else {
                        // Fallback: try to construct from available data
                        const day = data.hijri.day || hijriDay || '';
                        const month = data.hijri.month || (hijriMonth ? hijriMonths[hijriMonth - 1] : '');
                        const year = data.hijri.year || hijriYear || '';
                        if (day && month && year) {
                            hijriDate.textContent = `${day} ${month}, ${year} AH`;
                        } else {
                            hijriDate.textContent = dateStr;
                        }
                    }
                } else if (data.hijri.formatted) {
                    // Use formatted if available, but ensure it has the right format
                    hijriDate.textContent = data.hijri.formatted;
                } else {
                    const day = data.hijri.day || '';
                    const month = data.hijri.month || '';
                    const year = data.hijri.year || '';
                    hijriDate.textContent = `${day} ${month}, ${year} AH`;
                }
            } else if (data.date) {
                // Try to ensure consistent format
                hijriDate.textContent = data.date;
            } else {
                console.log('API response format not recognized:', data);
                throw new Error('Unexpected API response format');
            }
            
            // Check for white days (10th, 11th, 12th) and create notification
            if (hijriDay && hijriDay >= 10 && hijriDay <= 12) {
                checkAndCreateWhiteDaysNotification(hijriDay, hijriMonth, hijriYear, hijriMonths);
            }
        } catch (error) {
            // If API fails, keep the approximate date that was already shown
            // Don't change it again - it's already displayed at the start of the function
            console.warn('[Dates] API failed, using approximate date:', error.message);
            
            // Only check for white days if we have the approximate date values
            // The approximate date is already displayed, so we just need to check notifications
            const daysSinceEpoch = Math.floor((now - new Date(622, 6, 16)) / (24 * 60 * 60 * 1000));
            const remainingDays = daysSinceEpoch % 354.37;
            const hijriMonthIndex = Math.min(Math.floor(remainingDays / 29.5), 11);
            const hijriDay = Math.max(1, Math.floor(remainingDays % 29.5) + 1);
            
            // Check for white days with approximate date
            if (hijriDay >= 10 && hijriDay <= 12) {
                const hijriYear = Math.floor(daysSinceEpoch / 354.37) + 1;
                const hijriMonths = ['Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani', 
                                   'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban', 
                                   'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];
                checkAndCreateWhiteDaysNotification(hijriDay, hijriMonthIndex + 1, hijriYear, hijriMonths);
            }
        }
    }
}

// Get all registered users (excluding passwords)
// Get all registered users from database or localStorage (fallback)
async function getAllRegisteredUsers() {
    // Try to get from database first
    try {
        const API_BASE_URL = window.API_BASE_URL || '/api';
        const response = await fetch(API_BASE_URL + '/get_all_users.php');
        const data = await response.json();
        
        if (data.success && data.users) {
            return data.users;
        }
    } catch (error) {
        console.log('Database not available, using localStorage:', error);
    }
    
    // Fallback to localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // Return users without passwords for security
    return storedUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}

// Send email notification to a user
async function sendEmailNotification(email, subject, message) {
    if (!email) return false;
    
    try {
        // Try to use backend API if available
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, subject, message })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Email notification sent via API:', data);
                return true;
            }
        } catch (apiError) {
            // Backend not available, fall back to localStorage method
            console.log('Backend API not available, using localStorage method');
        }
        
        // Fallback: Store notification for manual sending
        console.log('Email notification prepared (fallback):', { email, subject, message });
        
        // Store notification in a queue for later processing
        let notificationQueue = JSON.parse(localStorage.getItem('emailNotificationQueue') || '[]');
        notificationQueue.push({
            email: email,
            subject: subject,
            message: message,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('emailNotificationQueue', JSON.stringify(notificationQueue));
        
        return true;
    } catch (error) {
        console.error('Error sending email notification:', error);
        return false;
    }
}

// Send notifications to all registered users
async function sendNotificationsToAllUsers(subject, message, notificationId = null) {
    // Try to use backend API first (more efficient)
    try {
        const adminPassword = localStorage.getItem('adminPassword') || '';
        const API_BASE_URL = window.API_BASE_URL || '/api';
        
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('message', message);
        if (notificationId) {
            formData.append('notification_id', notificationId);
        }
        formData.append('admin_password', adminPassword);
        
        const response = await fetch(API_BASE_URL + '/send_notifications_to_all.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`Notifications sent via API: ${data.totalUsers} users, Email: ${data.emailSent}`);
            return { 
                successCount: data.emailSent, 
                failCount: data.emailFailed, 
                total: data.totalUsers 
            };
        }
    } catch (error) {
        console.log('Backend API not available, using fallback method:', error);
    }
    
    // Fallback: Get users and send individually
    const users = await getAllRegisteredUsers();
    let successCount = 0;
    let failCount = 0;
    
    console.log(`Sending notifications to ${users.length} users...`);
    
    for (const user of users) {
        // Send email notification
        if (user.email) {
            const emailSuccess = await sendEmailNotification(user.email, subject, message);
            if (emailSuccess) {
                successCount++;
            } else {
                failCount++;
            }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Notifications sent: ${successCount} successful, ${failCount} failed`);
    return { successCount, failCount, total: users.length };
}

// Check and create white days (ayyam al-beed) notification
function checkAndCreateWhiteDaysNotification(hijriDay, hijriMonth, hijriYear, hijriMonths) {
    // Create unique key for today's notification
    const todayKey = `whitedays-${hijriYear}-${hijriMonth}-${hijriDay}`;
    const lastNotificationKey = localStorage.getItem('lastWhiteDaysNotification');
    
    // Only create notification if not already created today
    if (lastNotificationKey === todayKey) {
        return;
    }
    
    // Calculate days until white days
    const daysUntil = 13 - hijriDay;
    const monthName = typeof hijriMonth === 'number' 
        ? hijriMonths[hijriMonth - 1] 
        : hijriMonth;
    
    // Create notification
    let notificationsData = JSON.parse(localStorage.getItem('notificationsData') || '[]');
    
    // Remove any existing white days notifications for this month to avoid duplicates
    notificationsData = notificationsData.filter(n => 
        !n.id || !n.id.startsWith('whitedays-') || !n.id.includes(`${hijriYear}-${hijriMonth}`)
    );
    
    // Create new notification
    const notification = {
        id: `whitedays-${Date.now()}`,
        title: 'Reminder: White Days Fasting (Ayyam al-Beed)',
        message: `Assalam Alaikum! This is a reminder that the White Days (13th, 14th, and 15th of ${monthName}) are ${daysUntil} day${daysUntil > 1 ? 's' : ''} away. Fasting on these three days is highly recommended (Sunnah). Please prepare to fast on the 13th, 14th, and 15th of ${monthName} ${hijriYear} AH. May Allah accept your good deeds.`,
        icon: 'fas fa-moon',
        status: 'unread',
        date: new Date().toISOString(),
        timeDisplay: 'Just now',
        isWhiteDaysNotification: true
    };
    
    notificationsData.unshift(notification);
    localStorage.setItem('notificationsData', JSON.stringify(notificationsData));
    
    // Mark today's notification as created
    localStorage.setItem('lastWhiteDaysNotification', todayKey);
    
    // Send notifications to all registered users via WhatsApp and Email
    const notificationSubject = 'Reminder: White Days Fasting (Ayyam al-Beed)';
    sendNotificationsToAllUsers(notificationSubject, notification.message)
        .then(result => {
            console.log('White days notifications sent to all users:', result);
        })
        .catch(error => {
            console.error('Error sending white days notifications:', error);
        });
    
    // If on notifications page, reload notifications
    if (window.location.pathname.includes('notifications.html') || window.location.href.includes('notifications.html')) {
        // Try to call loadNotificationsFromStorage if it exists
        if (typeof loadNotificationsFromStorage === 'function') {
            loadNotificationsFromStorage();
        } else {
            // If function doesn't exist yet, wait a bit and try again
            setTimeout(() => {
                if (typeof loadNotificationsFromStorage === 'function') {
                    loadNotificationsFromStorage();
                }
            }, 500);
        }
    }
    
    console.log('White days notification created for:', hijriDay, hijriMonth, hijriYear);
}

// Check and create fasting reminder notifications (Sunday/Wednesday at 2pm, 6pm, 7:40pm)
function checkAndCreateFastingReminder() {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 3 = Wednesday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if it's Sunday (0) or Wednesday (3)
    if (currentDay !== 0 && currentDay !== 3) {
        return; // Not Sunday or Wednesday
    }
    
    // Define the reminder times: 14:00 (2pm), 18:00 (6pm), 19:40 (7:40pm)
    const reminderTimes = [
        { hour: 14, minute: 0 },   // 2:00 PM
        { hour: 18, minute: 0 },   // 6:00 PM
        { hour: 19, minute: 40 }   // 7:40 PM
    ];
    
    // Check if current time matches any reminder time (exact minute match)
    const isReminderTime = reminderTimes.some(time => {
        return currentHour === time.hour && currentMinute === time.minute;
    });
    
    if (!isReminderTime) {
        return; // Not a reminder time
    }
    
    // Determine the next day to fast
    const nextDayName = currentDay === 0 ? 'Monday' : 'Thursday'; // Sunday -> Monday, Wednesday -> Thursday
    const currentDateStr = now.toDateString(); // For unique key
    
    // Create unique key for this day and time
    const reminderKey = `fasting-reminder-${currentDateStr}-${currentHour}-${currentMinute}`;
    const lastReminderKey = localStorage.getItem('lastFastingReminder');
    
    // Only create notification if not already created for this specific time today
    if (lastReminderKey === reminderKey) {
        return;
    }
    
    // Get user name if logged in
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    let userName = '';
    if (userData && userData.firstName) {
        userName = userData.firstName;
    } else if (userData && userData.name) {
        userName = userData.name.split(' ')[0]; // Use first name only
    }
    
    // Format the greeting with or without name
    const greeting = userName ? `Assalam Alaikum ${userName}!` : 'Assalam Alaikum!';
    
    // Create notification
    let notificationsData = JSON.parse(localStorage.getItem('notificationsData') || '[]');
    
    // Remove any existing fasting reminders for today to avoid duplicates
    const todayDateStr = now.toDateString();
    notificationsData = notificationsData.filter(n => 
        !n.id || !n.id.startsWith('fasting-reminder-') || !n.id.includes(todayDateStr)
    );
    
    // Create new notification
    const notification = {
        id: `fasting-reminder-${Date.now()}`,
        title: 'Reminder: Fasting Tomorrow',
        message: `${greeting} This is a reminder that tomorrow (${nextDayName}) is a recommended day for fasting. Please prepare to fast tomorrow. May Allah accept your good deeds.`,
        icon: 'fas fa-moon',
        status: 'unread',
        date: new Date().toISOString(),
        timeDisplay: 'Just now',
        isFastingReminder: true
    };
    
    notificationsData.unshift(notification);
    localStorage.setItem('notificationsData', JSON.stringify(notificationsData));
    
    // Mark this reminder as created
    localStorage.setItem('lastFastingReminder', reminderKey);
    
    // Send notifications to all registered users via WhatsApp and Email
    const notificationSubject = 'Reminder: Fasting Tomorrow';
    sendNotificationsToAllUsers(notificationSubject, notification.message)
        .then(result => {
            console.log('Fasting reminder notifications sent to all users:', result);
        })
        .catch(error => {
            console.error('Error sending fasting reminder notifications:', error);
        });
    
    // If on notifications page, reload notifications
    if (window.location.pathname.includes('notifications.html') || window.location.href.includes('notifications.html')) {
        if (typeof loadNotificationsFromStorage === 'function') {
            loadNotificationsFromStorage();
        } else {
            setTimeout(() => {
                if (typeof loadNotificationsFromStorage === 'function') {
                    loadNotificationsFromStorage();
                }
            }, 500);
        }
    }
    
    console.log('Fasting reminder notification created for:', nextDayName);
}

// Initialize fasting reminder checker - check every minute for the exact times
function initFastingReminderChecker() {
    // Check immediately on load
    checkAndCreateFastingReminder();
    
    // Then check every minute to catch the exact times (2pm, 6pm, 7:40pm)
    setInterval(checkAndCreateFastingReminder, 60000); // 1 minute = 60000ms
}

// Update dates on load and continuously (auto-update)
// Call immediately to show approximate date right away
updateDates();
// Static prayer times are loaded automatically by prayer-display.js
// No database calls needed

// Initialize fasting reminder checker (checks every minute for Sunday/Wednesday at 2pm, 6pm, 7:40pm)
initFastingReminderChecker();

// Auto-update dates every hour (Hijri date changes daily, so hourly updates are sufficient)
// Respects API rate limits: 200 requests per 15 minutes, 1000 per hour
// This also checks for white days notifications
setInterval(updateDates, 3600000); // 1 hour = 3600000ms

// User Account System
// Use localUserData to avoid conflict with firebase-auth.js's currentUser
var localUserData = null;

function loadUserData() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        localUserData = JSON.parse(userData);
        updateUserDisplay();
        return true;
    }
    return false;
}

function updateUserDisplay() {
    // Update all userName elements across all pages
    const userNameEls = document.querySelectorAll('#userName');
    const accountIcon = document.getElementById('accountIcon');
    const accountIconBtn = document.getElementById('accountIconBtn');
    
    const userName = localUserData ? (localUserData.firstName || localUserData.name || 'Brother/Sister') : 'Brother/Sister';
    
    // Update all userName spans on the page
    userNameEls.forEach(el => {
        el.textContent = userName;
    });
    
    if (localUserData) {
        // Change icon to show logged in state
        if (accountIcon) {
            accountIcon.className = 'fas fa-user-circle logged-in';
        }
        if (accountIconBtn) {
            accountIconBtn.classList.add('logged-in');
            accountIconBtn.title = 'Account';
        }
    } else {
        // Show login icon
        if (accountIcon) {
            accountIcon.className = 'fas fa-user-circle';
        }
        if (accountIconBtn) {
            accountIconBtn.classList.remove('logged-in');
            accountIconBtn.title = 'Login / Create Account';
        }
    }
    
    // Trigger unified navigation update
    if (typeof window.forceUpdateNavigation === 'function') {
        window.forceUpdateNavigation();
    } else if (typeof window.updateNavigationLinks === 'function') {
        window.updateNavigationLinks();
    }
}

// Initialize user data on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        loadUserData();
    });
}

// Make functions globally accessible
window.showLoginModal = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        document.getElementById('accountTabs').style.display = 'block';
        document.getElementById('accountModalTitle').innerHTML = '<i class="fas fa-user-circle"></i> Account';
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('loginFormElement').style.display = 'block';
        document.getElementById('signupFormElement').style.display = 'none';
        document.getElementById('accountInfo').style.display = 'none';
        modal.style.display = 'flex';
    }
};

window.toggleAccountModal = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        if (localUserData) {
            // Show account info/logout
            window.showAccountInfo();
        } else {
            // Show login/create account
            window.showLoginModal();
        }
    } else {
        console.error('Account modal not found');
    }
};

window.showSignupTab = function() {
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.add('active');
    document.getElementById('loginFormElement').style.display = 'none';
    document.getElementById('signupFormElement').style.display = 'block';
};

window.showLoginTab = function() {
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById('loginFormElement').style.display = 'block';
    document.getElementById('signupFormElement').style.display = 'none';
};

window.closeAccountModal = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.style.display = 'none';
        // Reset forms
        document.getElementById('loginFormElement')?.reset();
        document.getElementById('signupFormElement')?.reset();
    }
};

window.handleLogin = function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Get stored users
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = storedUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        localUserData = user;
        localStorage.setItem('userData', JSON.stringify(user));
        updateUserDisplay();
        window.closeAccountModal();
        alert('Welcome back, ' + user.firstName + '!');
    } else {
        alert('Invalid email or password. Please try again.');
    }
};

window.handleSignup = function(e) {
    e.preventDefault();
    const firstName = document.getElementById('signupFirstName').value;
    const lastName = document.getElementById('signupLastName').value;
    const email = document.getElementById('signupEmail').value;
    const whatsapp = document.getElementById('signupWhatsApp').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const gender = document.getElementById('signupGender').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    
    // Get stored users
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (storedUsers.find(u => u.email === email)) {
        alert('This email is already registered. Please login instead.');
        window.showLoginTab();
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        firstName: firstName,
        lastName: lastName,
        name: firstName + ' ' + lastName,
        email: email,
        whatsapp: whatsapp,
        gender: gender,
        createdAt: new Date().toISOString()
    };
    
    storedUsers.push({...newUser, password: password});
    localStorage.setItem('users', JSON.stringify(storedUsers));
    
    localUserData = newUser;
    localStorage.setItem('userData', JSON.stringify(newUser));
    updateUserDisplay();
    window.closeAccountModal();
    
    // Show success message with WhatsApp join option
    showRegistrationSuccessModal(firstName, whatsapp);
};

// Show registration success modal with WhatsApp join option
function showRegistrationSuccessModal(firstName, whatsappNumber) {
    // Get Twilio sandbox join code (UPDATE THIS with your actual code from Twilio Console)
    // Get it from: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
    const SANDBOX_JOIN_CODE = localStorage.getItem('twilioSandboxCode') || 'planning-job'; // Twilio sandbox join code
    
    if (SANDBOX_JOIN_CODE === 'YOUR_CODE_HERE') {
        // No join code set, just show success
        alert('Account created successfully! Welcome, ' + firstName + '!\n\nTo receive WhatsApp notifications, you\'ll need to join our WhatsApp sandbox. Instructions will be sent via email.');
        return;
    }
    
    const joinMessage = `join ${SANDBOX_JOIN_CODE}`;
    const whatsappUrl = `https://wa.me/14155238886?text=${encodeURIComponent(joinMessage)}`;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.id = 'registrationSuccessModal';
    modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; justify-content: center; align-items: center;';
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #2c3e50; margin-bottom: 15px;">Welcome, ${firstName}!</h2>
            <p style="color: #7f8c8d; margin-bottom: 25px; line-height: 1.6;">
                Your account has been created successfully!<br><br>
                <strong>📱 Join WhatsApp Notifications (10 seconds)</strong><br>
                Click below to receive all KIUMA updates via WhatsApp
            </p>
            
            <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4CAF50;">
                <p style="margin: 0; color: #2E7D32; font-size: 14px;">
                    <strong>Step 1:</strong> Click "Join WhatsApp" below<br>
                    <strong>Step 2:</strong> Tap "Send" in WhatsApp<br>
                    <strong>Done!</strong> ✅ You'll receive all notifications
                </p>
            </div>
            
            <a href="${whatsappUrl}" target="_blank"
               style="display: inline-block; background: #25D366; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: bold; margin-bottom: 15px; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3); margin-right: 10px;">
                <i class="fab fa-whatsapp"></i> Join WhatsApp
            </a>
            
            <button onclick="this.closest('#registrationSuccessModal').remove()" 
                    style="padding: 15px 30px; background: #95a5a6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
                Skip for now
            </button>
            
            <p style="font-size: 12px; color: #95a5a6; margin-top: 20px;">
                You can join later from your account settings
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-close after 60 seconds if not interacted
    setTimeout(function() {
        if (document.getElementById('registrationSuccessModal')) {
            modal.remove();
        }
    }, 60000);
}

// Show WhatsApp join modal from account page
window.showWhatsAppJoinFromAccount = function() {
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    if (!userData) {
        alert('Please login first to join WhatsApp notifications.');
        return;
    }
    
    const firstName = userData.firstName || userData.name?.split(' ')[0] || 'User';
    const whatsapp = userData.whatsapp || '';
    showRegistrationSuccessModal(firstName, whatsapp);
};

window.showAccountInfo = function() {
    const modal = document.getElementById('accountModal');
    if (modal) {
        document.getElementById('accountTabs').style.display = 'none';
        document.getElementById('accountModalTitle').innerHTML = '<i class="fas fa-user-circle"></i> My Account';
        document.getElementById('loginFormElement').style.display = 'none';
        document.getElementById('signupFormElement').style.display = 'none';
        document.getElementById('accountInfo').style.display = 'block';
        
        if (localUserData) {
            document.getElementById('accountName').textContent = localUserData.name || (localUserData.firstName + ' ' + localUserData.lastName);
            document.getElementById('accountEmail').textContent = localUserData.email;
            document.getElementById('accountGender').textContent = localUserData.gender || 'Not specified';
        }
        
        modal.style.display = 'flex';
    }
}

window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localUserData = null;
        localStorage.removeItem('userData');
        updateUserDisplay();
        window.closeAccountModal();
        alert('You have been logged out.');
    }
};

// Navigation function - Updated for mobile back button support
function navigateTo(url) {
    // Use mobile navigation if available, otherwise fallback to direct navigation
    if (window.mobileNavigation) {
        // Extract page name from URL
        let page = url;
        if (url === './' || url === '') {
            page = 'index.html';
        } else if (url.startsWith('./')) {
            page = url.substring(2);
        }
        
        window.mobileNavigation.navigateTo(page, {
            state: { fromMobileNavigation: true, timestamp: Date.now() }
        });
    } else {
        // Fallback to direct navigation
        window.location.href = url;
    }
}

// Navigate to Kizumu Visit - Show Activities Modal
function navigateToKizumuVisit() {
    showActivitiesModal();
}

function showActivitiesModal() {
    const modal = document.getElementById('activitiesModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeActivitiesModal() {
    const modal = document.getElementById('activitiesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showLessonsModal() {
    const modal = document.getElementById('lessonsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeLessonsModal() {
    const modal = document.getElementById('lessonsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function navigateToLesson(sectionId) {
    closeLessonsModal();
    // If we're on the important-lessons page, scroll to section
    if (window.location.pathname.includes('important-lessons.html') || window.location.pathname.endsWith('important-lessons.html')) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Add a highlight effect
            element.style.transition = 'background-color 0.3s';
            element.style.backgroundColor = '#fff3e0';
            setTimeout(() => {
                element.style.backgroundColor = '';
            }, 2000);
        }
    } else {
        // Navigate to the page with the section
        window.location.href = `important-lessons.html#${sectionId}`;
    }
}

function navigateToActivity(type) {
    closeActivitiesModal();
    
    if (type === 'kizumu-visit') {
        window.location.href = 'activities.html#charity-visit';
    } else if (type === 'tuition-brothers') {
        window.location.href = 'pay.html?type=charity&donation=tuition-brothers';
    } else if (type === 'activities') {
        window.location.href = 'activities.html';
    }
}

// Initialize modal close on overlay click for all pages
document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            // Only close if clicking on the overlay itself, not the modal content
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
    
    // Close modals on overlay click for all pages
    const modal = document.getElementById('activitiesModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeActivitiesModal();
            }
        });
    }
    
    const lessonsModal = document.getElementById('lessonsModal');
    if (lessonsModal) {
        lessonsModal.addEventListener('click', function(e) {
            if (e.target === lessonsModal) {
                closeLessonsModal();
            }
        });
    }
});

// Search functionality is now handled by services/searchService.js and js/search.js
// Old search implementation removed - see search.html for full search interface

// Notifications button
const notificationsBtn = document.getElementById('notificationsBtn');
if (notificationsBtn) {
    notificationsBtn.addEventListener('click', () => {
        window.location.href = 'notifications.html';
    });
}

// Active navigation item
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .nav-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
});

// Form submission handlers
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple validation
    if (username && password) {
        localStorage.setItem('userName', username);
        alert('Login successful!');
        window.location.href = 'index.html';
    } else {
        alert('Please fill in all fields');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const formData = {
        firstName: document.getElementById('firstName')?.value,
        lastName: document.getElementById('lastName')?.value,
        userName: document.getElementById('userName')?.value,
        password: document.getElementById('password')?.value,
        dateOfBirth: document.getElementById('dateOfBirth')?.value
    };
    
    // Simple validation
    if (Object.values(formData).every(val => val)) {
        localStorage.setItem('userName', formData.firstName);
        alert('Registration successful!');
        window.location.href = 'index.html';
    } else {
        alert('Please fill in all fields');
    }
}

// Payment method selection
function selectPaymentMethod(method) {
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach(m => m.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const selectedMethod = event.currentTarget.dataset.method;
    localStorage.setItem('selectedPaymentMethod', selectedMethod);
}

// Initialize payment method selection
document.addEventListener('DOMContentLoaded', () => {
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            paymentMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Initialize prayer times editing
    initializePrayerTimesEditing();
    
    // Check authentication and update edit button visibility on page load
    // Also restore Supabase session if user is logged in
    const adminStatus = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (adminStatus) {
        console.log('[Page Load] Admin logged in detected, checking Supabase session...');
        // Small delay to ensure Supabase client is initialized
        setTimeout(() => {
            updateEditButtonVisibility();
        }, 500);
    } else {
        updateEditButtonVisibility();
    }
    
    // Listen for online/offline events to update button states
    window.addEventListener('online', () => {
        console.log('[Network] Connection restored');
        updateEditButtonVisibility();
        // Re-enable save button if in edit mode
        const editBtn = document.getElementById('adminEditBtn');
        if (editBtn && editBtn.innerHTML.includes('Save')) {
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
            editBtn.style.cursor = 'pointer';
        }
        // Re-enable save button in save/cancel container
        const saveBtn = document.querySelector('#saveCancelBtns .btn-primary');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('[Network] Connection lost');
        console.log('Offline — edit disabled');
        updateEditButtonVisibility();
        // Disable save button if in edit mode
        const editBtn = document.getElementById('adminEditBtn');
        if (editBtn && editBtn.innerHTML.includes('Save')) {
            editBtn.disabled = true;
            editBtn.style.opacity = '0.5';
            editBtn.style.cursor = 'not-allowed';
        }
        // Disable save button in save/cancel container
        const saveBtn = document.querySelector('#saveCancelBtns .btn-primary');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
    });
    
    // Set up Supabase auth state listener (plain JavaScript only)
    // Wait a bit for Supabase client to be initialized
    setTimeout(function() {
        try {
            // Get Supabase client - use window.getSupabaseClient if available
            var supabase = null;
            if (typeof window.getSupabaseClient === 'function') {
                try {
                    supabase = window.getSupabaseClient();
                } catch (err) {
                    console.warn('[Auth Listener] Error getting Supabase client:', err);
                }
            }
            
            // If client is available, set up listener
            if (supabase && supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
                console.log('[Auth Listener] Setting up Supabase auth state listener...');
                
                // Set up onAuthStateChange listener (plain JavaScript)
                supabase.auth.onAuthStateChange(function(event, session) {
                    console.log('[Auth Listener] Auth state changed:', event, session ? 'User: ' + session.user.email : 'No session');
                    
                    if (event === 'SIGNED_IN' && session && session.user) {
                        // User logged in - show Edit button
                        console.log('[Auth Listener] User signed in - showing Edit button');
                        updateEditButtonVisibility();
                    } else if (event === 'SIGNED_OUT' || !session || !session.user) {
                        // User logged out - hide Edit button
                        console.log('[Auth Listener] User signed out - hiding Edit button');
                        updateEditButtonVisibility();
                        
                        // Also cancel editing if in progress
                        var editBtn = document.getElementById('adminEditBtn');
                        if (editBtn && editBtn.innerHTML.indexOf('Save') !== -1) {
                            // User was editing, cancel it
                            if (typeof cancelEditing === 'function') {
                                cancelEditing();
                            }
                        }
                    } else if (event === 'TOKEN_REFRESHED' && session && session.user) {
                        // Token refreshed - update button visibility
                        console.log('[Auth Listener] Token refreshed - updating Edit button');
                        updateEditButtonVisibility();
                    }
                });
                
                console.log('[Auth Listener] ✅ Auth state listener set up successfully');
            } else {
                console.warn('[Auth Listener] Supabase client not available yet, will retry...');
                // Retry after a longer delay
                setTimeout(function() {
                    if (typeof window.getSupabaseClient === 'function') {
                        try {
                            supabase = window.getSupabaseClient();
                            if (supabase && supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
                                console.log('[Auth Listener] Retrying - setting up Supabase auth state listener...');
                                
                                supabase.auth.onAuthStateChange(function(event, session) {
                                    console.log('[Auth Listener] Auth state changed:', event, session ? 'User: ' + session.user.email : 'No session');
                                    
                                    if (event === 'SIGNED_IN' && session && session.user) {
                                        console.log('[Auth Listener] User signed in - showing Edit button');
                                        updateEditButtonVisibility();
                                    } else if (event === 'SIGNED_OUT' || !session || !session.user) {
                                        console.log('[Auth Listener] User signed out - hiding Edit button');
                                        updateEditButtonVisibility();
                                        
                                        var editBtn = document.getElementById('adminEditBtn');
                                        if (editBtn && editBtn.innerHTML.indexOf('Save') !== -1) {
                                            if (typeof cancelEditing === 'function') {
                                                cancelEditing();
                                            }
                                        }
                                    } else if (event === 'TOKEN_REFRESHED' && session && session.user) {
                                        console.log('[Auth Listener] Token refreshed - updating Edit button');
                                        updateEditButtonVisibility();
                                    }
                                });
                                
                                console.log('[Auth Listener] ✅ Auth state listener set up successfully (retry)');
                            }
                        } catch (err) {
                            console.warn('[Auth Listener] Retry failed:', err);
                        }
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('[Auth Listener] Error setting up auth listener:', error);
        }
    }, 1000);
});

// BarakahPush Notification System – Active
window.updateNotificationBadge = async function() {
    try {
        // Use BarakahPush if available
        if (typeof updateBarakahPushBadge === 'function') {
            await updateBarakahPushBadge();
            return;
        }
        
        // Fallback to old method
        let unreadCount = 0;
        
        // Get from localStorage (Firestore removed)
        if (unreadCount === 0) {
            const notificationsData = JSON.parse(localStorage.getItem('notificationsData') || '[]');
            const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
            unreadCount = notificationsData.filter(n => {
                const id = n.id || n.notificationId;
                return !readNotifications.includes(id) && (n.status !== 'read');
            }).length;
        }
        
        // Update all badge elements on the page
        document.querySelectorAll('.notifications-btn .badge').forEach(badge => {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline' : 'none';
        });
        
        return unreadCount;
    } catch (error) {
        console.error('Error updating notification badge:', error);
        // Hide badge on error
        document.querySelectorAll('.notifications-btn .badge').forEach(badge => {
            badge.style.display = 'none';
        });
        return 0;
    }
};

// Update badge on page load - BarakahPush Notification System – Active
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize BarakahPush if available
        if (typeof initializeBarakahPush === 'function') {
            await initializeBarakahPush();
        }
        setTimeout(() => window.updateNotificationBadge(), 500);
        
        // Set up periodic badge updates
        setInterval(() => {
            window.updateNotificationBadge();
        }, 30000); // Update every 30 seconds
    });
} else {
    // Initialize BarakahPush if available
    if (typeof initializeBarakahPush === 'function') {
        initializeBarakahPush().then(() => {
            setTimeout(() => window.updateNotificationBadge(), 500);
        });
    } else {
        setTimeout(() => window.updateNotificationBadge(), 500);
    }
    
    // Set up periodic badge updates
    setInterval(() => {
        window.updateNotificationBadge();
    }, 30000); // Update every 30 seconds
}

