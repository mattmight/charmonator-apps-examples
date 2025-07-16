# Charmonator Apps Integration Guide

This guide provides comprehensive instructions for integrating the example apps into your Charmonator configuration.

## Prerequisites

Before integrating these apps, ensure you have:

1. **Charmonator Core**: The main Charmonator server running
2. **Node.js Dependencies**: Express and other required packages
3. **HIPAA-Compliant Models**: Configured AI models for medical applications
4. **Proper Directory Structure**: Apps repository cloned alongside Charmonator

## Directory Structure

The recommended directory structure is:

```
projects/
├── charmonator/                    # Main Charmonator repository
│   ├── conf/config.json           # Main configuration file
│   ├── lib/                       # Core Charmonator libraries
│   ├── server.mjs                 # Main server file
│   └── ...
└── charmonator-apps-examples/      # This repository
    ├── package.json               # Apps dependencies
    ├── README.md                  # This file
    ├── INTEGRATION_GUIDE.md       # Integration instructions
    ├── clinical-trial-matcher-app/
    ├── chat-with-records-app/
    ├── outlive-checklist-app/
    ├── undiagnosed-diseases-app/
    └── cbt-alcohol-coach-app/
```

## Installation Steps

### 1. Clone or Move Apps Repository

If you haven't already, position the apps repository alongside the main Charmonator directory:

```bash
# From the projects directory
git clone https://github.com/your-org/charmonator-apps-examples.git
# OR move existing directory
mv charmonator/examples charmonator-apps-examples
```

### 2. Install Dependencies

Install the required Node.js packages for the apps:

```bash
cd charmonator-apps-examples
npm install
```

### 3. Configure Main Charmonator

Update your main Charmonator configuration file (`charmonator/conf/config.json`) to include the apps:

```json
{
  "apps": {
    "clinical-trial-matcher-app": {
      "directory": "../charmonator-apps-examples/clinical-trial-matcher-app",
      "enabled": true,
      "description": "AI-powered clinical trial eligibility assessment"
    },
    "chat-with-records-app": {
      "directory": "../charmonator-apps-examples/chat-with-records-app",
      "enabled": true,
      "description": "AI-powered chat with medical record context"
    },
    "outlive-checklist-app": {
      "directory": "../charmonator-apps-examples/outlive-checklist-app",
      "enabled": true,
      "description": "AI-powered health assessment based on Dr. Peter Attia's Outlive book checklist"
    },
    "undiagnosed-diseases-app": {
      "directory": "../charmonator-apps-examples/undiagnosed-diseases-app",
      "enabled": true,
      "description": "AI-powered application assistance for the Undiagnosed Diseases Network program"
    },
    "cbt-alcohol-coach-app": {
      "directory": "../charmonator-apps-examples/cbt-alcohol-coach-app",
      "enabled": true,
      "description": "Real-time CBT-based alcohol-use disorder AI coach with session memory and urgent intervention support"
    }
  }
}
```

### 4. Configure HIPAA-Compliant Models

These apps require HIPAA-compliant AI models. Add the following to your `models` section in `config.json`:

```json
{
  "models": {
    "hipaa:o3-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-compliant-api-key",
      "model": "o3",
      "reasoning_effort": "high",
      "context_size": 200000,
      "output_limit": 100000,
      "description": "HIPAA-compliant OpenAI o3 for complex medical analysis"
    },
    "hipaa:gpt-4o": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-compliant-api-key",
      "model": "gpt-4o",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "HIPAA-compliant GPT-4o for general medical tasks"
    },
    "hipaa:gpt-4o-mini": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-compliant-api-key",
      "model": "gpt-4o-mini",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "HIPAA-compliant GPT-4o-mini for faster processing"
    }
  }
}
```

### 5. Start the Server

Start the Charmonator server from the main directory:

```bash
cd charmonator
node server.mjs
```

The server should show successful app loading messages:

```
✅ Loaded route: clinical-trial-matcher for app clinical-trial-matcher-app
✅ Loaded route: chat-with-records for app chat-with-records-app
✅ Loaded route: outlive-checklist for app outlive-checklist-app
✅ Loaded route: undiagnosed-diseases for app undiagnosed-diseases-app
✅ Loaded route: cbt-alcohol-coach for app cbt-alcohol-coach-app
```

## App-Specific Configuration

### Clinical Trial Matcher App

**Routes Available:**
- `GET /charm/apps/clinical-trial-matcher/clinical-trial-matcher.html`
- `POST /charm/apps/clinical-trial-matcher/clinical-trial-matcher`
- `GET /charm/apps/clinical-trial-matcher/info`

**Required Models:** `hipaa:o3-high`, `hipaa:gpt-4o`

**Configuration Notes:**
- Uses complex reasoning for eligibility assessment
- Requires structured medical records
- Supports mobile PWA installation

### Chat with Records App

**Routes Available:**
- `GET /charm/apps/chat-with-records/chat-with-records.html`
- `POST /charm/apps/chat-with-records/pre-populate`
- `GET /charm/apps/chat-with-records/session/:sessionId`
- `POST /charm/apps/chat-with-records/chat`

**Required Models:** `hipaa:o3-high`, `hipaa:gpt-4o`

**Configuration Notes:**
- 24-hour session expiration
- Requires medical record pre-population
- Supports conversation history

### Outlive Checklist App

**Routes Available:**
- `GET /charm/apps/outlive-checklist/outlive-checklist.html`
- `POST /charm/apps/outlive-checklist/pre-populate`
- `GET /charm/apps/outlive-checklist/session/:sessionId`
- `POST /charm/apps/outlive-checklist/analyze`

**Required Models:** `hipaa:o3-high`, `hipaa:o1-high`

