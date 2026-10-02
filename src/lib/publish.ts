import { distinctCount } from "./look";
import type { CanvasItem } from "./types";

/**
 * One rule set for publishing, used by every entry point (builder, «Meine Looks»).
 * A published look has a title and at least two different pieces; publishing then asks for a name.
 */
export type PublishProblem = "title" | "items";

export const PUBLISH_MESSAGES: Record<PublishProblem, string> = {
  title: "Gib dem Look einen Titel, bevor du ihn veröffentlichst.",
  items: "Ein veröffentlichter Look braucht mindestens zwei verschiedene Teile.",
};

export const PUBLISH_LOGIN_REASON = "Melde dich an, um deinen Look zu veröffentlichen.";

export function publishProblems(look: { title: string; items: CanvasItem[] }): PublishProblem[] {
  const problems: PublishProblem[] = [];
  if (!look.title.trim() || look.title.trim() === "Unbenannter Look") problems.push("title");
  if (distinctCount(look.items) < 2) problems.push("items");
  return problems;
}
