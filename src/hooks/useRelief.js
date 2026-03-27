import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";
import { DEFAULT_METHODS } from "../constants/index.js";

const STORAGE_KEY = "lc_m4";

/**
 * Manages the pain relief methods list: CRUD operations and persistence.
 */
export function useRelief() {
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMedia, setNewMedia] = useState("");
  const [newPhases, setNewPhases] = useState(["early", "active", "transition"]);
  const [activeMethod, setActiveMethod] = useState(null);

  // Load persisted methods on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get(STORAGE_KEY);
        if (r) setMethods(JSON.parse(r.value));
      } catch {
        // Storage unavailable — use defaults
      }
    })();
  }, []);

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
      await storage.set(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeMethod = async (id) => {
    const updated = methods.filter((m) => m.id !== id);
    setMethods(updated);
    if (activeMethod?.id === id) setActiveMethod(null);
    try {
      await storage.set(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const saveMethodMedia = async (id, mediaUrl) => {
    const updated = methods.map((m) => (m.id === id ? { ...m, mediaUrl } : m));
    setMethods(updated);
    setActiveMethod((prev) => (prev?.id === id ? { ...prev, mediaUrl } : prev));
    try {
      await storage.set(STORAGE_KEY, JSON.stringify(updated));
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
