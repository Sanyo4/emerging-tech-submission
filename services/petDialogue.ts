// Brief 02 — Dialogue template resolution service
import { resolveTemplate, type SlotValues } from '../data/dialogueTemplates';
import { getAccessibilityPrefs } from './database';

/**
 * Resolve a dialogue template to final text.
 * Automatically checks simplified_language preference.
 */
export async function resolveDialogue(
  templateKey: string,
  slots: SlotValues = {},
): Promise<string> {
  let simplified = false;
  try {
    const prefs = await getAccessibilityPrefs();
    simplified = prefs?.simplified_language === 1;
  } catch {
    // Default to standard language
  }

  return resolveTemplate(templateKey, slots, simplified);
}
