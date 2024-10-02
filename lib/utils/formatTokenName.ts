export const formatTokenName = (token: string) => {
  return token
    .split("_")
    .map((word, index, array) =>
      index === array.length - 1
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.toUpperCase(),
    )
    .join(" ");
};
