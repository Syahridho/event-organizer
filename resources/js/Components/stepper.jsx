import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ steps, currentStep }) {
    return (
        <div className="w-full py-4 sm:py-6 lg:py-8">
            <div className="flex items-center justify-between max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 lg:px-8">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isUpcoming = stepNumber > currentStep;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Item */}
                            <div className="flex flex-col items-center relative flex-1 min-w-0">
                                {/* Circle */}
                                <div
                                    className={cn(
                                        "w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl transition-all duration-300 border-2 lg:border-3 xl:border-4 z-10 shrink-0",
                                        {
                                            "bg-primary text-primary-foreground border-primary shadow-lg":
                                                isCompleted,
                                            "bg-primary/10 text-primary border-primary ring-2 sm:ring-4 lg:ring-6 ring-primary/20 shadow-xl":
                                                isCurrent,
                                            "bg-muted text-muted-foreground border-muted-foreground/20":
                                                isUpcoming,
                                        }
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10" />
                                    ) : (
                                        stepNumber
                                    )}
                                </div>

                                {/* Label - Hidden on mobile, shown on sm+ */}
                                <div className="mt-2 lg:mt-3 xl:mt-4 text-center hidden sm:block px-1 lg:px-2">
                                    <p
                                        className={cn(
                                            "text-[10px] sm:text-xs lg:text-base xl:text-lg 2xl:text-xl font-medium lg:font-semibold transition-colors break-words",
                                            {
                                                "text-primary": isCompleted || isCurrent,
                                                "text-muted-foreground": isUpcoming,
                                            }
                                        )}
                                    >
                                        {step.label}
                                    </p>
                                    {step.description && (
                                        <p className="text-[9px] sm:text-xs lg:text-sm xl:text-base text-muted-foreground mt-0.5 sm:mt-1 lg:mt-2 break-words hidden lg:block">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-0.5 lg:h-1 xl:h-1.5 mx-1 sm:mx-2 lg:mx-4 xl:mx-6 transition-all duration-300 -mt-10 sm:-mt-12 lg:-mt-16 xl:-mt-20 2xl:-mt-24 rounded-full",
                                        {
                                            "bg-primary shadow-md": stepNumber < currentStep,
                                            "bg-muted": stepNumber >= currentStep,
                                        }
                                    )}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Mobile Labels - Only show current step on mobile */}
            <div className="mt-4 text-center sm:hidden px-4">
                <p className="text-sm font-semibold text-primary">
                    Step {currentStep}: {steps[currentStep - 1]?.label}
                </p>
                {steps[currentStep - 1]?.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {steps[currentStep - 1]?.description}
                    </p>
                )}
            </div>
        </div>
    );
}
