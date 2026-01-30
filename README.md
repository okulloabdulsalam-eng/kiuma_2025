# KIUMA Mobile App

A Progressive Web App (PWA) for the Kampala International University Muslim Students Association (KIUMA). This application serves as a comprehensive guide to Islamic values, programs, and activities at KIU.

## Features

- **Progressive Web App**: Installable on mobile and desktop devices
- **Offline Support**: Works without internet connection using service workers
- **User Authentication**: Secure registration and login system
- **Multi-page Navigation**: 15+ pages covering all aspects of KIUMA activities
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Real-time Notifications**: WhatsApp and email notification system
- **Prayer Times**: Daily prayer schedule and reminders
- **Library**: Islamic literature and resources
- **Events Calendar**: Upcoming events and activities
- **Leadership Directory**: Contact information for KIUMA leaders

## Technology Stack

### Backend
- **Node.js** (v18) - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database for user management
- **bcrypt** - Password hashing
- **dotenv** - Environment variable management

### Frontend
- **HTML5/CSS3/JavaScript** - Core web technologies
- **Progressive Web App** - PWA features and service workers
- **Font Awesome** - Icon library
- **Capacitor** - Mobile app deployment (Android/iOS)

## Project Structure

```
kimu-mob-html/
├── server.js                 # Express server and API endpoints
├── package.json              # Dependencies and scripts
├── manifest.json             # PWA manifest
├── index.html                # Main entry point
├── styles.css                # Main stylesheet
├── css/                      # Additional CSS files
├── js/                       # JavaScript files
├── icons/                    # PWA icons (multiple sizes)
├── pages/                    # HTML pages
│   ├── about.html
│   ├── values.html
│   ├── programs.html
│   ├── quran.html
│   ├── counselling.html
│   ├── activities.html
│   ├── events.html
│   ├── leadership.html
│   ├── contact.html
│   ├── library.html
│   ├── media.html
│   ├── ask-question.html
│   ├── join-programs.html
│   ├── notifications.html
│   ├── pay.html
│   └── join-us.html
├── offline-db.js             # Offline database operations
├── network-sync.js           # Network synchronization
└── kiuma_users.db            # SQLite database
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup Steps

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd kimu-mob-html
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the environment template
   cp env-example.txt .env
   
   # Edit the .env file with your configuration
   # PORT=3000
   # NODE_ENV=development
   # BCRYPT_ROUNDS=12
   # CORS_ORIGIN=*
   ```

4. **Start the development server**
   ```bash
   # For development with auto-reload
   npm run dev
   
   # Or for production
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - The PWA install prompt should appear on supported browsers

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - User login
- `GET /users/:email` - Get user by email

### Notifications
- `POST /api/send-whatsapp` - Send WhatsApp notification
- `POST /api/send-email` - Send email notification
- `POST /api/send-notifications` - Send bulk notifications

### Utilities
- `GET /health` - Server health check

## Environment Variables

Create a `.env` file based on `env-example.txt`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_PATH=./kiuma_users.db

# Security
BCRYPT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=*

# Session Configuration
SESSION_SECRET=your-secret-key-here

# API Keys (if needed)
# API_KEY=your-api-key-here
# PESAPAL_CONSUMER_KEY=your-pesapal-consumer-key
# PESAPAL_CONSUMER_SECRET=your-pesapal-consumer-secret
```

## Mobile App Deployment (Capacitor)

The app can be deployed as a native mobile app using Capacitor:

1. **Initialize Capacitor**
   ```bash
   npm run cap:init
   ```

2. **Add platforms**
   ```bash
   npm run cap:add:android
   npm run cap:add:ios
   ```

3. **Build and sync**
   ```bash
   npm run cap:build
   ```

4. **Open in IDE**
   ```bash
   npm run cap:open:android    # Opens Android Studio
   npm run cap:open:ios        # Opens Xcode
   ```

## PWA Features

- **Offline Functionality**: Service worker enables offline access
- **App Installation**: Can be installed as a native app
- **Push Notifications**: Ready for push notification integration
- **Responsive Design**: Adapts to all screen sizes
- **Fast Loading**: Optimized for quick startup

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **SQL Injection Prevention**: Parameterized queries
- **Error Handling**: Comprehensive error management

## Development

### Adding New Pages

1. Create HTML file in the root directory
2. Add navigation link to `index.html` nav menu
3. Add corresponding styles to `styles.css`
4. Update `manifest.json` if needed for shortcuts

### Database Schema

The `users` table includes:
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `firstName`, `lastName` - User name fields
- `name` - Full name (computed)
- `whatsapp` - WhatsApp number
- `gender` - User gender
- `createdAt`, `updatedAt` - Timestamps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License

## Support

For support and questions:
- Email: support@kiuma.kiu.ac.ug
- WhatsApp: +256 XXX XXX XXX
- Visit: KIUMA Office, Kampala International University

## Version History

- **v1.0.0** - Initial release with core features
  - User authentication
  - PWA functionality
  - 15+ content pages
  - Notification system
  - Mobile app support
