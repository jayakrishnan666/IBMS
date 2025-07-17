"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [sortOrder, setSortOrder] = useState(null); // null, 'asc', 'desc'

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`http://localhost:8000/api/inventory/${id}/`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchItems();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete item.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
    setDeleting(null);
  };

  // Filter and sort items by search and quantity
  const filteredItems = items
    .filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.quantity - b.quantity;
      if (sortOrder === 'desc') return b.quantity - a.quantity;
      return 0;
    });

  const handleSortQuantity = () => {
    setSortOrder((prev) => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  // Calculate summary
  const totalItems = filteredItems.length;
  const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  // Low stock items (quantity < 2)
  const lowStockItems = items.filter(item => item.quantity < 2);

  return (
    <div className="min-\h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-300">Inventory List</h2>
          <Link href="/inventory/add">
            <button className="bg-blue-700 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-800 transition-colors text-lg">Add Inventory Item</button>
          </Link>
        </div>
        {/* Main Flex Layout: Sidebar + Main Table */}
        <div className={`flex flex-col md:flex-row gap-8`}>
          {/* Low Stock Sidebar - only show if there are low stock items */}
          {lowStockItems.length > 0 && (
            <div className="md:w-1/4 w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 mb-4 md:mb-0">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Low Stock Alert</h3>
              <div className="text-sm text-gray-700 dark:text-gray-200 mb-2">The following items are running low. Please restock soon!</div>
              <ul className="space-y-2">
                {lowStockItems.map(item => (
                  <li key={item.id} className="flex justify-between items-center bg-red-50 dark:bg-zinc-800 rounded px-2 py-1">
                    <span className="font-semibold text-red-700 dark:text-red-300">{item.name}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Main Table Section - take full width if no sidebar */}
          <div className={lowStockItems.length > 0 ? "md:w-3/4 w-full" : "w-full"}>
            {/* Search Bar */}
            <div className="mb-4 flex justify-end">
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:w-1/3 px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 overflow-x-auto">
              {fetching ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center text-gray-500">No items found.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-zinc-800">
                      <th className="px-3 py-2 text-left font-semibold">Name</th>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                      <th className="px-3 py-2 text-right font-semibold cursor-pointer select-none" onClick={handleSortQuantity}>
                        Quantity
                        {sortOrder === 'asc' && <span> ▲</span>}
                        {sortOrder === 'desc' && <span> ▼</span>}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">Price</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                      <th className="px-3 py-2 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-zinc-800">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{parseFloat(item.price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          <Link href={`/inventory/edit/${item.id}`}>
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-semibold text-xs mr-2">Edit</button>
                          </Link>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-semibold text-xs"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                          >
                            {deleting === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Summary Section */}
            <div className="mt-8 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Items: <span className="text-blue-700 dark:text-blue-300">{totalItems}</span></div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Quantity: <span className="text-blue-700 dark:text-blue-300">{totalQuantity}</span></div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Value: <span className="text-blue-700 dark:text-blue-300">₹{totalValue.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 