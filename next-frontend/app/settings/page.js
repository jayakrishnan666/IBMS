"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/inventory/notification-setting/")
      .then(res => res.json())
      .then(data => {
        setPhone(data.phone_number || "");
        setEmail(data.email || "");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:8000/api/inventory/notification-setting/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, email }),
      });
      if (res.ok) {
        setMessage("Settings updated successfully.");
      } else {
        setMessage("Failed to update settings.");
      }
    } catch {
      setMessage("Error connecting to server.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow border border-gray-200 dark:border-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-300">Notification Settings</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-1">Manager Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Manager Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white"
              placeholder="Enter email address"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-700 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors text-lg"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {message && <div className="mt-2 text-center text-blue-700 dark:text-blue-300">{message}</div>}
        </form>
      )}
    </div>
  );
} 