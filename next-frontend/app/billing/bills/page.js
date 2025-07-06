"use client";
import { useEffect, useState } from "react";

export default function BillsListPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchBills = async () => {
    setLoading(true);
    let url = "http://localhost:8000/api/inventory/bills/?";
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (startDate) params.push(`start_date=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`end_date=${encodeURIComponent(endDate)}`);
    url += params.join("&");
    const res = await fetch(url);
    const data = await res.json();
    setBills(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBills();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBills();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-300">All Bills</h1>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Bill ID or Customer Name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border rounded dark:bg-zinc-800 dark:text-white flex-1"
          />
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded dark:bg-zinc-800 dark:text-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded dark:bg-zinc-800 dark:text-white"
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded font-semibold">Search</button>
        </form>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="text-center text-gray-500">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="px-3 py-2 text-left font-semibold">Bill ID</th>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Customer</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                  <th className="px-3 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.id} className="border-b border-gray-100 dark:border-zinc-800">
                    <td className="px-3 py-2">{bill.id}</td>
                    <td className="px-3 py-2">{bill.date ? new Date(bill.date).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2">{bill.customer}</td>
                    <td className="px-3 py-2 text-right">₹{parseFloat(bill.total).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <a
                        href={`http://localhost:8000/api/inventory/bill/${bill.id}/pdf/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-700 text-white px-2 py-1 rounded hover:bg-blue-800"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 