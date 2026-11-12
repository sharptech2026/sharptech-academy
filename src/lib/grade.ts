export function normalize(raw: string, semi: "strip" | "keep" = "strip") {
  let text = raw.replace(/\r/g, "").trim();
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\s*([=(),;{}:+*/<>&|!])\s*/g, "$1");
  text = text.replace(/[ \t]*\n[ \t]*/g, "\n").trim();
  if (semi === "strip") text = text.replace(/;+$/g, "");
  return text;
}

export function typeMatches(
  raw: string,
  answer: string,
  accept: string[] | undefined,
  semi: "strip" | "keep" = "strip",
) {
  const got = normalize(raw, semi);
  if (!got) return false;
  return [answer, ...(accept ?? [])].some((item) => normalize(item, semi) === got);
}
