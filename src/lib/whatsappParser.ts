import { ParsedTask, Priority } from '@/types/task';

/**
 * Utility functions to parse WhatsApp text messages into structured Task objects.
 * Supports:
 * - WhatsApp chat headers:
 *    "[10.15, 05/10/2026] Budi: Task text"
 *    "[05/10/2026, 10:15] Budi: Task text"
 *    "05/10/2026, 10:15 - Budi: Task text"
 * - Multi-line bullet points / lists (- [ ], -, *, •, 1., 1) )
 * - Priority detection (!urgent, [PENTING], [SANTAI], ASAP, 🔥, etc.)
 * - Category / hashtag detection (#work, #personal, #finance, [Tag])
 * - Due date detection ("deadline: besok", "dl: lusa", "tenggat: 15/10/2026", "due: jumat")
 * - Time estimate ("est: 30m", "1 jam", "2h", "~45m")
 */

// Regex for WhatsApp timestamp and sender prefixes
const WA_HEADER_REGEX = /^(?:\[[\d\s,.:/apm-]+\]\s*(?:-\s*)?(?:[^:\n]{1,40}:)?|\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?,?\s+\d{1,2}[:.]\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?\s*-\s*[^:\n]{1,40}:|\d{1,2}[:.]\d{2}(?:\s*[AaPp][Mm])?\s*-\s*[^:\n]{1,40}:)\s*/i;

// Regex for list markers (- [ ], -, *, •, 1., 1) )
const LIST_MARKER_REGEX = /^[-*•]\s*(?:\[[ xX]\]\s*)?|^\d+[\.\)]\s*/;

