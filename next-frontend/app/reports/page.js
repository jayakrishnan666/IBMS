"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  useEffect(() => {
    // Use correct API endpoints with /inventory/
    Promise.all([
      fetch("http://localhost:8000/api/inventory/reports/summary/").then(res => res.json()),
      fetch("http://localhost:8000/api/inventory/reports/top-products/").then(res => res.json()),
      fetch("http://localhost:8000/api/inventory/reports/inventory-status/").then(res => res.json()),
      fetch("http://localhost:8000/api/inventory/reports/recent-transactions/").then(res => res.json()),
      fetch("http://localhost:8000/api/inventory/reports/sales-trend/").then(res => res.json()),
    ]).then(([summary, topProducts, inventory, transactions, trend]) => {
      setSummary(summary);
      setTopProducts(topProducts);
      setInventory(inventory);
      setTransactions(transactions);
      setTrend(trend);
      setLoading(false);
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSendReport = async () => {
    setSending(true);
    setSendMessage("");
    try {
      const res = await fetch("http://localhost:8000/api/inventory/reports/send-to-manager/", {
        method: "POST"
      });
      if (res.ok) {
        setSendMessage("Report sent to manager successfully.");
      } else {
        setSendMessage("Failed to send report to manager.");
      }
    } catch {
      setSendMessage("Error connecting to server.");
    }
    setSending(false);
  };

  // Helper to get top selling day and month
  function getTopSellingDay(trend) {
    if (!trend || trend.length === 0) return null;
    return trend.reduce((max, curr) => (curr.sales > max.sales ? curr : max), trend[0]);
  }
  function getTopSellingMonth(trend) {
    if (!trend || trend.length === 0) return null;
    const monthMap = {};
    trend.forEach(item => {
      const month = item.date.slice(0, 7); // YYYY-MM
      monthMap[month] = (monthMap[month] || 0) + item.sales;
    });
    let topMonth = null;
    let maxSales = 0;
    for (const [month, sales] of Object.entries(monthMap)) {
      if (sales > maxSales) {
        maxSales = sales;
        topMonth = month;
      }
    }
    return { month: topMonth, sales: maxSales };
  }

  const topDay = getTopSellingDay(trend);
  const topMonth = getTopSellingMonth(trend);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-300">Reports Dashboard</h2>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow">
      {/* Print-only section */}
      <div className="hidden print:block">
        <h1 className="text-3xl font-bold mb-4">Report</h1>
        <div className="mb-4">
          <strong>Total Sales:</strong> {summary.total_sales}
        </div>
        <div className="mb-4">
          <strong>Total Transactions:</strong> {summary.transactions}
        </div>
        <div className="mb-4">
          <strong>Average Bill:</strong> {summary.avg_bill}
        </div>
        <div className="mb-4">
          <strong>Low Stock Items:</strong> {inventory.length}
          {inventory.length > 0 && (
            <table className="w-full table-auto border-collapse mt-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Product</th>
                  <th className="border px-2 py-1">Stock</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{item.name}</td>
                    <td className="border px-2 py-1">{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mb-4">
          <strong>Top Selling Products:</strong>
          {topProducts.length > 0 && (
            <table className="w-full table-auto border-collapse mt-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Product</th>
                  <th className="border px-2 py-1">Units Sold</th>
                  <th className="border px-2 py-1">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((prod, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{prod.name}</td>
                    <td className="border px-2 py-1">{prod.units_sold}</td>
                    <td className="border px-2 py-1">{prod.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mb-4">
          <strong>Top Selling Day:</strong> {topDay ? `${topDay.date} (Sales: ${topDay.sales})` : 'N/A'}
        </div>
        <div className="mb-4">
          <strong>Top Selling Month:</strong> {topMonth ? `${topMonth.month} (Sales: ${topMonth.sales})` : 'N/A'}
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300">Reports Dashboard</h2>
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
          >
            Print
          </button>
          <button
            onClick={handleSendReport}
            disabled={sending}
            className="bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            {sending ? "Sending..." : "Send to Manager"}
          </button>
        </div>
      </div>
      {sendMessage && <div className="mb-4 text-center text-blue-700 dark:text-blue-300">{sendMessage}</div>}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-xl shadow text-center">
          <div className="text-lg font-semibold">Total Sales</div>
          <div className="text-2xl font-bold">{summary.total_sales}</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-6 rounded-xl shadow text-center">
          <div className="text-lg font-semibold">Transactions</div>
          <div className="text-2xl font-bold">{summary.transactions}</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900 p-6 rounded-xl shadow text-center">
          <div className="text-lg font-semibold">Avg. Bill</div>
          <div className="text-2xl font-bold">{summary.avg_bill}</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-6 rounded-xl shadow text-center">
          <div className="text-lg font-semibold">Low Stock Items</div>
          <div className="text-2xl font-bold">{summary.low_stock}</div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow mb-8">
        <div className="text-lg font-semibold mb-4">Sales Trend</div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow mb-8">
        <div className="text-lg font-semibold mb-4">Top Selling Products</div>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">Product</th>
              <th className="border px-4 py-2">Units Sold</th>
              <th className="border px-4 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((prod, idx) => (
              <tr key={idx}>
                <td className="border px-4 py-2">{prod.name}</td>
                <td className="border px-4 py-2">{prod.units_sold}</td>
                <td className="border px-4 py-2">{prod.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inventory Status */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow mb-8">
        <div className="text-lg font-semibold mb-4">Low Stock Inventory</div>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">Product</th>
              <th className="border px-4 py-2">Stock</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, idx) => (
              <tr key={idx}>
                <td className="border px-4 py-2">{item.name}</td>
                <td className="border px-4 py-2">{item.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow">
        <div className="text-lg font-semibold mb-4">Recent Transactions</div>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Bill No</th>
              <th className="border px-4 py-2">Customer</th>
              <th className="border px-4 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, idx) => (
              <tr key={idx}>
                <td className="border px-4 py-2">{txn.date}</td>
                <td className="border px-4 py-2">{txn.bill_no}</td>
                <td className="border px-4 py-2">{txn.customer}</td>
                <td className="border px-4 py-2">{txn.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .print\:block { display: block !important; visibility: visible !important; }
          .print\:block * { visibility: visible !important; }
          .max-w-6xl, .max-w-6xl * { visibility: visible !important; }
          .max-w-6xl > :not(.print\:block) { display: none !important; }
        }
      `}</style>
    </div>
  );
} 