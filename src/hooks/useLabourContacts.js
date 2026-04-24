import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext.jsx";

export function useLabourContacts() {
  const adapter = useDatabase();
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    adapter.getContacts().then((data) => {
      if (!cancelled) setContacts(data ?? []);
    });
    return () => { cancelled = true; };
  }, [adapter]);

  const addContact = async () => {
    if (!newNickname.trim() || !newPhone.trim()) return;
    const contact = {
      id: `lc${Date.now()}`,
      nickname: newNickname.trim(),
      phone: newPhone.trim(),
    };
    const updated = [...contacts, contact];
    setContacts(updated);
    setNewNickname("");
    setNewPhone("");
    setShowAddForm(false);
    try {
      await adapter.saveContacts(updated);
    } catch {
      // ignore — optimistic update stands
    }
  };

  const removeContact = async (id) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    try {
      await adapter.saveContacts(updated);
    } catch {
      // ignore
    }
  };

  return {
    contacts,
    showAddForm,
    setShowAddForm,
    newNickname,
    setNewNickname,
    newPhone,
    setNewPhone,
    addContact,
    removeContact,
  };
}
