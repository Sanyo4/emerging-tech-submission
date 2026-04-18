// Mock data used only by the /demo showcase route.
//
// IMPORTANT: category_id values MUST be present in NEEDS_CATEGORIES or
// WANTS_CATEGORIES (see data/needsVsWantsRules.ts). Otherwise
// NeedsVsWantsGame filters them out and its useEffect auto-dismisses
// the modal when items.length === 0, closing the demo before judges
// can play.

export interface DemoTransaction {
  id: number;
  description: string;
  amount: number;
  category_id: string;
}

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  { id: 1, description: 'Weekly grocery shop', amount: 42.5, category_id: 'groceries' },
  { id: 2, description: 'Morning latte', amount: 4.25, category_id: 'dining' },
  { id: 3, description: 'Bus fare to work', amount: 5.8, category_id: 'transport' },
  { id: 4, description: 'New headphones', amount: 89.99, category_id: 'shopping' },
  { id: 5, description: 'Lunch takeaway', amount: 12.0, category_id: 'dining' },
];
