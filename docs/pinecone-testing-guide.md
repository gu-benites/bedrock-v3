# Pinecone Vector Search Testing Guide

This guide helps you test the Pinecone integration for essential oils vector search.

## 🚀 Quick Start

### 1. Environment Setup

Make sure you have these environment variables in your `.env.local` file:

```bash
# OpenAI (required for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Pinecone (required for vector search)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=essential-oils-index
```

### 2. Run the Interactive Test

```bash
npm run test:pinecone
```

This will start an interactive session where you can:
- Type essential oil names (e.g., "lavender", "peppermint")
- Search by therapeutic properties (e.g., "calming", "muscle relaxant")
- Search by health concerns (e.g., "headache relief", "stress")

## 🧪 Test Scenarios

### Basic Oil Search
```
Search query: lavender
Search query: peppermint
Search query: eucalyptus
```

### Therapeutic Property Search
```
Search query: calming oils
Search query: muscle relaxant
Search query: anti-inflammatory
Search query: energizing
```

### Health Concern Search
```
Search query: headache relief
Search query: stress relief
Search query: muscle tension
Search query: mental fatigue
```

### Complex Queries
```
Search query: calming oils for headache
Search query: muscle relaxant for neck tension
Search query: energizing oils for mental fatigue
```

## 📊 Expected Output

For each search, you should see:

```
🔍 Search Results for: "lavender"
================================================================================

1. Lavender
   Botanical: Lavandula angustifolia
   Localized: Lavanda
   Similarity: 95.2%
   ID: oil-001-lavender
   Properties: Calming, Relaxing, Anti-inflammatory
   Description: Versatile oil known for its calming properties

2. Roman Chamomile
   Botanical: Anthemis nobilis
   Localized: Camomila Romana
   Similarity: 78.4%
   ID: oil-015-roman-chamomile
   Properties: Calming, Sedative, Anti-inflammatory
   Description: Gentle calming oil perfect for relaxation
```

## 🔧 Troubleshooting

### Error: "OPENAI_API_KEY environment variable is required"
**Solution**: Add your OpenAI API key to `.env.local`

### Error: "PINECONE_API_KEY environment variable is required"
**Solution**: Add your Pinecone API key to `.env.local`

### Error: "Failed to initialize Pinecone"
**Solutions**:
1. Check if your Pinecone API key is correct
2. Verify the index name exists in your Pinecone dashboard
3. Ensure your Pinecone plan supports the required features

### Error: "Index not found"
**Solutions**:
1. Create the index in Pinecone dashboard
2. Use dimension 1536 (for text-embedding-ada-002)
3. Use cosine similarity metric

### No search results returned
**Possible causes**:
1. Index is empty (no vectors uploaded)
2. Search query doesn't match any vectors
3. Similarity threshold is too high

## 📈 Performance Expectations

- **Embedding generation**: 200-500ms
- **Pinecone search**: 100-300ms
- **Total search time**: 300-800ms
- **Results**: 5-10 similar oils per query

## 🔍 Debugging Tips

### Enable Verbose Logging
The test script includes detailed logging:
- 🔄 Step indicators
- ✅ Success messages
- ❌ Error messages
- 🐛 Debug information

### Check Index Stats
The script will show:
- Total vectors in index
- Index dimensions
- Available namespaces

### Validate Embeddings
- Embeddings should be 1536 dimensions
- All values should be between -1 and 1
- Non-zero vectors indicate successful generation

## 🎯 Integration Testing

Once Pinecone testing works, you can:

1. **Update the vector search tool** to use real Pinecone
2. **Test the oils integration** with `npm run test:oils`
3. **Use the debug button** in the UI for end-to-end testing

## 📝 Sample Test Session

```bash
$ npm run test:pinecone

🧪 Pinecone Vector Search Test
==================================================
🔄 Checking environment variables...
✅ Environment variables validated
✅ OpenAI client initialized
✅ Pinecone client initialized with index: essential-oils-index
🔄 Testing Pinecone index health...
✅ Index health check passed
ℹ Index: essential-oils-index
ℹ Total vectors: 150
ℹ Dimensions: 1536

🌿 Interactive Essential Oil Search
Type an essential oil name or therapeutic property to search for similar oils.
Examples: "lavender", "calming oils", "muscle relaxant", "headache relief"
Type "quit" or "exit" to stop.

Search query: lavender
🔄 Generating embedding for: "lavender"
✅ Embedding generated (1536 dimensions)
🔄 Searching Pinecone for 10 most similar results...
✅ Found 8 results

🔍 Search Results for: "lavender"
================================================================================
[Results displayed here...]

Search query: quit
ℹ Goodbye!
```

## 🚨 Important Notes

1. **Rate Limits**: OpenAI has rate limits for embeddings API
2. **Costs**: Each embedding generation costs ~$0.0001
3. **Index Size**: Pinecone free tier has vector limits
4. **Latency**: First query may be slower due to cold start

## 🔗 Next Steps

After successful Pinecone testing:
1. Update vector search tool to use real Pinecone
2. Test the complete oils integration workflow
3. Deploy to production with proper error handling
