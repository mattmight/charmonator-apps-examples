# Charmonator Modular Apps Examples

This directory contains example applications that demonstrate the Charmonator modular app system.

## App System Overview

The Charmonator modular app system allows you to create self-contained applications with:

- **Static Assets**: HTML, CSS, JS files served from the app's `public` directory
- **API Routes**: Express.js routes defined in the app's `routes` directory
- **Configuration**: App-specific settings in `app-config.json`
- **Independence**: Each app is completely modular and can be enabled/disabled

## App Structure

Each app follows this directory structure:

```
my-app/
├── app-config.json          # App configuration
├── README.md                # App documentation
├── public/                  # Static files (HTML, CSS, JS, images)
│   ├── index.html
│   └── styles.css
└── routes/                  # Express route handlers
    ├── api.mjs
    └── admin.mjs
```

## App Configuration

The `app-config.json` file defines how your app integrates:

```json
{
  "name": "My Application",
  "description": "A sample Charmonator app",
  "version": "1.0.0",
  "baseRoute": "/apps/my-app",
  "staticRoute": "/apps/my-app", 
  "publicDir": "public",
  "routesDir": "routes",
  "enabled": true,
  "customProperty": "custom-value"
}
```

### Configuration Properties

- **name**: Display name for your app
- **description**: Brief description of app functionality
- **version**: Semantic version of your app
- **baseRoute**: Base URL path for API routes (e.g., `/apps/my-app`)
- **staticRoute**: URL path for static files (e.g., `/apps/my-app`)
- **publicDir**: Directory containing static assets (default: `public`)
- **routesDir**: Directory containing route handlers (default: `routes`)
- **enabled**: Whether the app should be loaded (default: `true`)

You can add custom properties for app-specific configuration.

## Route Handlers

Route files should export an Express router:

```javascript
// routes/api.mjs
import express from 'express';
import { getAppConfig } from '../../../lib/app-loader.mjs';

const router = express.Router();

router.get('/hello', (req, res) => {
  const config = getAppConfig('my-app');
  res.json({ 
    message: 'Hello from my app!',
    version: config?.version 
  });
});

export default router;
```

## Static Files

Files in the `public` directory are served at the app's `staticRoute`:

- `public/index.html` → `/apps/my-app/index.html`
- `public/styles.css` → `/apps/my-app/styles.css`
- `public/js/app.js` → `/apps/my-app/js/app.js`

## App Registration

Register your app in the main `conf/config.json`:

```json
{
  "apps": {
    "my-app": {
      "directory": "./examples/my-app",
      "enabled": true,
      "description": "My custom application"
    }
  }
}
```

## Available Examples

- **[clinical-trial-matcher-app](./clinical-trial-matcher-app/)**: AI-powered clinical trial eligibility assessment with comprehensive API and mobile interface
- **[chat-with-records-app](./chat-with-records-app/)**: AI-powered conversational interface for medical record interaction with HIPAA-compliant models
- **[outlive-checklist-app](./outlive-checklist-app/)**: Health assessment tool based on Dr. Peter Attia's longevity framework with risk evaluation
- **[undiagnosed-diseases-app](./undiagnosed-diseases-app/)**: Application assistance for the Undiagnosed Diseases Network program with rare disease pattern recognition
- **[cbt-alcohol-coach-app](./cbt-alcohol-coach-app/)**: Real-time CBT-based alcohol recovery coach with crisis intervention and therapeutic memory

## Creating a New App

1. **Create app directory**: `mkdir examples/my-app`
2. **Add configuration**: Create `app-config.json`
3. **Add static files**: Create `public/` directory with HTML/CSS/JS
4. **Add routes**: Create `routes/` directory with Express handlers
5. **Register app**: Add entry to main `config.json`
6. **Restart server**: Charmonator will load your app automatically

## Development Tips

- **Hot Reload**: Restart the server to reload app changes
- **Configuration Access**: Use `getAppConfig(appId)` in routes to access config
- **Error Handling**: Check server logs for app loading errors
- **Static Assets**: Reference static files relative to your `staticRoute`
- **Route Conflicts**: Ensure `baseRoute` doesn't conflict with existing endpoints

## Best Practices

- Keep apps self-contained and modular
- Use clear, descriptive route paths
- Include proper error handling in routes
- Document your app's API endpoints
- Version your apps semantically
- Test apps in isolation before deployment