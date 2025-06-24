"use client";
import { useEffect, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [editMsg, setEditMsg] = useState("");
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const [billDetailsLoading, setBillDetailsLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:8000/api/inventory/customers/");
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setEditForm({ name: customer.name, email: customer.email, phone: customer.phone });
    setEditMsg("");
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSave = async (id) => {
    setEditMsg("");
    const res = await fetch(`http://localhost:8000/api/inventory/customers/edit/${id}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) {
      setEditMsg("Saved!");
      setEditingId(null);
      fetchCustomers();
    } else {
      setEditMsg(data.error || "Edit failed.");
    }
  };

  const handleViewHistory = async (customer) => {
    setHistoryCustomer(customer);
    setHistoryLoading(true);
    setHistory([]);
    const res = await fetch(`http://localhost:8000/api/inventory/customer/${customer.id}/history/`);
    const data = await res.json();
    setHistory(data);
    setHistoryLoading(false);
  };

  const handleViewBillDetails = async (billId) => {
    setBillDetailsLoading(true);
    setBillDetails(null);
    const res = await fetch(`http://localhost:8000/api/inventory/bill/${billId}/details/`);
    const data = await res.json();
    setBillDetails(data);
    setBillDetailsLoading(false);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-300">Customers</h1>
        <input
          type="text"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-4 px-3 py-2 border rounded w-full dark:bg-zinc-800 dark:text-white"
        />
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Email</th>
                  <th className="px-3 py-2 text-left font-semibold">Phone</th>
                  <th className="px-3 py-2 text-left font-semibold">Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-zinc-800">
                    <td className="px-3 py-2">
                      {editingId === c.id ? (
                        <input name="name" value={editForm.name} onChange={handleEditChange} className="px-2 py-1 border rounded dark:bg-zinc-800 dark:text-white" />
                      ) : c.name}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === c.id ? (
                        <input name="email" value={editForm.email} onChange={handleEditChange} className="px-2 py-1 border rounded dark:bg-zinc-800 dark:text-white" />
                      ) : c.email}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === c.id ? (
                        <input name="phone" value={editForm.phone} onChange={handleEditChange} className="px-2 py-1 border rounded dark:bg-zinc-800 dark:text-white" />
                      ) : c.phone}
                    </td>
                    <td className="px-3 py-2">{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2">
                      {editingId === c.id ? (
                        <>
                          <button className="bg-green-600 text-white px-2 py-1 rounded mr-2" onClick={() => handleEditSave(c.id)}>Save</button>
                          <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditingId(null)}>Cancel</button>
                          {editMsg && <span className="ml-2 text-green-700 dark:text-green-400 text-xs">{editMsg}</span>}
                        </>
                      ) : (
                        <>
                          <button className="bg-blue-600 text-white px-2 py-1 rounded mr-2" onClick={() => handleEdit(c)}>Edit</button>
                          <button className="bg-purple-600 text-white px-2 py-1 rounded" onClick={() => handleViewHistory(c)}>History</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Customer History Modal */}
        {historyCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg max-w-lg w-full relative">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white" onClick={() => { setHistoryCustomer(null); setBillDetails(null); }}>&times;</button>
              <h2 className="text-xl font-bold mb-4">History for {historyCustomer.name}</h2>
              {historyLoading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-500">No bills found.</div>
              ) : (
                <table className="min-w-full text-sm mb-4">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-zinc-800">
                      <th className="px-3 py-2 text-left font-semibold">Bill ID</th>
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(bill => (
                      <tr key={bill.id} className="border-b border-gray-100 dark:border-zinc-800">
                        <td className="px-3 py-2">{bill.id}</td>
                        <td className="px-3 py-2">{bill.date ? new Date(bill.date).toLocaleString() : '-'}</td>
                        <td className="px-3 py-2 text-right">₹{bill.total}</td>
                        <td className="px-3 py-2 text-right">
                          <button className="text-blue-600 hover:underline" onClick={() => handleViewBillDetails(bill.id)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Bill Details Modal */}
              {billDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg max-w-md w-full relative">
                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white" onClick={() => setBillDetails(null)}>&times;</button>
                    <h3 className="text-lg font-bold mb-2">Bill #{billDetails.id}</h3>
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">Date: {billDetails.date ? new Date(billDetails.date).toLocaleString() : '-'}</div>
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">Customer: {billDetails.customer.name} ({billDetails.customer.email}, {billDetails.customer.phone})</div>
                    <table className="min-w-full text-sm mb-2">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-zinc-800">
                          <th className="px-3 py-2 text-left font-semibold">Item</th>
                          <th className="px-3 py-2 text-right font-semibold">Qty</th>
                          <th className="px-3 py-2 text-right font-semibold">Price</th>
                          <th className="px-3 py-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billDetails.items.map(item => (
                          <tr key={item.id} className="border-b border-gray-100 dark:border-zinc-800">
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">₹{parseFloat(item.total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-right font-bold text-blue-700 dark:text-blue-300">Total: ₹{billDetails.total}</div>
                  </div>
                </div>
              )}
              {billDetailsLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg max-w-md w-full relative text-center">
                    <div className="text-gray-500">Loading bill details...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 