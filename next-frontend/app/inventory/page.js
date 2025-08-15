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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] p-0">
      {/* Dashboard Header */}
      <div className="w-full px-8 py-8 bg-white dark:bg-zinc-900 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="w-7 h-7 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7V6a2 2 0 012-2h2a2 2 0 012 2v1m0 0v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7m6 0h6m0 0V6a2 2 0 012-2h2a2 2 0 012 2v1m0 0v1a2 2 0 01-2 2h-2a2 2 0 01-2-2V7m0 0H9" /></svg>
            </span>
            <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300">Inventory Dashboard</h1>
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-base ml-1">Overview of your inventory, stock alerts, and quick actions.</div>
        </div>
        <Link href="/inventory/add">
          <button className="bg-blue-700 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-800 transition-colors text-lg shadow">+ Add Inventory Item</button>
        </Link>
      </div>

      {/* Dashboard Stats */}
      <div className="w-full px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 bg-gradient-to-r from-blue-50/60 to-blue-100/40 dark:from-zinc-900 dark:to-zinc-800 border-b border-gray-200 dark:border-zinc-800">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 p-8 flex flex-col items-center">
          <div className="text-gray-500 text-xs mb-1">Total Items</div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalItems}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 p-8 flex flex-col items-center">
          <div className="text-gray-500 text-xs mb-1">Total Quantity</div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalQuantity}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 p-8 flex flex-col items-center">
          <div className="text-gray-500 text-xs mb-1">Total Value</div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">₹{totalValue.toFixed(2)}</div>
        </div>
      </div>

      {/* Main Content: Low Stock + Table */}
      <div className="w-full flex flex-col lg:flex-row gap-8 px-8 py-8">
        {/* Low Stock Sidebar - only show if there are low stock items */}
        {lowStockItems.length > 0 && (
          <div className="lg:w-1/4 w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow border-2 border-red-200 dark:border-red-800 flex flex-col items-center mb-8 lg:mb-0">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500 dark:text-red-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Low Stock Alert
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 text-center">The following items are running low. Please restock soon!</div>
            <ul className="space-y-2 w-full">
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
        <div className={lowStockItems.length > 0 ? "lg:w-3/4 w-full" : "w-full"}>
          {/* Search Bar */}
          <div className="mb-6 flex flex-col md:flex-row md:justify-end gap-2">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-1/3 px-4 py-3 border rounded-xl focus:outline-none focus:ring focus:border-blue-300 dark:bg-zinc-800 dark:text-white shadow-sm"
            />
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 overflow-x-auto">
            {fetching ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center text-gray-500">No items found.</div>
            ) : (
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-gray-100 dark:bg-zinc-800">
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-right font-semibold cursor-pointer select-none" onClick={handleSortQuantity}>
                      Quantity
                      {sortOrder === 'asc' && <span> ▲</span>}
                      {sortOrder === 'desc' && <span> ▼</span>}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">Price</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-blue-50/40 dark:hover:bg-zinc-800/60 transition-colors">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{parseFloat(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/inventory/edit/${item.id}`}>
                          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold text-sm mr-2">Edit</button>
                        </Link>
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold text-sm"
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
        </div>
      </div>
    </div>
  );
} 