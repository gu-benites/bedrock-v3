# Environment Variables

This document lists all environment variables required for the application.

## Core Application

```bash
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Sentry (optional)
SENTRY_DSN=your_sentry_dsn
```

## AI Integration

```bash
# OpenAI API (required for all AI features)
OPENAI_API_KEY=your_openai_api_key

# Pinecone Vector Database (required for suggested oils feature)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=essential-oils-index
PINECONE_DIMENSION=1536
PINECONE_METRIC=cosine
```

## Recipe Creator API

```bash
# External Recipe API (if using external service)
CREATE_RECIPE_APIKEY=your_recipe_api_key
CREATE_RECIPE_BASE_URL=https://api.example.com
```

## Development

```bash
# Node Environment
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

## Suggested Oils Feature Setup

The suggested oils feature requires:

1. **OpenAI API Key**: For generating embeddings and running AI agents
2. **Pinecone Vector Database**: For semantic similarity search of essential oils

### Pinecone Setup

1. Create a Pinecone account at https://pinecone.io
2. Create a new index with these settings:
   - **Name**: `essential-oils-index` (or set `PINECONE_INDEX_NAME`)
   - **Dimensions**: `1536` (for OpenAI text-embedding-ada-002)
   - **Metric**: `cosine`
   - **Environment**: Choose your preferred region

3. Add your Pinecone credentials to `.env.local`:
   ```bash
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=essential-oils-index
   ```

### Essential Oils Data

The Pinecone index should be populated with essential oils data including:
- Oil names (English, botanical, localized)
- Therapeutic properties
- Health concerns they address
- Descriptions and safety information

Each oil record should be vectorized using OpenAI embeddings for semantic search.

## Environment File Example

Create a `.env.local` file in your project root:

```bash
# Core
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI
OPENAI_API_KEY=sk-your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=essential-oils-index

# Optional
SENTRY_DSN=your_sentry_dsn
CREATE_RECIPE_APIKEY=your_recipe_api_key
CREATE_RECIPE_BASE_URL=https://api.example.com
```

## Validation

The application includes environment validation for critical services:

- **OpenAI**: Validated on AI streaming requests
- **Pinecone**: Validated when using vector search tools
- **Supabase**: Validated on authentication requests

Missing environment variables will result in clear error messages in the console and API responses.
