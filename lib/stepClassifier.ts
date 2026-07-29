export type StepKind = "oven" | "koken" | "bakken" | "snijden" | "kruiden" | "mengen" | "wikkelen" | "serveren";

const keywords: Record<StepKind, string[]> = {
  oven: ["oven", "bakplaat", "rooster", "grill"],
  koken: ["kook", "koken", "gaar", "water", "indikken", "sudderen", "boil", "simmer"],
  bakken: ["bak", "pan", "braad", "heet", "krokant", "fry", "sear"],
  snijden: ["snijd", "snij", "plakjes", "hak", "chop", "slice"],
  kruiden: ["kruid", "peper", "zout", "season"],
  mengen: ["meng", "roer", "mix", "door de saus"],
  wikkelen: ["vouw", "wrap", "rol", "dicht"],
  serveren: ["serveer", "top", "beleg", "vul", "leg", "verdeel"],
};

export function classifyStep(step: string): StepKind {
  const value = step.toLowerCase();
  for (const [kind, terms] of Object.entries(keywords) as [StepKind, string[]][]) {
    if (terms.some((term) => value.includes(term))) return kind;
  }
  return "serveren";
}
