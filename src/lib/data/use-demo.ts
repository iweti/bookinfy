"use client";

import { useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "./mock-repository";

export function useDemo() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
