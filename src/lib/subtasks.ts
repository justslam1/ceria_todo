export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ParsedDescription {
  note: string;
  subtasks: Subtask[];
  colorTag: string | null;
}

/**
 * Parses a raw task description string into note text and subtasks checklist.
 * Matches standard markdown checklist format:
 * - [ ] unchecked subtask
 * - [x] checked subtask
 * Also preserves optional [color:xxx] note color tag.
 */
export function parseTaskDescription(rawDesc: string | null | undefined): ParsedDescription {
  if (!rawDesc) {
    return { note: '', subtasks: [], colorTag: null };
  }

  // Extract explicit color tag if present: e.g. [color:pink]
  const colorMatch = rawDesc.match(/\[color:([a-z]+)\]/i);
  const colorTag = colorMatch ? colorMatch[1].toLowerCase() : null;
  const withoutColor = rawDesc.replace(/\[color:[a-z]+\]/gi, '').trim();

  const lines = withoutColor.split('\n');
  const subtasks: Subtask[] = [];
  const noteLines: string[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const checkMatch = trimmed.match(/^-\s*\[([ xX])\]\s+(.+)$/);
    if (checkMatch) {
      subtasks.push({
        id: `sub-${idx}-${Date.now().toString(36)}`,
        completed: checkMatch[1].toLowerCase() === 'x',
        title: checkMatch[2].trim(),
      });
    } else {
      noteLines.push(line);
    }
  });

  return {
    note: noteLines.join('\n').trim(),
    subtasks,
    colorTag,
  };
}

/**
 * Combines note text, subtasks list, and color tag back into a persistent description string.
 */
export function stringifyTaskDescription(
  note: string,
  subtasks: Subtask[],
  colorTag?: string | null
): string {
  const parts: string[] = [];

  const cleanNote = note.trim();
  if (cleanNote) {
    parts.push(cleanNote);
  }

  const validSubtasks = subtasks.filter((st) => st.title.trim().length > 0);
  if (validSubtasks.length > 0) {
    const subtaskLines = validSubtasks
      .map((st) => `- [${st.completed ? 'x' : ' '}] ${st.title.trim()}`)
      .join('\n');
    parts.push(subtaskLines);
  }

  if (colorTag && colorTag !== 'auto') {
    parts.push(`[color:${colorTag}]`);
  }

  return parts.join('\n\n').trim();
}

/**
 * Helper to toggle a single subtask by index directly in a raw description string.
 */
export function toggleSubtaskInRawDescription(
  rawDesc: string | null | undefined,
  subtaskIndex: number
): string {
  const parsed = parseTaskDescription(rawDesc);
  if (parsed.subtasks[subtaskIndex]) {
    parsed.subtasks[subtaskIndex].completed = !parsed.subtasks[subtaskIndex].completed;
  }
  const isPinned = isTaskPinned(rawDesc);
  const isArchived = isTaskArchived(rawDesc);

  let newDesc = stringifyTaskDescription(parsed.note, parsed.subtasks, parsed.colorTag);
  if (isPinned) newDesc = `${newDesc}\n[pin:true]`.trim();
  if (isArchived) newDesc = `${newDesc}\n[archived:true]`.trim();
  return newDesc;
}

export function isTaskPinned(rawDesc: string | null | undefined): boolean {
  return Boolean(rawDesc && /\[pin:true\]/i.test(rawDesc));
}

export function toggleTaskPin(rawDesc: string | null | undefined): string {
  const text = rawDesc || '';
  if (isTaskPinned(text)) {
    return text.replace(/\[pin:true\]/gi, '').trim();
  } else {
    return `${text}\n[pin:true]`.trim();
  }
}

export function isTaskArchived(rawDesc: string | null | undefined): boolean {
  return Boolean(rawDesc && /\[archived:true\]/i.test(rawDesc));
}

export function setTaskArchived(rawDesc: string | null | undefined, archived: boolean): string {
  const text = (rawDesc || '').replace(/\[archived:true\]/gi, '').trim();
  if (archived) {
    return `${text}\n[archived:true]`.trim();
  }
  return text;
}
