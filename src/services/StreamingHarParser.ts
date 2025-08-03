
import { CircularBuffer } from '../lib/CircularBuffer';

interface HarEntry {
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    content: {
      mimeType: string;
      text: string;
    };
  };
}

export class StreamingHarParser {
  private static readonly BATCH_SIZE = 100; // Process 100 entries at a time

  async *parseHarEntriesAsync(harContent: string): AsyncGenerator<HarEntry[]> {
    const entriesBuffer = new CircularBuffer<HarEntry>(StreamingHarParser.BATCH_SIZE);
    const jsonStream = this.createJsonStream(harContent);

    for await (const entry of jsonStream) {
      entriesBuffer.push(entry);
      if (entriesBuffer.length >= StreamingHarParser.BATCH_SIZE) {
        yield entriesBuffer.toArray();
        entriesBuffer.clear();
      }
    }

    if (entriesBuffer.length > 0) {
      yield entriesBuffer.toArray();
    }
  }

  private async *createJsonStream(harContent: string): AsyncGenerator<HarEntry> {
    const entriesMatcher = /"entries"\s*:\s*\[/g;
    const match = entriesMatcher.exec(harContent);
    if (!match) {
      throw new Error("Invalid HAR file: 'entries' array not found.");
    }
    
    const startIndex = match.index + match[0].length;
    let depth = 0;
    let lastSlice = startIndex;

    for (let i = startIndex; i < harContent.length; i++) {
      const char = harContent[i];

      if (char === '{') {
        if (depth === 0) {
          lastSlice = i;
        }
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          const entryStr = harContent.substring(lastSlice, i + 1);
          try {
            yield JSON.parse(entryStr);
          } catch (e) {
            console.warn("Failed to parse HAR entry, skipping.", e);
          }
        }
      } else if (char === ']' && depth === -1) {
        break; 
      }
    }
  }
}
