"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, Save, X, Search } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { DataTable, StatCard, StatusBadge, TableSkeleton, Skeleton } from "@/components/admin/AdminComponents";
import { useMenu, useUpdateMenuItem, type MenuItem } from "@/lib/api-admin";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";

const categories = ["Hot Coffee", "Cold Brews", "Smoothies", "Pastries", "Other"];

export default function AdminMenuPage() {
  const { data: menuData, isLoading, error, mutate, retry } = useMenu();
  const updateMenuItem = useUpdateMenuItem();

  // Ensure menu is always an array
  const menu = Array.isArray(menuData) ? menuData : [];

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null);

  const filteredMenu = menu.filter((item: MenuItem) => {
    const matchesSearch = searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesAvailability = availabilityFilter === "All" ||
      (availabilityFilter === "Available" && item.isAvailable) ||
      (availabilityFilter === "Unavailable" && !item.isAvailable);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Stats
  const totalItems = menu.length;
  const availableCount = menu.filter(i => i.isAvailable).length;
  const unavailableCount = menu.filter(i => !i.isAvailable).length;
  const lowStockCount = menu.filter(i => i.stock > 0 && i.stock <= 6).length;

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { isAvailable: !item.isAvailable, stock: !item.isAvailable ? 0 : item.stock });
      toast.success(`${item.name} ${!item.isAvailable ? "enabled" : "disabled"}`);
      mutate();
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Delete ${item.name} (${item.id})? This cannot be undone.`)) return;
    try {
      // In production, call delete API
      toast.success("Item deleted (demo mode)");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const handleView = (item: MenuItem) => {
    setViewingItem(item);
  };

  const handleAddItem = async (data: Omit<MenuItem, "id"> & { id?: string }) => {
    try {
      // In production, call add API
      toast.success("Item added (demo mode)");
      setShowAddModal(false);
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleUpdateItem = async (data: MenuItem) => {
    try {
      await updateMenuItem(data.id, data);
      toast.success("Menu item updated");
      setEditingItem(null);
      mutate();
    } catch {
      toast.error("Failed to update menu item");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Hot Coffee": return "bg-[var(--primary)]/20 text-[var(--primary)]";
      case "Cold Brews": return "bg-[var(--cold-badge)]/20 text-[var(--cold-badge)]";
      case "Smoothies": return "bg-[var(--secondary)]/20 text-[var(--secondary)]";
      case "Pastries": return "bg-[var(--tertiary)]/20 text-[var(--tertiary)]";
      default: return "bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold tracking-[.22em] uppercase text-[var(--primary)]">CATALOGUE</span>
          <h1 className="serif mt-2 text-3xl font-semibold text-[var(--on-surface)]">Menu</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatCard key={i} label="Loading..." value="—" />)}
        </div>
        <div className="admin-card p-4">
          <TableSkeleton rows={8} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="admin-card flex flex-wrap items-center justify-between gap-4 p-4">
          <p className="text-sm text-red-400">Unable to load menu. {error instanceof Error ? error.message : "Please try again."}</p>
          <button type="button" onClick={retry} className="btn-ghost text-sm">Retry</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[.22em] uppercase text-[var(--primary)]">CATALOGUE</span>
          <h1 className="serif mt-2 text-3xl font-semibold text-[var(--on-surface)]">Menu</h1>
          <p className="mt-1 text-sm text-[var(--on-surface-variant)]">Manage menu items, pricing & availability</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={totalItems} note="Across all categories" icon={<ImageIcon size={18} className="text-[var(--primary)]" />} />
        <StatCard label="Available" value={availableCount} note="Visible to customers" icon={<Eye size={18} className="text-[var(--success)]" />} />
        <StatCard label="Unavailable" value={unavailableCount} note="Hidden from menu" icon={<EyeOff size={18} className="text-[var(--on-surface-variant)]" />} />
        <StatCard label="Low Stock" value={lowStockCount} note="≤ 6 units remaining" icon={<Save size={18} className="text-[var(--warning)]" />} />
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, category..."
            className="input-luxury w-full pl-10 pr-4 py-2.5"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-luxury w-auto py-1.5 px-3 text-sm"
          >
            <option value="All">All Categories</option>
            {Array.from(new Set(menu.map(item => item.category))).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="input-luxury w-auto py-1.5 px-3 text-sm"
          >
            <option value="All">All Status</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Menu Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-bold text-[10px] uppercase tracking-wider">
                <th className="table-header">Item</th>
                <th className="table-header">Image</th>
                <th className="table-header">Category</th>
                <th className="table-header">Price</th>
                <th className="table-header">Stock</th>
                <th className="table-header text-center">Availability</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--outline-variant)] text-[var(--on-surface)]">
              {filteredMenu.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--on-surface-variant)]">No menu items match your filters</td>
                </tr>
              ) : (
                filteredMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-container-low)] transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-[var(--on-surface)]">{item.name}</p>
                        <p className="text-xs text-[var(--on-surface-variant)] font-mono">{item.id}</p>
                        <p className="text-xs text-[var(--on-surface-variant)] line-clamp-1 mt-1">{item.description || "No description"}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="w-12 h-12 rounded-lg bg-[var(--surface-container-high)] flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={24} className="text-[var(--on-surface-variant)]" />
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="table-cell font-headline-sm text-[var(--on-surface)]">{formatINR(item.price)}</td>
                    <td className="table-cell">
                      <span className={cn(
                        "font-medium",
                        item.stock <= 0 ? "text-[var(--error)]" :
                        item.stock <= 6 ? "text-[var(--warning)]" :
                        "text-[var(--on-surface)]"
                      )}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
                          item.isAvailable
                            ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30"
                            : "bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full", item.isAvailable ? "bg-[var(--success)]" : "bg-[var(--error)]")} />
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </button>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(item)}
                          className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--primary)] hover:bg-[var(--surface-container-high)] transition-colors"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-[var(--on-surface-variant)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-[var(--surface-container-low)] border-t border-[var(--outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--on-surface-variant)]">
          <span>Showing {filteredMenu.length} of {totalItems} menu items</span>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="serif text-xl font-semibold">Add Menu Item</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">
                <X size={24} />
              </button>
            </div>
            <MenuItemForm onSubmit={handleAddItem} onClose={() => setShowAddModal(false)} />
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setEditingItem(null)}>
          <div className="bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="serif text-xl font-semibold">Edit: {editingItem.name}</h2>
              <button onClick={() => setEditingItem(null)} className="p-2 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">
                <X size={24} />
              </button>
            </div>
            <MenuItemForm initialData={editingItem} onSubmit={handleUpdateItem} onClose={() => setEditingItem(null)} isEditing />
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setViewingItem(null)}>
          <div className="bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="serif text-lg font-semibold">Item Details</h2>
              <button onClick={() => setViewingItem(null)} className="p-2 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-3">
              {viewingItem.imageUrl && (
                <div className="aspect-square rounded-lg overflow-hidden bg-[var(--surface-container-high)]">
                  <Image src={viewingItem.imageUrl} alt={viewingItem.name} fill className="object-cover" />
                </div>
              )}
              <div>
                <p className="text-xs text-[var(--on-surface-variant)] font-mono">{viewingItem.id}</p>
                <p className="serif text-2xl font-semibold text-[var(--on-surface)]">{viewingItem.name}</p>
              </div>
              <p className="text-[var(--on-surface-variant)]">{viewingItem.description || "No description"}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getCategoryColor(viewingItem.category)}`}>
                  {viewingItem.category}
                </span>
                <span className="font-headline-sm text-[var(--primary)]">{formatINR(viewingItem.price)}</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold",
                  viewingItem.isAvailable ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-[var(--error)]/15 text-[var(--error)]"
                )}>
                  {viewingItem.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
              <p className="text-xs text-[var(--on-surface-variant)]">Stock: {viewingItem.stock} units</p>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}

