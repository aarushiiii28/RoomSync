import { ReactNode } from "react";

export interface Feature {
  id: number;
  title: string;
  description: string;
  illustration: ReactNode;
}