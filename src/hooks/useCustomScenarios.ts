/**
 * useCustomScenarios — CRUD hook for user-created training scenarios.
 *
 * Stored in plain localStorage (no encryption — scenario configs are not PII).
 * Key: 'antiscam-custom-scenarios'
 * Max: 20 scenarios
 */

import { useState, useCallback } from 'react';
import type { CustomScenario } from '@/types/training';

const STORAGE_KEY = 'antiscam-custom-scenarios';
const MAX_SCENARIOS = 20;

function loadScenarios(): CustomScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveScenarios(scenarios: CustomScenario[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // Storage full or unavailable
  }
}

export interface UseCustomScenariosResult {
  scenarios: readonly CustomScenario[];
  addScenario: (scenario: Omit<CustomScenario, 'id' | 'createdAt'>) => CustomScenario;
  removeScenario: (id: string) => void;
  updateScenario: (id: string, updates: Partial<Omit<CustomScenario, 'id' | 'createdAt'>>) => void;
}

export function useCustomScenarios(): UseCustomScenariosResult {
  const [scenarios, setScenarios] = useState<CustomScenario[]>(loadScenarios);

  const addScenario = useCallback(
    (input: Omit<CustomScenario, 'id' | 'createdAt'>): CustomScenario => {
      const newScenario: CustomScenario = {
        ...input,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      setScenarios((prev) => {
        const updated = [newScenario, ...prev].slice(0, MAX_SCENARIOS);
        saveScenarios(updated);
        return updated;
      });
      return newScenario;
    },
    [],
  );

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveScenarios(updated);
      return updated;
    });
  }, []);

  const updateScenario = useCallback(
    (id: string, updates: Partial<Omit<CustomScenario, 'id' | 'createdAt'>>) => {
      setScenarios((prev) => {
        const updated = prev.map((s) =>
          s.id === id ? { ...s, ...updates } : s,
        );
        saveScenarios(updated);
        return updated;
      });
    },
    [],
  );

  return { scenarios, addScenario, removeScenario, updateScenario };
}
