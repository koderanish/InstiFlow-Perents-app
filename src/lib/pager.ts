/** Scroll-offset math for a horizontal paged list. The worklet markers let the UI thread call these too. */

/** Index of the page nearest to the scroll offset, clamped to the real pages. */
export const pageIndex = (offset: number, width: number, count: number): number => {
  'worklet';
  if (width <= 0 || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(offset / width)));
};

/** How close `index` is to being the current page: 1 when centred, 0 when a page or more away. */
export const dotProgress = (offset: number, width: number, index: number): number => {
  'worklet';
  if (width <= 0) return index === 0 ? 1 : 0;
  const distance = Math.abs(offset / width - index);
  return Math.max(0, 1 - distance);
};
