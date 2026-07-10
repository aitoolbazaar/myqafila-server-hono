function generateSlug(name: string) {
  if (typeof name !== "string") return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export { generateSlug };
