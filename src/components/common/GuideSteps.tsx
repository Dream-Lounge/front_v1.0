import { GUIDE_STEPS } from "@/data/guideSteps";

/** STEP 1 ~ STEP N을 세로 타임라인으로 보여 줍니다. */
export function GuideSteps() {
  return (
    <ol className="flex flex-col">
      {GUIDE_STEPS.map((step, index) => (
        <li
          key={step.title}
          className="relative flex flex-col gap-1.5 border-l-2 border-border pb-7 pl-6 last:border-l-transparent last:pb-0"
        >
          <span
            className="absolute -left-[6px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-background"
            aria-hidden
          />
          <span className="text-sm font-bold text-primary">
            STEP {index + 1}
          </span>
          <h3 className="break-keep font-bold text-foreground">
            {step.title}
          </h3>
          <p className="break-keep text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
