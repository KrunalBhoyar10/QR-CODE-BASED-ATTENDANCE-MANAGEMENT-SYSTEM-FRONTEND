# Teacher Frontend - QR Code Based Attendance Management System

A comprehensive React-based frontend application for teachers to manage attendance sessions through QR code scanning. This application is completely assignment-driven and integrates seamlessly with the backend TeachingAssignment APIs.

## Features

### 🎯 Assignment-Driven Architecture
- **No mock data**: All data comes from real backend APIs
- **Assignment-based filtering**: Teachers only see subjects they are assigned to
- **Hierarchical navigation**: Program → Academic Year → Section → Subject
- **Real-time validation**: Assignment verification before session creation

### 📚 Core Functionality
- **Dashboard**: Quick overview with stats and recent sessions
- **My Assignments**: View all teaching assignments with detailed breakdown
- **Programs**: Hierarchical view of programs and assigned subjects
- **Active Sessions**: Create and manage live attendance sessions
- **Previous Sessions**: View history and attendance analytics
- **Attendance Records**: Detailed student attendance data
- **Profile Management**: Update personal information and change password

### 🎫 QR Code Session Management
- **Real-time session creation** with geolocation
- **QR code display** with countdown timer
- **Location-based attendance** with GPS validation
- **Face verification support** (configurable)
- **Automatic session expiry** with visual indicators
- **Session status tracking** (Active/Completed/Cancelled)

### 📱 Responsive Design
- **Mobile-first approach** with Tailwind CSS
- **Touch-friendly interface** for tablet and mobile devices
- **Collapsible sidebar** for mobile navigation
- **Responsive tables** with horizontal scrolling
- **Optimized for classroom use**

## Technology Stack

- **Frontend Framework**: React 18
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **QR Code Generation**: react-qr-code
- **Icons**: Heroicons React
- **Notifications**: react-hot-toast
- **Date Handling**: date-fns

## Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Backend API running (default: http://localhost:3000)

## Installation

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**:
   ```env
   REACT_APP_API_URL=http://localhost:3000/api/v1
   ```

5. **Start development server**:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3001

## Project Structure

```
frontend/
├── public/
│   └── index.html          # Main HTML template
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AssignmentCard.js
│   │   ├── ProgramSelector.js
│   │   ├── AcademicYearSelector.js
│   │   ├── SectionSelector.js
│   │   ├── SubjectSelector.js
│   │   ├── SessionCreationForm.js
│   │   ├── QRDisplay.js
│   │   ├── SessionTimer.js
│   │   ├── ActiveSessionCard.js
│   │   ├── AttendanceTable.js
│   │   ├── Layout.js
│   │   └── LoadingSpinner.js
│   ├── contexts/
│   │   └── AuthContext.js  # Authentication context
│   ├── pages/              # Main application pages
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── MyAssignments.js
│   │   ├── Programs.js
│   │   ├── ActiveSessions.js
│   │   ├── PreviousSessions.js
│   │   ├── Attendance.js
│   │   └── Profile.js
│   ├── services/
│   │   └── api.js          # API service layer
│   ├── App.js              # Main application component
│   ├── index.js           # Application entry point
│   └── index.css          # Global styles
├── package.json
└── README.md
```

## API Integration

### Authentication
- JWT token-based authentication
- Automatic token attachment to requests
- Token refresh handling
- Logout cleanup

### Teacher Endpoints
- `GET /teacher/profile` - Teacher profile information
- `GET /teacher/assignments` - Teaching assignments (grouped and flat)
- `GET /teacher/programs` - Assigned programs
- `GET /teacher/academic-years` - Assigned academic years
- `GET /teacher/sections` - Assigned sections
- `GET /teacher/subjects` - Assigned subjects
- `POST /teacher/sessions` - Create attendance session
- `GET /teacher/sessions/active` - Active sessions
- `GET /teacher/sessions` - Session history
- `POST /teacher/sessions/:id/close` - Close session
- `GET /teacher/sessions/:id/attendance` - Session attendance

