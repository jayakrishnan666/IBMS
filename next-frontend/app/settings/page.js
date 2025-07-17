"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [selectedSection, setSelectedSection] = useState("notification");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);

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
        setEditing(false);
      } else {
        setMessage("Failed to update settings.");
      }
    } catch {
      setMessage("Error connecting to server.");
    }
    setSaving(false);
  };

  // Settings sections for future extensibility
  const sections = [
    { key: "notification", label: "Notification Settings" },
    // Add more sections here in the future
  ];

  return (
    <div className="flex max-w-4xl mx-auto mt-10 bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 min-h-[400px]">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-200 dark:border-zinc-800 p-6 bg-gray-50 dark:bg-zinc-950 rounded-l-2xl">
        <ul className="space-y-4">
          {sections.map(section => (
            <li key={section.key}>
              <button
                className={`w-full text-left px-2 py-2 rounded-lg font-semibold transition-colors ${selectedSection === section.key ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}`}
                onClick={() => { setSelectedSection(section.key); setMessage(""); setEditing(false); }}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* Main content */}
      <div className="flex-1 p-8">
        {selectedSection === "notification" && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-300">Notification Settings</h2>
            {loading ? (
              <div>Loading...</div>
            ) : editing ? (
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
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-700 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors text-lg"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 dark:bg-zinc-700 text-gray-800 dark:text-white py-2 px-6 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-zinc-600 transition-colors text-lg"
                    onClick={() => { setEditing(false); setMessage(""); }}
                  >
                    Cancel
                  </button>
                </div>
                {message && <div className="mt-2 text-center text-blue-700 dark:text-blue-300">{message}</div>}
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Manager Phone Number:</span> {phone || <span className="text-gray-400">Not set</span>}
                </div>
                <div>
                  <span className="font-semibold">Manager Email:</span> {email || <span className="text-gray-400">Not set</span>}
                </div>
                <button
                  className="mt-4 bg-blue-700 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors text-lg"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                {message && <div className="mt-2 text-center text-blue-700 dark:text-blue-300">{message}</div>}
              </div>
            )}
          </div>
        )}
        {/* Add more settings sections here in the future */}
      </div>
    </div>
  );
} 