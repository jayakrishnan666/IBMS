"use client";
import { useState, useEffect } from "react";

export default function InventoryPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    quantity: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(false);

  // Fetch inventory items from backend
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setFetching(true);
    try {
      const res = await fetch("http://localhost:8000/api/inventory/list/");
      const data = await res.json();
      if (res.ok) setItems(data);
    } catch (err) {
      // handle error
    }
    setFetching(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:8000/api/inventory/add/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity, 10),
          price: parseFloat(form.price),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Inventory item added successfully!");
        setForm({ name: "", description: "", quantity: "", price: "" });
        fetchItems();
      } else {
        setMessage(data.error || "Failed to add item.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    }
    setLoading(false);
  };

  // Calculate summary
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Item Form */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-300">Add Inventory Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Quantity</label>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required min="0" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white" />
                </div>
                <div className="flex-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Price</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 mt-2">{loading ? "Adding..." : "Add Item"}</button>
            </form>
            {message && <div className="mt-4 text-center text-sm text-green-700 dark:text-green-400 font-semibold">{message}</div>}
          </div>
        </div>
        {/* Inventory Table */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-300">Inventory List</h2>
          {fetching ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-500">No items found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Description</th>
                  <th className="px-3 py-2 text-right font-semibold">Quantity</th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-zinc-800">
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{parseFloat(item.price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Summary Section */}
      <div className="max-w-6xl mx-auto mt-8 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Items: <span className="text-blue-700 dark:text-blue-300">{totalItems}</span></div>
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Quantity: <span className="text-blue-700 dark:text-blue-300">{totalQuantity}</span></div>
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Value: <span className="text-blue-700 dark:text-blue-300">₹{totalValue.toFixed(2)}</span></div>
      </div>
    </div>
  );
} 