# Configuration Requirements

This document outlines the specific configuration requirements for each example app in the Charmonator Apps Examples repository.

## General Requirements

### System Dependencies

- **Node.js**: Version 16.x or higher
- **NPM**: Version 8.x or higher
- **Express**: Version 4.x (installed in apps directory)
- **Charmonator Core**: Main Charmonator server

### Directory Structure

```
projects/
├── charmonator/                    # Main Charmonator repository
└── charmonator-apps-examples/      # This repository (must be sibling directory)
```

### Main Configuration File

All apps must be registered in `charmonator/conf/config.json`:

```json
{
  "apps": {
    "app-name": {
      "directory": "../charmonator-apps-examples/app-name",
      "enabled": true,
      "description": "App description"
    }
  }
}
```

## App-Specific Requirements

### Clinical Trial Matcher App

**Required Models:**
```json
{
  "models": {
    "hipaa:o3-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o3",
      "reasoning_effort": "high",
      "context_size": 200000,
      "output_limit": 100000,
      "description": "HIPAA-compliant OpenAI o3 for complex medical analysis"
    },
    "hipaa:gpt-4o": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4o",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "HIPAA-compliant GPT-4o fallback model"
    }
  }
}
```

**Configuration Entry:**
```json
{
  "apps": {
    "clinical-trial-matcher-app": {
      "directory": "../charmonator-apps-examples/clinical-trial-matcher-app",
      "enabled": true,
      "description": "AI-powered clinical trial eligibility assessment"
    }
  }
}
```

**Session Requirements:**
- Session duration: Standard (1-2 hours)
- Memory usage: Moderate (medical records + criteria)
- Storage: Temporary session-based only

### Chat with Records App

**Required Models:**
```json
{
  "models": {
    "hipaa:o3-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o3",
      "reasoning_effort": "high",
      "context_size": 200000,
      "output_limit": 100000,
      "description": "Primary model for complex medical conversations"
    },
    "hipaa:gpt-4o": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4o",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "Fallback model for general medical queries"
    }
  }
}
```

**Configuration Entry:**
```json
{
  "apps": {
    "chat-with-records-app": {
      "directory": "../charmonator-apps-examples/chat-with-records-app",
      "enabled": true,
      "description": "AI-powered chat with medical record context"
    }
  }
}
```

**Session Requirements:**
- Session duration: 24 hours
- Memory usage: High (full medical records + conversation history)
- Storage: Session-based with automatic cleanup

### Outlive Checklist App

**Required Models:**
```json
{
  "models": {
    "hipaa:o3-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o3",
      "reasoning_effort": "high",
      "context_size": 200000,
      "output_limit": 100000,
      "description": "Primary model for comprehensive health analysis"
    },
    "hipaa:o1-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o1",
      "reasoning_effort": "high",
      "context_size": 128000,
      "output_limit": 65536,
      "description": "Alternative model for complex reasoning tasks"
    },
    "hipaa:gpt-4o": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4o",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "Fallback model for standard analysis"
    }
  }
}
```

**Configuration Entry:**
```json
{
  "apps": {
    "outlive-checklist-app": {
      "directory": "../charmonator-apps-examples/outlive-checklist-app",
      "enabled": true,
      "description": "AI-powered health assessment based on Dr. Peter Attia's Outlive book checklist"
    }
  }
}
```

**Session Requirements:**
- Session duration: 24 hours
- Memory usage: High (comprehensive medical records + analysis)
- Storage: Session-based with report history option

### Undiagnosed Diseases App

**Required Models:**
```json
{
  "models": {
    "hipaa:o3-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o3",
      "reasoning_effort": "high",
      "context_size": 200000,
      "output_limit": 100000,
      "description": "Primary model for complex rare disease analysis"
    },
    "hipaa:o1-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o1",
      "reasoning_effort": "high",
      "context_size": 128000,
      "output_limit": 65536,
      "description": "Alternative model for diagnostic reasoning"
    },
    "hipaa:gpt-4o": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4o",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "Fallback model for general medical tasks"
    }
  }
}
```

**Configuration Entry:**
```json
{
  "apps": {
    "undiagnosed-diseases-app": {
      "directory": "../charmonator-apps-examples/undiagnosed-diseases-app",
      "enabled": true,
      "description": "AI-powered application assistance for the Undiagnosed Diseases Network program"
    }
  }
}
```

**Session Requirements:**
- Session duration: 48 hours (extended for complex cases)
- Memory usage: Very high (large medical records + diagnostic history)
- Storage: Session-based with application draft saving

### CBT Alcohol Coach App

**Required Models:**
```json
{
  "models": {
    "hipaa:gpt-4.1": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4.1",
      "context_size": 1000000,
      "output_limit": 32768,
      "temperature": 0.3,
      "description": "Primary model for therapeutic conversations"
    },
    "hipaa:o3-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o3",
      "reasoning_effort": "high",
      "context_size": 200000,
      "output_limit": 100000,
      "description": "Alternative model for complex therapeutic situations"
    },
    "hipaa:gpt-4o": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4o",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "Fallback model for general coaching"
    }
  }
}
```

