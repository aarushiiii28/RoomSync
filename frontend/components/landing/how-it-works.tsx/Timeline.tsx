"use client";

import ProgressLine from "./ProgressLine";
import Step from "./Step";
import { steps } from "./data";

export default function Timeline() {
  return (
    <div className="relative">

      <ProgressLine />

      <div
        className="
          relative
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-24
          pt-20
        "
      >
        {steps.map((step, index) => (
          <Step
            key={step.id}
            step={step}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}