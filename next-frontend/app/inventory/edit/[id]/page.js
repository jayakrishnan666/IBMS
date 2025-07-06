"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditInventoryItemPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [form, setForm] = useState({
    name: "",
    description: "",
    quantity: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      setFetching(true);
      try {
        const res = await fetch(`http://localhost:8000/api/inventory/${id}/`);
        const data = await res.json();
        if (res.ok) {
          setForm({
            name: data.name || "",
            description: data.description || "",
            quantity: data.quantity?.toString() || "",
            price: data.price?.toString() || "",
          });
        } else {
          setMessage("Item not found.");
        }
      } catch (err) {
        setMessage("Error fetching item.");
      }
      setFetching(false);
    }
    if (id) fetchItem();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`http://localhost:8000/api/inventory/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity, 10),
          price: parseFloat(form.price),
        }),
      });
      if (res.ok) {
        setMessage("Item updated successfully!");
        setTimeout(() => {
          router.push("/inventory");
        }, 1000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to update item.");
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    }
    setLoading(false);
  };

  if (fetching) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-300">Edit Inventory Item</h2>
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
          <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 mt-2">{loading ? "Saving..." : "Save Changes"}</button>
        </form>
        {message && <div className="mt-4 text-center text-sm text-green-700 dark:text-green-400 font-semibold">{message}</div>}
      </div>
    </div>
  );
} 