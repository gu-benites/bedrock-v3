# Recipe Creator Environment Variables

This document outlines the environment variables required for the Recipe Creator feature to function properly.

## Required Environment Variables

### `CREATE_RECIPE_APIKEY`

- **Description**: API key for authenticating with the external recipe service
- **Type**: String
- **Required**: Yes
- **Example**: `your_api_key_here`
- **Usage**: Used in the `apikey` header when making requests to the external API

### `CREATE_RECIPE_BASE_URL`

- **Description**: Base URL for the external recipe API endpoint
- **Type**: String (URL)
- **Required**: Yes
- **Default Fallback**: `https://webhook.daianefreitas.com/webhook/10p_build_recipe_protocols`
- **Example**: `https://webhook.daianefreitas.com/webhook/10p_build_recipe_protocols`
- **Usage**: The endpoint where recipe API requests are sent

## Configuration

### Development (.env.local)

Add these variables to your `.env.local` file:

```bash
# Recipe Creator API Configuration
CREATE_RECIPE_APIKEY=your_actual_api_key_here
CREATE_RECIPE_BASE_URL=https://webhook.daianefreitas.com/webhook/10p_build_recipe_protocols
```

### Production

Set these environment variables in your production environment:

```bash
CREATE_RECIPE_APIKEY=your_production_api_key
CREATE_RECIPE_BASE_URL=https://your-production-api-endpoint.com/webhook/recipe
```

## Validation

You can verify your configuration by visiting the health check endpoint:

```bash
GET /api/create-recipe
```

The response will include a `configured` field indicating whether all required environment variables are set:

```json
{
  "status": "healthy",
  "service": "Recipe Creator API Proxy",
  "version": "1.0.0",
  "configured": true,
  "configuration": {
    "hasApiKey": true,
    "hasBaseUrl": true,
    "variables": {
      "apiKey": "CREATE_RECIPE_APIKEY",
      "baseUrl": "CREATE_RECIPE_BASE_URL"
    }
  },
  "endpoints": {
    "external": "https://webhook.daianefreitas.com/webhook/10p_build_recipe_protocols",
    "timeout": 30000,
    "retries": 3
  },
  "timestamp": "2025-01-06T03:20:00.000Z"
}
```

## Migration from Old Variables

If you were previously using the old environment variable names, update them as follows:

| Old Variable Name | New Variable Name |
|------------------|-------------------|
| `EXTERNAL_APIKEY` | `CREATE_RECIPE_APIKEY` |
| Hardcoded URL | `CREATE_RECIPE_BASE_URL` |

## Troubleshooting

### Error: "Recipe creator API key not configured"

- **Cause**: The `CREATE_RECIPE_APIKEY` environment variable is not set
- **Solution**: Add the variable to your environment configuration

### Error: "Recipe creator API base URL not configured"

- **Cause**: The `CREATE_RECIPE_BASE_URL` environment variable is not set
- **Solution**: Add the variable to your environment configuration

### Health Check Shows `configured: false`

- **Cause**: One or both required environment variables are missing
- **Solution**: Check the `configuration` object in the health check response to see which variables are missing

## Response Format

The external API returns responses in a custom n8n workflow format:

```json
[
  {
    "index": 0,
    "message": {
      "role": "assistant",
      "content": {
        // Actual data (potential_causes, therapeutic_properties, etc.)
      },
      "refusal": null,
      "annotations": []
    },
    "logprobs": null,
    "finish_reason": "stop"
  }
]
```

The backend automatically extracts the `content` from this format and returns it to the frontend.

## Security Notes

- Never commit API keys to version control
- Use different API keys for development and production environments
- Ensure the base URL uses HTTPS in production
- The API key is logged partially in server logs for debugging (first 10 characters only)