### Geolocation Integration
- Browser geolocation API
- GPS coordinate capture
- Location permission handling
- Accuracy validation

## Key Components

### SessionCreationForm
- **Assignment Selection**: Program → Academic Year → Section → Subject
- **Location Capture**: GPS coordinates with accuracy
- **Configuration Options**: Duration, radius, face verification
- **Validation**: Real assignment verification

### QRDisplay
- **QR Code Generation**: Base64 encoded session data
- **Session Information**: Subject, program, section details
- **Timer Display**: Visual countdown to expiry
- **Instructions**: Step-by-step guidance for students

### AttendanceTable
- **Student Records**: Name, roll number, status
- **Filtering**: By status (Present/Absent/Late)
- **Search**: By student name or roll number
- **Pagination**: Efficient data loading

### AssignmentCard
- **Assignment Details**: Subject, program, section
- **Status Indicators**: Active/Inactive visual cues
- **Click Actions**: View detailed assignment information

## Security Features

- **JWT Token Management**: Secure token storage and refresh
- **Route Protection**: Authenticated routes only
- **Role-Based Access**: Teacher-specific endpoints
- **Input Validation**: Client-side validation with server verification
- **HTTPS Support**: Production-ready secure communication

## Mobile Responsiveness

- **Breakpoint Design**: sm, md, lg, xl responsive breakpoints
- **Touch Optimization**: Large touch targets, swipe gestures
- **Sidebar Navigation**: Collapsible mobile menu
- **Table Scrolling**: Horizontal scroll for large datasets
- **Form Layout**: Stacked form fields on mobile

## Error Handling

- **Network Errors**: Connection timeout and retry logic
- **API Errors**: Structured error messages from backend
- **Form Validation**: Real-time input validation
- **Loading States**: Skeleton screens and spinners
- **Toast Notifications**: User-friendly success/error messages

## Performance Optimizations

- **Lazy Loading**: Code splitting with React.lazy
- **API Caching**: Strategic caching for static data
- **Polling Optimization**: Efficient refresh intervals
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Splitting**: Separate vendor and app bundles

## Development Guidelines

### Component Standards
- **Functional Components**: Use React hooks
- **PropTypes**: Type checking for props
- **Error Boundaries**: Graceful error handling
- **Accessibility**: ARIA labels and keyboard navigation

### State Management
- **React Context**: Global state (auth, theme)
- **Local State**: Component-specific data
- **Custom Hooks**: Reusable stateful logic
- **Effect Cleanup**: Prevent memory leaks

### Code Style
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Naming Conventions**: camelCase for JS, kebab-case for CSS
- **File Organization**: Feature-based folder structure

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```env
REACT_APP_API_URL=https://your-api-domain.com/api/v1
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 88+
- **Required Features**: ES6 modules, Fetch API, Geolocation API
- **Polyfills**: Included for older browser support

## Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Follow coding standards**: ESLint and Prettier
4. **Write tests**: Component and integration tests
5. **Submit pull request**: With detailed description

## Troubleshooting

### Common Issues

**API Connection Error**:
- Verify backend server is running
- Check REACT_APP_API_URL in .env
- Confirm CORS configuration on backend

**Geolocation Permission Denied**:
- Enable location services in browser
- Check HTTPS requirement for geolocation
- Provide fallback location input

**QR Code Not Scanning**:
- Verify QR code data format
- Check mobile camera permissions
- Test with different QR scanning apps

**Session Timer Issues**:
- Confirm system clock synchronization
- Check timezone configuration
- Verify server-side session expiry

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and React Developer Tools support.

## License

This project is part of the QR Code Based Attendance Management System. All rights reserved.

## Support

For technical support and questions:
- Create GitHub issues for bugs and feature requests
- Check API documentation for integration details
- Review browser console for client-side errors

---

**Note**: This frontend application is designed to work specifically with the QR Code Based Attendance Management System backend. Ensure the backend is properly configured and running before using this application.