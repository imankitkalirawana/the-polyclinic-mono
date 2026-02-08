import 'dotenv/config';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Logger } from '@nestjs/common';
import { repl } from '@nestjs/core';

import { AppModule } from './app.module';

const logger = new Logger('Repl');

const HISTORY_SIZE = 1000;
/** Debounce ms so pasted multi-line input is written as one entry with one timestamp. */
const HISTORY_DEBOUNCE_MS = 150;

/** REPLServer with history array (added by Node at runtime; not in @types/node). */
type ReplServerWithHistory = Awaited<ReturnType<typeof repl>> & {
  history: string[];
};

function parseHistoryEntries(content: string): string[] {
  const lines = content.split('\n').map((s) => s.trimEnd());
  const hasTimestamps = lines.some((s) => s.startsWith('# '));
  if (!hasTimestamps) {
    return lines.filter((s) => s.length > 0);
  }
  const entries: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (current.length > 0) {
        entries.push(current.join('\n'));
        current = [];
      }
    } else if (line.length > 0) {
      current.push(line);
    }
  }
  if (current.length > 0) entries.push(current.join('\n'));
  return entries;
}

function setupNaturalOrderHistory(
  replServer: ReplServerWithHistory,
  historyPath: string,
) {
  // Load existing history (file is oldest-first / natural order)
  // Each "# timestamp" starts an entry; following lines until next "# " form one history item
  if (existsSync(historyPath)) {
    try {
      const content = readFileSync(historyPath, 'utf-8');
      const entries = parseHistoryEntries(content);
      const toLoad = entries.slice(-HISTORY_SIZE);
      for (const entry of toLoad) {
        replServer.history.push(entry);
      }
    } catch (error) {
      logger.warn('Could not load REPL history', error);
    }
  }

  // Debounce: multi-line paste = one timestamp, one entry
  let buffer: string[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (buffer.length === 0) return;
    const block = buffer.join('\n');
    buffer = [];
    flushTimer = null;
    try {
      const ts = new Date().toISOString();
      appendFileSync(historyPath, `# ${ts}\n${block}\n`);
    } catch (error) {
      logger.warn('Could not append to REPL history', error);
    }
  };

  replServer.on('line', (line) => {
    const trimmed = line?.trimEnd();
    if (!trimmed) return;
    buffer.push(trimmed);
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, HISTORY_DEBOUNCE_MS);
  });
}

async function bootstrap() {
  const replServer = await repl(AppModule);

  const historyPath = join(process.cwd(), '.repl.history');
  setupNaturalOrderHistory(replServer as ReplServerWithHistory, historyPath);
}
bootstrap();
