import { act, renderHook } from "@testing-library/react";
import useMultistepForm from "../src/useMultistepForm";

const steps = ["account", "address", "review"];

describe("useMultistepForm", () => {
  it("starts on the first step", () => {
    const { result } = renderHook(() => useMultistepForm({ steps }));

    expect(result.current.currentStep).toBe("account");
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it("moves forward and backward with nextStep / prevStep", () => {
    const { result } = renderHook(() => useMultistepForm({ steps }));

    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe("address");
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);

    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe("review");
    expect(result.current.isLastStep).toBe(true);

    act(() => result.current.prevStep());
    expect(result.current.currentStep).toBe("address");
  });

  it("clamps nextStep at the last step", () => {
    const { result } = renderHook(() => useMultistepForm({ steps }));

    act(() => {
      result.current.nextStep();
      result.current.nextStep();
      result.current.nextStep();
      result.current.nextStep();
    });

    expect(result.current.currentStepIndex).toBe(2);
    expect(result.current.isLastStep).toBe(true);
  });

  it("clamps prevStep at the first step", () => {
    const { result } = renderHook(() => useMultistepForm({ steps }));

    act(() => result.current.prevStep());

    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
  });

  it.each([
    [1, 1],
    [2, 2],
    [-5, 0],
    [99, 2],
  ])("goToStep(%i) lands on index %i", (target, expected) => {
    const { result } = renderHook(() => useMultistepForm({ steps }));

    act(() => result.current.goToStep(target));

    expect(result.current.currentStepIndex).toBe(expected);
    expect(result.current.currentStep).toBe(steps[expected]);
  });

  it("treats a single step as both first and last", () => {
    const { result } = renderHook(() => useMultistepForm({ steps: ["only"] }));

    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(true);

    act(() => result.current.nextStep());
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("works with non-string steps", () => {
    const objectSteps = [{ id: "a" }, { id: "b" }];
    const { result } = renderHook(() => useMultistepForm({ steps: objectSteps }));

    act(() => result.current.nextStep());

    expect(result.current.currentStep).toBe(objectSteps[1]);
  });
});
