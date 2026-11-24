// Test-only stand-in for Gesture Handler's native UI-runtime hook-up.
// Jest has no UI runtime (Reanimated runs its web build in tests), so this does nothing.
export function installUIRuntimeBindings(): void {}
