"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BillingPage() {
  // Customer state
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "" });
  const [registerMsg, setRegisterMsg] = useState("");

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [billItems, setBillItems] = useState([]);
  const [itemToAdd, setItemToAdd] = useState({ inventory_id: "", quantity: 1 });
  const [addItemMsg, setAddItemMsg] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  // Bill state
  const [billMsg, setBillMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastBillId, setLastBillId] = useState(null);
  const [lastBillItems, setLastBillItems] = useState([]);
  const [lastBillTotal, setLastBillTotal] = useState(0);

  // Fetch customers and inventory
  useEffect(() => {
    fetchCustomers();
    fetchInventory();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch("http://localhost:8000/api/inventory/customers/");
    const data = await res.json();
    setCustomers(data);
  };
  const fetchInventory = async () => {
    const res = await fetch("http://localhost:8000/api/inventory/list/");
    const data = await res.json();
    setInventory(data);
  };

  // Customer search and select (only show results when search is typed)
  const filteredCustomers = customerSearch.length > 0
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
      )
    : [];

  // Register new customer
  const handleRegisterChange = e => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };
  const handleRegister = async e => {
    e.preventDefault();
    setRegisterMsg("");
    const res = await fetch("http://localhost:8000/api/inventory/customers/add/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerForm),
    });
    const data = await res.json();
    if (res.ok) {
      setRegisterMsg("Customer registered!");
      setSelectedCustomer(data);
      setShowRegister(false);
      fetchCustomers();
    } else {
      setRegisterMsg(data.error || "Registration failed.");
    }
  };

  // Item search and select
  const filteredInventory = itemSearch.length > 0
    ? inventory.filter(i =>
        i.name.toLowerCase().includes(itemSearch.toLowerCase())
      )
    : [];

  // When clicking an item from the dropdown, set it for adding
  const handleSelectItem = (item) => {
    setItemToAdd({ inventory_id: item.id, quantity: 1 });
    setItemSearch(item.name);
    setShowItemDropdown(false);
  };

  // Add item to bill
  const handleAddItem = e => {
    e.preventDefault();
    setAddItemMsg("");
    const inv = inventory.find(i => i.id == itemToAdd.inventory_id);
    if (!inv) return setAddItemMsg("Select an item.");
    if (billItems.some(bi => bi.inventory_id == inv.id)) return setAddItemMsg("Item already added.");
    if (itemToAdd.quantity < 1) return setAddItemMsg("Quantity must be at least 1.");
    if (itemToAdd.quantity > inv.quantity) return setAddItemMsg("Not enough stock.");
    setBillItems([...billItems, {
      inventory_id: inv.id,
      name: inv.name,
      price: parseFloat(inv.price),
      quantity: parseInt(itemToAdd.quantity, 10),
      maxQuantity: inv.quantity
    }]);
    setItemToAdd({ inventory_id: "", quantity: 1 });
    setItemSearch("");
  };
  const handleRemoveItem = id => {
    setBillItems(billItems.filter(bi => bi.inventory_id !== id));
  };

  // Bill summary
  const total = billItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // Dashboard summary cards (for demo: show total items, total quantity, total value)
  const totalBillItems = billItems.length;
  const totalBillQuantity = billItems.reduce((sum, i) => sum + i.quantity, 0);

  // Submit bill
  const handleSubmitBill = async e => {
    e.preventDefault();
    setBillMsg("");
    setSubmitting(true);
    const items = billItems.map(i => ({ inventory_id: i.inventory_id, quantity: i.quantity, price: i.price }));
    const res = await fetch("http://localhost:8000/api/inventory/bill/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: selectedCustomer.id, items }),
    });
    const data = await res.json();
    if (res.ok) {
      setBillMsg(`Bill created! Total: ₹${data.total}`);
      setLastBillId(data.bill_id);
      setLastBillItems(billItems);
      setLastBillTotal(total);
      setBillItems([]);
      fetchInventory();
    } else {
      setBillMsg(data.error || "Billing failed.");
      setLastBillId(null);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] p-0">
      {/* Dashboard Header */}
      <div className="w-full px-8 py-8 bg-white dark:bg-zinc-900 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-1">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900">
            <svg className="w-7 h-7 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h6m-6 0V7a4 4 0 014-4h2a4 4 0 014 4v2a4 4 0 01-4 4h-2a4 4 0 01-4-4V7" /></svg>
          </span>
          <div>
            <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300">Billing Dashboard</h1>
            <div className="text-gray-600 dark:text-gray-400 text-base ml-1">Create and manage customer bills efficiently.</div>
          </div>
        </div>
        <Link href="/inventory">
          <button className="bg-blue-700 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-800 transition-colors text-lg shadow">Go to Inventory</button>
        </Link>
      </div>

      {/* Dashboard Stats */}
      <div className="w-full px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 bg-gradient-to-r from-blue-50/60 to-blue-100/40 dark:from-zinc-900 dark:to-zinc-800 border-b border-gray-200 dark:border-zinc-800">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 p-8 flex flex-col items-center">
          <div className="text-gray-500 text-xs mb-1">Bill Items</div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalBillItems}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 p-8 flex flex-col items-center">
          <div className="text-gray-500 text-xs mb-1">Total Quantity</div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalBillQuantity}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 p-8 flex flex-col items-center">
          <div className="text-gray-500 text-xs mb-1">Total Value</div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">₹{total.toFixed(2)}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-5xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow border border-gray-200 dark:border-zinc-800 mt-8">
        {/* Customer Section */}
        <div className="mb-10">
          <h2 className="font-semibold text-xl mb-3 text-gray-800 dark:text-gray-100">Customer</h2>
          {selectedCustomer ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
              <div className="font-semibold text-lg">{selectedCustomer.name}</div>
              <div className="text-sm text-gray-500">{selectedCustomer.email} | {selectedCustomer.phone}</div>
              <button className="sm:ml-4 text-blue-600 hover:underline text-sm" onClick={() => setSelectedCustomer(null)}>Change</button>
            </div>
          ) : showRegister ? (
            <form onSubmit={handleRegister} className="flex flex-col md:flex-row gap-2 md:items-end mb-2">
              <input type="text" name="name" placeholder="Name" value={registerForm.name} onChange={handleRegisterChange} required className="px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:text-white" />
              <input type="email" name="email" placeholder="Email" value={registerForm.email} onChange={handleRegisterChange} required className="px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:text-white" />
              <input type="text" name="phone" placeholder="Phone" value={registerForm.phone} onChange={handleRegisterChange} required className="px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:text-white" />
              <button type="submit" className="bg-blue-700 text-white px-6 py-3 rounded-xl">Register</button>
              <button type="button" className="text-gray-500 ml-2" onClick={() => setShowRegister(false)}>Cancel</button>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row gap-2 md:items-end mb-2">
              <input type="text" placeholder="Search customer by name or phone" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:text-white flex-1" />
              <button className="bg-blue-700 text-white px-6 py-3 rounded-xl" onClick={() => setShowRegister(true)}>Register New</button>
            </div>
          )}
          {registerMsg && <div className="text-green-700 dark:text-green-400 text-sm mb-2">{registerMsg}</div>}
          {!selectedCustomer && !showRegister && customerSearch.length > 0 && (
            <div className="max-h-32 overflow-y-auto border rounded-xl bg-gray-50 dark:bg-zinc-800 mt-2">
              {filteredCustomers.length === 0 ? (
                <div className="p-2 text-gray-500">No customers found.</div>
              ) : filteredCustomers.map(c => (
                <div key={c.id} className="p-2 hover:bg-blue-50 dark:hover:bg-zinc-700 cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                  <span className="font-semibold">{c.name}</span> <span className="text-xs text-gray-500">({c.email}, {c.phone})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Item Section */}
        <div className="mb-10">
          <h2 className="font-semibold text-xl mb-3 text-gray-800 dark:text-gray-100">Add Items</h2>
          <div className="flex flex-col md:flex-row gap-2 md:items-end mb-2 relative">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search item by name"
                value={itemSearch}
                onChange={e => {
                  setItemSearch(e.target.value);
                  setShowItemDropdown(true);
                  setItemToAdd({ inventory_id: "", quantity: 1 });
                }}
                onFocus={() => setShowItemDropdown(true)}
                className="px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:text-white w-full"
                autoComplete="off"
              />
              {showItemDropdown && itemSearch.length > 0 && (
                <div className="absolute z-10 left-0 right-0 bg-white dark:bg-zinc-800 border rounded-xl shadow max-h-40 overflow-y-auto">
                  {filteredInventory.length === 0 ? (
                    <div className="p-2 text-gray-500">No items found.</div>
                  ) : filteredInventory.map(i => (
                    <div
                      key={i.id}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-zinc-700 cursor-pointer flex justify-between items-center"
                      onClick={() => handleSelectItem(i)}
                    >
                      <span>{i.name}</span>
                      <span className="text-xs text-gray-500">₹{parseFloat(i.price).toFixed(2)}, Stock: {i.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-2 md:items-end w-full md:w-auto">
              <input
                type="number"
                name="quantity"
                min="1"
                value={itemToAdd.quantity}
                onChange={e => setItemToAdd({ ...itemToAdd, quantity: e.target.value })}
                required
                className="px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:text-white w-24"
                placeholder="Qty"
                disabled={!itemToAdd.inventory_id}
              />
              <button type="submit" className="bg-blue-700 text-white px-6 py-3 rounded-xl" disabled={!itemToAdd.inventory_id}>Add</button>
            </form>
          </div>
          {addItemMsg && <div className="text-red-600 text-sm mb-2">{addItemMsg}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-base">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="px-4 py-3 text-left font-semibold">Item</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {billItems.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-2">No items added.</td></tr>
                ) : billItems.map(item => (
                  <tr key={item.inventory_id} className="hover:bg-blue-50/40 dark:hover:bg-zinc-800/60 transition-colors">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right"><button className="text-red-600 hover:underline" onClick={() => handleRemoveItem(item.inventory_id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Bill Summary & Submit */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t pt-6">
          <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">Total: <span className="text-blue-700 dark:text-blue-300">₹{total.toFixed(2)}</span></div>
          <button onClick={handleSubmitBill} disabled={!selectedCustomer || billItems.length === 0 || submitting} className="bg-green-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 text-lg">
            {submitting ? "Processing..." : "Create Bill"}
          </button>
        </div>
        {billMsg && (
          <div className="mt-6 text-center text-lg text-green-700 dark:text-green-400 font-semibold">
            {billMsg}
            {lastBillId && selectedCustomer && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <a
                  href={`http://localhost:8000/api/inventory/bill/${lastBillId}/pdf/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold text-base"
                >
                  Print Bill (PDF)
                </a>
                <a
                  href={`https://wa.me/${selectedCustomer.phone}?text=${encodeURIComponent(
                    `Dear ${selectedCustomer.name}, here is your bill #${lastBillId}:\n` +
                    lastBillItems.map(item => `- ${item.name}: ${item.quantity} x ₹${item.price} = ₹${item.quantity * item.price}`).join("\n") +
                    `\nTotal: ₹${lastBillTotal.toFixed(2)}\nThank you for your purchase!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold text-base"
                >
                  Send Bill to Customer WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 