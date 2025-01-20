export const getLendingProtocolFromTags = (tags: string[]) => {
  const normalizedTags = new Set(tags.map((tag) => tag.toUpperCase()));
  
  if (normalizedTags.has("BOOSTED_AAVE")) return "Aave";
  if (normalizedTags.has("BOOSTED_MORPHO")) return "Morpho";
  return null;
}; 