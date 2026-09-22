import { useCallback, useState } from "react";

interface UseMultistepFormProps<T> {
  /** The ordered steps to navigate through. Can be anything: components, config objects, ids. */
  steps: T[];
}

interface UseMultistepFormReturn<T> {
  /** The step at the current index. */
  currentStep: T;
  /** Zero-based index of the active step. */
  currentStepIndex: number;
  /** Advances one step; clamped at the last step. */
  nextStep: () => void;
  /** Goes back one step; clamped at the first step. */
  prevStep: () => void;
  /** `true` when on the first step — useful for disabling a Back button. */
  isFirstStep: boolean;
  /** `true` when on the last step — useful for swapping Next to Submit. */
  isLastStep: boolean;
  /** Jumps directly to an index; out-of-range values are clamped. */
  goToStep: (index: number) => void;
}

/**
 * Manages step navigation for a multistep form or wizard: which step is
 * active, moving between steps, and the derived first/last flags.
 *
 * @remarks
 * The hook owns *navigation* state only — it holds no form data and renders
 * nothing, leaving you free to manage field values however you like
 * (`useState`, React Hook Form, etc.) and to render `currentStep` however
 * it suits your setup. Every navigation method clamps to valid bounds, so
 * calling `nextStep` on the last step or `goToStep(-5)` is a safe no-op
 * rather than an error.
 *
 * @typeParam T - The type of each step. Commonly `ReactNode`, but any value works.
 * @param props.steps - The ordered steps to navigate through
 *
 * @example
 * ```tsx
 * const { currentStep, nextStep, prevStep, isFirstStep, isLastStep } =
 *   useMultistepForm({ steps: [<AccountStep />, <AddressStep />, <ReviewStep />] });
 *
 * return (
 *   <form>
 *     {currentStep}
 *     <button type="button" onClick={prevStep} disabled={isFirstStep}>Back</button>
 *     {isLastStep
 *       ? <button type="submit">Submit</button>
 *       : <button type="button" onClick={nextStep}>Next</button>}
 *   </form>
 * );
 * ```
 */

export default function useMultistepForm<T>({
  steps,
}: UseMultistepFormProps<T>): UseMultistepFormReturn<T> {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0) return setCurrentStepIndex(0);
      else if (index >= steps.length)
        return setCurrentStepIndex(steps.length - 1);

      setCurrentStepIndex(index);
    },
    [steps.length],
  );

  return {
    currentStep: steps[currentStepIndex],
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
    currentStepIndex,
    nextStep,
    prevStep,
    goToStep,
  };
}
