import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext.jsx";
import { DEFAULT_METHODS } from "../constants/index.js";

/**
 * Manages the pain relief methods list: CRUD operations and persistence.
 * Uses the active DatabaseAdapter from context so methods sync to cloud
 * when the adapter is swapped to SupabaseAdapter.
 */
export function useRelief() {
  const adapter = useDatabase();
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMedia, setNewMedia] = useState("");
  const [newPhases, setNewPhases] = useState(["early", "active", "transition"]);
  const [activeMethod, setActiveMethod] = useState(null);

  // Load persisted methods on mount.
  // Re-runs when adapter changes (e.g. partner joins and adapter swaps to Supabase).
  useEffect(() => {
    let cancelled = false;
    adapter.getSettings().then((settings) => {
      if (!cancelled && settings?.reliefMethods) {
        setMethods(settings.reliefMethods);
      }
    });
    return () => { cancelled = true; };
  }, [adapter]);

  const addMethod = async () => {
    if (!newName.trim()) return;
    const m = {
      id: `u${Date.now()}`,
      name: newName.trim(),
      mediaUrl: newMedia.trim(),
      phases: newPhases.length ? newPhases : ["early", "active", "transition"],
    };
    const updated = [...methods, m];
    setMethods(updated);
    setNewName("");
    setNewMedia("");
    setNewPhases(["early", "active", "transition"]);
    setShowAddForm(false);
    try {
      await adapter.saveSettings({ reliefMethods: updated });
    } catch {
      // ignore
    }
  };

  const removeMethod = async (id) => {
    const updated = methods.filter((m) => m.id !== id);
    setMethods(updated);
    if (activeMethod?.id === id) setActiveMethod(null);
    try {
      await adapter.saveSettings({ reliefMethods: updated });
    } catch {
      // ignore
    }
  };

  const saveMethodMedia = async (id, mediaUrl) => {
    const updated = methods.map((m) => (m.id === id ? { ...m, mediaUrl } : m));
    setMethods(updated);
    setActiveMethod((prev) => (prev?.id === id ? { ...prev, mediaUrl } : prev));
    try {
      await adapter.saveSettings({ reliefMethods: updated });
    } catch {
      // ignore
    }
  };

  return {
    methods,
    showAddForm,
    setShowAddForm,
    newName,
    setNewName,
    newMedia,
    setNewMedia,
    newPhases,
    setNewPhases,
    activeMethod,
    setActiveMethod,
    addMethod,
    removeMethod,
    saveMethodMedia,
  };
}