**Configuration Entry:**
```json
{
  "apps": {
    "cbt-alcohol-coach-app": {
      "directory": "../charmonator-apps-examples/cbt-alcohol-coach-app",
      "enabled": true,
      "description": "Real-time CBT-based alcohol-use disorder AI coach with session memory and urgent intervention support"
    }
  }
}
```

**Session Requirements:**
- Session duration: 1 hour (therapeutic sessions)
- Memory usage: Moderate (session history + therapeutic context)
- Storage: Session-based with conversation memory
- Special files: Requires `resources/cbt-alcohol-use-disorder-prompt.md`

## Complete Example Configuration

Here's a complete `config.json` example with all apps configured:

```json
{
  "default_system_message": "You are a helpful assistant.",
  "default_temperature": 0.8,
  "default_chat_model": "hipaa:o3-high",
  "default_embedding_model": "openai:text-embedding-3-large",
  "default_dispatch_model": "hipaa:gpt-4o",
  
  "server": {
    "port": 5002,
    "baseUrl": "/charm",
    "charmonator": {
      "apiPath": "api/charmonator",
      "apiVersion": "v1"
    },
    "charmonizer": {
      "apiPath": "api/charmonizer",
      "apiVersion": "v1"
    },
    "jobsDir": "./jobs"
  },
  
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
  },
  
  "models": {
    "hipaa:o3-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o3",
      "reasoning_effort": "high",
      "context_size": 200000,
      "output_limit": 100000,
      "description": "HIPAA-compliant OpenAI o3 for complex medical analysis"
    },
    "hipaa:o1-high": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "o1",
      "reasoning_effort": "high",
      "context_size": 128000,
      "output_limit": 65536,
      "description": "HIPAA-compliant OpenAI o1 for complex reasoning"
    },
    "hipaa:gpt-4.1": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4.1",
      "context_size": 1000000,
      "output_limit": 32768,
      "temperature": 0.3,
      "description": "HIPAA-compliant GPT-4.1 for therapeutic applications"
    },
    "hipaa:gpt-4o": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4o",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "HIPAA-compliant GPT-4o for general medical tasks"
    },
    "hipaa:gpt-4o-mini": {
      "api": "OpenAI",
      "model_type": "chat",
      "api_key": "your-hipaa-api-key",
      "model": "gpt-4o-mini",
      "context_size": 128000,
      "output_limit": 16384,
      "description": "HIPAA-compliant GPT-4o-mini for faster processing"
    },
    "openai:text-embedding-3-large": {
      "api": "OpenAI",
      "model_type": "embedding",
      "api_key": "your-api-key",
      "model": "text-embedding-3-large",
      "context_size": 8191,
      "description": "OpenAI large text embedding model"
    }
  },
  
  "tools": {
    "web_search": {
      "code": "../tools/web_search_tool.mjs",
      "class": "WebSearchTool",
      "options": {
        "default_api": "duckduckgo"
      }
    },
    "calculator": {
      "code": "../tools/calculator.mjs"
    }
  }
}
```

## Security Configuration

### HIPAA Compliance Requirements

All medical apps require HIPAA-compliant AI models:

1. **API Endpoints**: Use only HIPAA-compliant API endpoints
2. **Data Handling**: Ensure all medical data stays local
3. **Session Security**: Implement proper session isolation
4. **Logging**: Disable medical data logging in production

### Environment Variables

Set these environment variables for secure operation:

```bash
# .env file
HIPAA_API_KEY=your-hipaa-compliant-api-key
SESSION_SECRET=your-secure-session-secret
NODE_ENV=production
CHARMONATOR_BASE_URL=/charm
```

### SSL Configuration

For production, enable HTTPS:

```javascript
// Add to server.mjs
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/ssl/private.key'),
  cert: fs.readFileSync('path/to/ssl/certificate.crt')
};

https.createServer(options, app).listen(5002);
```

## Monitoring and Maintenance

### Health Checks

Implement health checks for each app:

```javascript
// Example health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    apps: {
      'clinical-trial-matcher-app': 'loaded',
      'chat-with-records-app': 'loaded',
      'outlive-checklist-app': 'loaded',
      'undiagnosed-diseases-app': 'loaded',
      'cbt-alcohol-coach-app': 'loaded'
    }
  });
});
```

### Resource Monitoring

Monitor system resources:

- **Memory Usage**: Track session memory consumption
- **CPU Usage**: Monitor AI model processing load
- **Disk Space**: Track session storage and logs
- **Network**: Monitor API calls to external models

### Backup Strategy

Regular backups of:

1. **Configuration Files**: `config.json` and app configurations
2. **Session Data**: If using persistent session storage
3. **Custom Resources**: App-specific files and prompts
4. **SSL Certificates**: Security certificates and keys

## Troubleshooting

### Common Configuration Issues

1. **Model Not Found**: Verify model configuration in `config.json`
2. **Import Errors**: Check relative paths in route files
3. **Session Errors**: Verify session configuration and cleanup
4. **Permission Errors**: Check file permissions and directory access

### Debug Mode

Enable debug mode for troubleshooting:

```javascript
// Add to server.mjs
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

### Log Configuration

Configure logging for production:

```javascript
// Example logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'app.log' })
  ]
});
```