export function parseWhatsAppMessage(rawText: string): ParsedTask[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Normalize line endings
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Group lines into distinct task candidates
  const taskChunks: string[] = [];
  let currentChunk: string[] = [];

  for (const line of lines) {
    const isNewListItem = LIST_MARKER_REGEX.test(line);
    const isNewWaHeader = WA_HEADER_REGEX.test(line);

    if ((isNewListItem || isNewWaHeader) && currentChunk.length > 0) {
      taskChunks.push(currentChunk.join('\n'));
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  }

  if (currentChunk.length > 0) {
    taskChunks.push(currentChunk.join('\n'));
  }

  // If no multiple bullet points were detected, treat each short non-empty line as a task
  if (taskChunks.length === 1 && lines.length > 1 && !LIST_MARKER_REGEX.test(lines[0]) && !WA_HEADER_REGEX.test(lines[0])) {
    const looksLikeItems = lines.every((l) => l.length < 140);
    if (looksLikeItems) {
      return lines.map((l) => parseSingleTask(l));
    }
  }

  return taskChunks.map((chunk) => parseSingleTask(chunk));
}

export function parseSingleTask(textBlock: string): ParsedTask {
  let cleanedText = textBlock;

  // 1. Remove WA header if present
  cleanedText = cleanedText.replace(WA_HEADER_REGEX, '').trim();

  // 2. Remove list marker if present
  cleanedText = cleanedText.replace(LIST_MARKER_REGEX, '').trim();

  // 3. Extract Priority
  let priority: Priority = 'MEDIUM';
  const highPriorityRegex = /(?:\[?(?:urgent|penting|high|p1|asap)\]?|!high|!urgent|🔥|⚡)/i;
  const lowPriorityRegex = /(?:\[?(?:low|santai|rendah|p3)\]?|!low)/i;

  if (highPriorityRegex.test(cleanedText)) {
    priority = 'HIGH';
    cleanedText = cleanedText.replace(highPriorityRegex, '').trim();
  } else if (lowPriorityRegex.test(cleanedText)) {
    priority = 'LOW';
    cleanedText = cleanedText.replace(lowPriorityRegex, '').trim();
  }

  // 4. Extract Category (Hashtags like #Work #Personal or [Kategori])
  let category = 'Personal';
  const categoryMatch = cleanedText.match(/#([a-zA-Z0-9_\-]+)/);
  if (categoryMatch) {
    category = categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1);
    cleanedText = cleanedText.replace(categoryMatch[0], '').trim();
  } else {
    const bracketCategoryMatch = cleanedText.match(/\[([a-zA-Z0-9_\-\s]{3,15})\]/);
    if (bracketCategoryMatch && !['urgent', 'penting', 'high', 'low', 'santai'].includes(bracketCategoryMatch[1].toLowerCase())) {
      category = bracketCategoryMatch[1].trim();
      cleanedText = cleanedText.replace(bracketCategoryMatch[0], '').trim();
    }
  }

  // 5. Extract Estimated Time (e.g. "est: 30m", "estimasi: 2 jam", "~1h", "45m", "2 jam")
  let estimatedTime: string | undefined = undefined;
  const estRegex = /(?:(?:est|estimasi|durasi)[:=]?\s*|~)(\d+\s*(?:m|mnt|menit|h|jam|hours?|mins?))/i;
  const estMatch = cleanedText.match(estRegex);
  if (estMatch) {
    estimatedTime = estMatch[1].trim();
    cleanedText = cleanedText.replace(estMatch[0], '').trim();
  } else {
    const parenEst = cleanedText.match(/\((\d+\s*(?:m|mnt|menit|h|jam|hours?|mins?))\)/i);
    if (parenEst) {
      estimatedTime = parenEst[1].trim();
      cleanedText = cleanedText.replace(parenEst[0], '').trim();
    }
  }

  // 6. Extract Due Date
  let dueDate: string | undefined = undefined;
  const deadlineRegex = /(?:deadline|tenggat|due|dl|target)[:=]?\s*([a-zA-Z0-9\/\-\.\s]+?)(?=(?:\s+[-•#~]|,\s*|\n|$))/i;
  const deadlineMatch = cleanedText.match(deadlineRegex);

  if (deadlineMatch) {
    const rawDateStr = deadlineMatch[1].trim().toLowerCase();
    const parsedDate = parseRelativeOrAbsoluteDate(rawDateStr);
    if (parsedDate) {
      dueDate = parsedDate.toISOString();
      cleanedText = cleanedText.replace(deadlineMatch[0], '').trim();
    }
  }

  // 7. Separate Title and Description (if multi-line)
  const contentLines = cleanedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let title = contentLines[0] || 'Tugas Baru';
  let description: string | undefined = undefined;

  if (contentLines.length > 1) {
    description = contentLines.slice(1).join('\n');
  }

  // Final cleanup on title (remove trailing punctuation or weird symbols)
  title = title.replace(/^[\s,:;\-]+|[\s,:;\-]+$/g, '').trim();
  if (!title) {
    title = 'Tugas Baru';
  }

  return {
    title,
    description,
    priority,
    category,
    dueDate,
    estimatedTime,
  };
}

/**
 * Helper to parse natural date words like 'hari ini', 'besok', 'lusa', or formatted dates like '10/10/2026'
 */
function parseRelativeOrAbsoluteDate(input: string): Date | null {
  const now = new Date();
  const lower = input.toLowerCase().trim();

  if (lower === 'hari ini' || lower === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);
  }
  if (lower === 'besok' || lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
    return d;
  }
  if (lower === 'lusa') {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    d.setHours(23, 59, 0, 0);
    return d;
  }

  // Days of the week in Indonesian & English
  const daysMap: Record<string, number> = {
    minggu: 0, sunday: 0,
    senin: 1, monday: 1,
    selasa: 2, tuesday: 2,
    rabu: 3, wednesday: 3,
    kamis: 4, thursday: 4,
    jumat: 5, "jum'at": 5, friday: 5,
    sabtu: 6, saturday: 6,
  };

  for (const [dayName, dayIndex] of Object.entries(daysMap)) {
    if (lower.startsWith(dayName)) {
      const currentDay = now.getDay();
      let distance = dayIndex - currentDay;
      if (distance <= 0) distance += 7;
      const target = new Date(now);
      target.setDate(target.getDate() + distance);
      target.setHours(23, 59, 0, 0);
      return target;
    }
  }

  // Date formats: DD/MM/YYYY or YYYY-MM-DD
  const dmyMatch = lower.match(/^(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = dmyMatch[3] ? parseInt(dmyMatch[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    const parsed = new Date(year, month, day, 23, 59, 0, 0);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const standardDate = new Date(input);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }

  return null;
}