**Configuration Notes:**
- Evaluates five longevity categories
- Requires comprehensive medical records
- Supports trend analysis over time

### Undiagnosed Diseases App

**Routes Available:**
- `GET /charm/apps/undiagnosed-diseases/undiagnosed-diseases.html`
- `POST /charm/apps/undiagnosed-diseases/pre-populate`
- `GET /charm/apps/undiagnosed-diseases/session/:sessionId`
- `POST /charm/apps/undiagnosed-diseases/analyze`
- `POST /charm/apps/undiagnosed-diseases/application-draft`

**Required Models:** `hipaa:o3-high`, `hipaa:o1-high`

**Configuration Notes:**
- 48-hour session expiration for complex cases
- Supports large medical record sizes (500KB)
- Generates UDN application drafts

### CBT Alcohol Coach App

**Routes Available:**
- `GET /charm/apps/cbt-alcohol-coach-app/cbt-alcohol-coach.html`
- `POST /charm/apps/cbt-alcohol-coach-app/pre-populate`
- `GET /charm/apps/cbt-alcohol-coach-app/session/:sessionId`
- `POST /charm/apps/cbt-alcohol-coach-app/interface`
- `POST /charm/apps/cbt-alcohol-coach-app/urgent-session`

**Required Models:** `hipaa:gpt-4.1`, `hipaa:o3-high`

**Configuration Notes:**
- 1-hour session duration
- Supports crisis intervention
- Requires therapeutic system prompt

## Testing Integration

### 1. Verify App Loading

Check the server console for successful app loading:

```bash
# Should see messages like:
✅ Loaded route: clinical-trial-matcher for app clinical-trial-matcher-app
✅ Registered app: clinical-trial-matcher-app at /apps/clinical-trial-matcher
```

### 2. Test Static File Serving

Verify that static files are accessible:

```bash
# Test each app's main HTML file
curl http://localhost:5002/charm/apps/clinical-trial-matcher/clinical-trial-matcher.html
curl http://localhost:5002/charm/apps/chat-with-records/chat-with-records.html
curl http://localhost:5002/charm/apps/outlive-checklist/outlive-checklist.html
curl http://localhost:5002/charm/apps/undiagnosed-diseases/undiagnosed-diseases.html
curl http://localhost:5002/charm/apps/cbt-alcohol-coach-app/cbt-alcohol-coach.html
```

### 3. Test API Endpoints

Test the info endpoints for each app:

```bash
# Clinical Trial Matcher
curl http://localhost:5002/charm/apps/clinical-trial-matcher/info

# Test pre-populate endpoints
curl -X POST http://localhost:5002/charm/apps/chat-with-records/pre-populate \
  -H "Content-Type: application/json" \
  -d '{"medicalRecord": "Test medical record"}'
```

## Troubleshooting

### Common Issues

1. **Apps Not Loading**
   - Check directory paths in `config.json`
   - Verify import paths in route files
   - Ensure Express dependency is installed

2. **Model Not Found Errors**
   - Verify HIPAA-compliant models are configured
   - Check API keys and endpoints
   - Confirm model names match app requirements

3. **Import Path Errors**
   - Check that route files use correct relative paths
   - Verify `../../../charmonator/lib/` paths are correct
   - Ensure Charmonator core files are accessible

4. **Session Errors**
   - Verify session storage configuration
   - Check session expiration settings
   - Confirm memory/database session handling

### Debug Steps

1. **Check Server Logs**
   ```bash
   node server.mjs 2>&1 | grep -E "(Failed|Error|✅)"
   ```

2. **Verify File Permissions**
   ```bash
   ls -la charmonator-apps-examples/*/routes/
   ```

3. **Test Individual Apps**
   ```bash
   # Disable other apps and test one at a time
   # Update config.json to enable only one app
   ```

## Security Considerations

### HIPAA Compliance

- **Model Configuration**: Only use HIPAA-compliant API endpoints
- **Data Handling**: Ensure medical data stays on localhost
- **Session Management**: Implement proper session cleanup
- **Logging**: Disable medical data logging in production

### Access Control

- **Network Security**: Restrict access to internal networks
- **Authentication**: Implement proper user authentication
- **Authorization**: Control access to sensitive apps
- **Audit Logging**: Track app usage and access patterns

## Production Deployment

### Environment Variables

Configure environment-specific settings:

```bash
# .env file
CHARMONATOR_PORT=5002
CHARMONATOR_BASE_URL=/charm
HIPAA_API_KEY=your-hipaa-compliant-key
SESSION_SECRET=your-session-secret
```

### SSL Configuration

Enable HTTPS for production:

```javascript
// server.mjs modifications
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(5002);
```

### Load Balancing

Consider load balancing for high-traffic deployments:

```nginx
# nginx.conf
upstream charmonator {
    server localhost:5002;
    server localhost:5003;
}

server {
    listen 80;
    location /charm/ {
        proxy_pass http://charmonator;
    }
}
```

## Maintenance

### Regular Updates

1. **App Updates**: Pull latest app versions regularly
2. **Model Updates**: Update AI models as new versions become available
3. **Security Patches**: Apply security updates promptly
4. **Performance Monitoring**: Monitor app performance and resource usage

### Backup Strategy

- **Configuration Backup**: Regular backup of `config.json`
- **Session Data**: Backup session storage if persistent
- **App Data**: Backup any app-specific data storage
- **System Backup**: Full system backup including all apps

## Support

For integration support:

1. **Documentation**: Refer to individual app README files
2. **Issues**: Report issues on the GitHub repository
3. **Community**: Join the Charmonator community forums
4. **Professional Support**: Contact for enterprise support options