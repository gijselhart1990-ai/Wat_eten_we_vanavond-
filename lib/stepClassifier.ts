export type StepKind = "oven" | "koken" | "bakken" | "snijden" | "kruiden" | "mengen" | "wikkelen" | "serveren";

const keywords: Record<StepKind, string[]> = {
  oven: ["oven", "airfryer", "verwarm de oven", "bakplaat", "200°"],
  koken: ["kook", "giet af", "laat", "rust", "indik", "karamel", "slink", "koel", "boil", "simmer"],
  bakken: ["bak", "grill", "braad", "verhit een", "rooster", "fry", "sear"],
  snijden: ["snijd", "hak", "snipper", "dep", "prak", "julienne", "schil", "was", "chop", "slice"],
  kruiden: ["kruid", "marinade", "wrijf", "breng op smaak", "season"],
  mengen: ["meng", "roer", "toss", "voeg", "klop", "stoom", "druk", "mix"],
  wikkelen: ["vouw", "wrap", "rol"],
  serveren: ["beleg", "verdeel", "vul", "garneer", "top", "schep", "besmeer", "dek", "serveer", "geniet", "lepel"],
};

export function classifyStep(step: string): StepKind {
  const value = step.toLowerCase();
  for (const [kind, terms] of Object.entries(keywords) as [StepKind, string[]][]) {
    if (terms.some((term) => value.includes(term))) return kind;
  }
  return "serveren";
}
