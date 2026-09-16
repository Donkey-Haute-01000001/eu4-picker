"use client";

import { Hero } from "@/components/Hero";
import { PickerWizard } from "@/components/PickerWizard";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="h-screen" aria-hidden />
      <PickerWizard />
    </>
  );
}
