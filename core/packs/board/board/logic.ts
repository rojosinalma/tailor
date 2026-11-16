/** The card logic of the board, shared by the app and the board. Plain TypeScript, no DOM. */

export interface BoardMove {
  readonly cardId: string;
  readonly toColumnId: string;
  /** The index of the card among the cards of its new column, after the move. */
  readonly index: number;
}

/** The cards of one column, in order. */
export function columnCards<C extends { readonly columnId: string }>(
  cards: readonly C[],
  columnId: string,
): C[] {
  return cards.filter((card) => card.columnId === columnId);
}

/**
 * Applies a move to a flat list of cards: the card gets its new column and its place among the cards of that
 * column. The order of the other cards does not change. An unknown card gives the same list back.
 */
export function applyBoardMove<C extends { readonly id: string; readonly columnId: string }>(
  cards: readonly C[],
  { cardId, toColumnId, index }: BoardMove,
): C[] {
  const card = cards.find((c) => c.id === cardId);
  if (!card) return [...cards];
  const rest = cards.filter((c) => c.id !== cardId);
  const moved = { ...card, columnId: toColumnId };
  const column = columnCards(rest, toColumnId);
  const before = column[Math.max(0, index)];
  if (before) {
    const at = rest.indexOf(before);
    return [...rest.slice(0, at), moved, ...rest.slice(at)];
  }
  const last = column.at(-1);
  const at = last ? rest.indexOf(last) + 1 : rest.length;
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}
