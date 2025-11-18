# YouTube Webhook Admin UI

A comprehensive React-based admin interface for managing YouTube Webhook Ingestion API data. Built with modern technologies including React 19, TypeScript, Vite, TailwindCSS, and React Query.

## Features

### Core Functionality
- **API Key Management**: Secure storage of API credentials in session storage
- **Webhook Events**: View and manage incoming webhook events with filtering and pagination
- **Channels**: Full CRUD operations for YouTube channels
- **Videos**: Full CRUD operations for tracked videos
- **Video Updates**: Audit trail of all video changes
- **PubSub Subscriptions**: Manage YouTube PubSubHubbub subscriptions

### Technical Features
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Modern UI**: Clean, responsive design using TailwindCSS and custom components
- **Data Management**: Efficient data fetching and caching with TanStack Query (React Query)
- **Routing**: Client-side routing with React Router v7
- **Testing**: Comprehensive unit tests with Vitest and React Testing Library
- **Code Quality**: ESLint and Prettier configuration for consistent code style

## Tech Stack

- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.2
- **Language**: TypeScript 5.9.3
- **Styling**: TailwindCSS 4.1.17
- **Data Fetching**: TanStack Query 5.90.10
- **Routing**: React Router 7.9.6
- **Testing**: Vitest 4.0.10, React Testing Library 16.3.0
- **Icons**: Lucide React 0.554.0

## Getting Started

### Prerequisites

- Node.js 18+ and npm 10+
- Access to YouTube Webhook Ingestion API
- API key for authentication

### Installation

1. Clone or navigate to the project directory:
```bash
cd youtube-webhook-admin-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Configuration

On first launch, you'll be prompted to enter:
- **API Base URL**: The base URL of your YouTube Webhook API (e.g., `http://localhost:8000`)
- **API Key**: Your API authentication key

These credentials are stored securely in session storage and will be cleared when you close the browser tab.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

## Project Structure

```
youtube-webhook-admin-ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Input, etc.)
│   │   ├── APIConfigForm.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── Layout.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Pagination.tsx
│   │   └── __tests__/      # Component tests
│   ├── contexts/           # React contexts
│   │   └── APIContext.tsx
│   ├── lib/               # Utilities and API client
│   │   ├── api-client.ts  # API client implementation
│   │   ├── storage.ts     # Secure storage utilities
│   │   ├── utils.ts       # Utility functions
│   │   └── __tests__/     # Utility tests
│   ├── pages/             # Page components
│   │   ├── Channels.tsx
│   │   ├── Subscriptions.tsx
│   │   ├── VideoUpdates.tsx
│   │   ├── Videos.tsx
│   │   └── WebhookEvents.tsx
│   ├── test/              # Test setup
│   │   └── setup.ts
│   ├── types/             # TypeScript type definitions
│   │   └── api.ts
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── .prettierrc            # Prettier configuration
├── .prettierignore        # Prettier ignore file
├── eslint.config.js       # ESLint configuration
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── vitest.config.ts       # Vitest configuration
├── package.json
└── README.md
```

## API Endpoints

The application integrates with the following API endpoints:

### Webhook Events
- `GET /api/v1/webhook-events` - List webhook events
- `GET /api/v1/webhook-events/:id` - Get event by ID
- `PATCH /api/v1/webhook-events/:id` - Update event status

### Channels
- `GET /api/v1/channels` - List channels
- `GET /api/v1/channels/:id` - Get channel by ID
- `POST /api/v1/channels` - Create channel
- `PUT /api/v1/channels/:id` - Update channel
- `DELETE /api/v1/channels/:id` - Delete channel

### Videos
- `GET /api/v1/videos` - List videos
- `GET /api/v1/videos/:id` - Get video by ID
- `POST /api/v1/videos` - Create video
- `PUT /api/v1/videos/:id` - Update video
- `DELETE /api/v1/videos/:id` - Delete video

### Video Updates
- `GET /api/v1/video-updates` - List video updates
- `GET /api/v1/video-updates/:id` - Get update by ID
- `POST /api/v1/video-updates` - Create update

### PubSub Subscriptions
- `GET /api/v1/subscriptions` - List subscriptions
- `GET /api/v1/subscriptions/:id` - Get subscription by ID
- `POST /api/v1/subscriptions` - Create subscription
- `PUT /api/v1/subscriptions/:id` - Update subscription
- `DELETE /api/v1/subscriptions/:id` - Delete subscription

## Testing

The project includes comprehensive unit tests for:
- API client methods
- Utility functions
- UI components
- User interactions

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

Tests cover:
- API client error handling and request formatting
- Component rendering and user interactions
- Form validation and submission
- Pagination logic
- Date formatting and string utilities
- Secure storage operations

## Security Features

- **API Key Storage**: Credentials stored in session storage with base64 encoding
- **Input Validation**: All user inputs are validated before submission
- **XSS Prevention**: React's built-in XSS protection
- **Type Safety**: TypeScript ensures type correctness throughout the application
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Best Practices

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write descriptive variable and function names
- Add JSDoc comments for complex logic

### Component Guidelines
- Keep components small and focused (single responsibility)
- Use TypeScript interfaces for props
- Implement proper loading and error states
- Make components reusable where possible
- Write tests for all components

### State Management
- Use React Query for server state
- Use React Context for global app state
- Use local state for component-specific data
- Implement proper cache invalidation

## Troubleshooting

### API Connection Issues
- Verify the API base URL is correct
- Ensure the API key is valid
- Check that the API server is running
- Verify CORS settings on the API server

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Ensure Node.js version is 18 or higher

### Test Issues
- Clear test cache: `npm run test -- --clearCache`
- Ensure all dependencies are installed
- Check that jsdom is properly configured

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting
5. Run linter and fix any issues

## License

MIT

## Support

For issues or questions, please contact your system administrator or refer to the API documentation.

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Testing with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/)