function MenuItemForm({ initialData, onSubmit, onClose, isEditing }: {
  initialData?: MenuItem;
  onSubmit: (data: MenuItem) => void;
  onClose: () => void;
  isEditing?: boolean;
}) {
  const initialId = useMemo(
    () => initialData?.id || `NEW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    [initialData?.id]
  );
  const [formData, setFormData] = useState<MenuItem>({
    id: initialId,
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    category: initialData?.category || "Hot Coffee",
    imageUrl: initialData?.imageUrl || "",
    isAvailable: initialData?.isAvailable ?? true,
    stock: initialData?.stock || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1">Item ID</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({...formData, id: e.target.value})}
            className="input-luxury"
            disabled={isEditing}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="input-luxury"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="input-luxury"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="input-luxury min-h-[80px] resize-y"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1">Price (₹)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
            className="input-luxury"
            min="0"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1">Stock</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
            className="input-luxury"
            min="0"
            required
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
              className="w-4 h-4 rounded border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--on-surface)]">Available in menu</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--on-surface-variant)] mb-1">Image URL</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
          className="input-luxury"
          placeholder="https://..."
        />
        {formData.imageUrl && (
          <div className="mt-2 aspect-square max-w-xs rounded-lg overflow-hidden bg-[var(--surface-container-high)]">
            <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1">{isEditing ? "Save Changes" : "Add Item"}</button>
      </div>
    </form>
  );
}
