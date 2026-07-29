import type { SVGProps } from "react";
import { classifyStep, type StepKind } from "../lib/stepClassifier";

function PrototypeStepIcon({ name }: { name: string }) {
  const p: SVGProps<SVGGElement> = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    pot: <g {...p}><path d="M4 9h16l-1.2 9.5a2 2 0 0 1-2 1.5H7.2a2 2 0 0 1-2-1.5L4 9Z" /><path d="M2.5 9h19M8 5.5c0-1 1-1 1-2M12 5.5c0-1 1-1 1-2M16 5.5c0-1 1-1 1-2" /></g>,
    pan: <g {...p}><circle cx="10" cy="14" r="6.2" /><path d="M16 14h6" /><path d="M8 14c0-1.4 1-2 2-2M10.5 14c0-1 .8-1.4 1.6-1.4" /></g>,
    oven: <g {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M7 6.5h3" /><rect x="8" y="12" width="8" height="5" rx="1" /></g>,
    knife: <g {...p}><path d="M4 20 18 6c1.5-1.5 3.5.5 2 2L6 22" /><path d="M4 20l2 2" /></g>,
    mix: <g {...p}><path d="M5 10h14l-1 8.5a2 2 0 0 1-2 1.5H8a2 2 0 0 1-2-1.5L5 10Z" /><path d="M15 3l-2.5 7" /></g>,
    season: <g {...p}><path d="M8 8h8l-1 12H9L8 8Z" /><path d="M9 8V5h6v3M11 4h2" /><circle cx="11" cy="5" r=".4" /><circle cx="13" cy="5.4" r=".4" /></g>,
    rest: <g {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></g>,
    plate: <g {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /></g>,
    dot: <g {...p}><circle cx="12" cy="12" r="3" /></g>,
  };
  return <svg viewBox="0 0 24 24" width="18" height="18">{paths[name as keyof typeof paths] || paths.dot}</svg>;
}



const names: Record<StepKind, string> = { oven: "oven", koken: "pot", bakken: "pan", snijden: "knife", kruiden: "season", mengen: "mix", wikkelen: "plate", serveren: "plate" };

export function StepIcon({ step, size = 24 }: { step: string; size?: number }) {
  return <span className="step-icon" style={{ width: size, height: size }}><PrototypeStepIcon name={names[classifyStep(step)]} /></span>;
}
