// Debug utility to log all streaming events to files for analysis
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DEBUG_DIR = join(process.cwd(), 'debug-logs');

// Ensure debug directory exists
if (!existsSync(DEBUG_DIR)) {
  mkdirSync(DEBUG_DIR, { recursive: true });
}

export class StreamingLogger {
  private sessionId: string;
  private logFile: string;
  private rawDataFile: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.logFile = join(DEBUG_DIR, `streaming-${sessionId}.log`);
    this.rawDataFile = join(DEBUG_DIR, `streaming-${sessionId}-raw.json`);
    
    // Initialize log files
    this.writeLog('=== STREAMING SESSION STARTED ===');
    this.writeRawData({ sessionStart: new Date().toISOString() });
  }

  writeLog(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    appendFileSync(this.logFile, logEntry);
    console.log(`[STREAMING LOGGER] ${message}`);
  }

  writeRawData(data: any) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      data
    };
    appendFileSync(this.rawDataFile, JSON.stringify(entry, null, 2) + '\n---\n');
  }

  logAgentResult(result: any) {
    this.writeLog('=== AGENT RESULT ANALYSIS ===');
    
    // Log basic properties
    this.writeLog(`Result keys: ${Object.keys(result).join(', ')}`);
    this.writeLog(`Has newItems: ${!!result.newItems}`);
    this.writeLog(`Has finalOutput: ${!!result.finalOutput}`);
    
    // Log newItems in detail
    if (result.newItems && Array.isArray(result.newItems)) {
      this.writeLog(`NewItems count: ${result.newItems.length}`);
      
      result.newItems.forEach((item: any, index: number) => {
        this.writeLog(`--- NEW ITEM ${index} ---`);
        this.writeLog(`Type: ${item.type || 'unknown'}`);
        this.writeLog(`Role: ${item.role || 'unknown'}`);
        
        if (item.tool_calls && Array.isArray(item.tool_calls)) {
          this.writeLog(`Tool calls: ${item.tool_calls.length}`);
          item.tool_calls.forEach((call: any, callIndex: number) => {
            this.writeLog(`  Tool call ${callIndex}: ${call.function?.name || 'unknown'}`);
          });
        }
        
        if (item.content) {
          const contentPreview = typeof item.content === 'string' 
            ? item.content.substring(0, 200) 
            : JSON.stringify(item.content).substring(0, 200);
          this.writeLog(`Content preview: ${contentPreview}...`);
        }
      });
      
      // Save full newItems to raw data file
      this.writeRawData({
        type: 'newItems',
        count: result.newItems.length,
        items: result.newItems
      });
    }
    
    // Log finalOutput
    if (result.finalOutput) {
      this.writeLog('=== FINAL OUTPUT ===');
      this.writeLog(`Final output type: ${typeof result.finalOutput}`);
      
      if (typeof result.finalOutput === 'object') {
        this.writeLog(`Final output keys: ${Object.keys(result.finalOutput).join(', ')}`);
        
        // Check for property_oil_suggestions
        if (result.finalOutput.data?.property_oil_suggestions) {
          const suggestions = result.finalOutput.data.property_oil_suggestions;
          this.writeLog(`Property oil suggestions count: ${suggestions.length}`);
          
          suggestions.forEach((suggestion: any, index: number) => {
            this.writeLog(`  Property ${index}: ${suggestion.therapeutic_property_context?.property_name_localized || 'unknown'}`);
            this.writeLog(`    Oils count: ${suggestion.suggested_oils?.length || 0}`);
          });
        }
      }
      
      // Save full finalOutput to raw data file
      this.writeRawData({
        type: 'finalOutput',
        output: result.finalOutput
      });
    }
  }

  logStreamingEvent(event: any) {
    this.writeLog(`Streaming event: ${event.type || 'unknown'}`);
    this.writeRawData({
      type: 'streamingEvent',
      event
    });
  }

  logTextChunk(chunk: string) {
    this.writeLog(`Text chunk: ${chunk.length} chars`);
    this.writeRawData({
      type: 'textChunk',
      length: chunk.length,
      preview: chunk.substring(0, 100)
    });
  }

  close() {
    this.writeLog('=== STREAMING SESSION ENDED ===');
    this.writeRawData({ sessionEnd: new Date().toISOString() });
  }
}
