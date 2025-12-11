
import React, { useContext, useState, useEffect } from 'react';
import { StoreContext } from '../App';
import { Plus, Search, AlertCircle, Package, Pencil, Trash2 } from 'lucide-react';
import { Product } from '../types';

export const InventoryView: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useContext(StoreContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form state
    const [newName, setNewName] = useState('');
    const [newSku, setNewSku] = useState('');
    const [newStock, setNewStock] = useState(0);
    const [newPrice, setNewPrice] = useState(0);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenAdd = () => {
        setEditingId(null);
        setNewName('');
        setNewSku('');
        setNewStock(0);
        setNewPrice(0);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditingId(product.id);
        setNewName(product.name);
        setNewSku(product.sku);
        setNewStock(product.stockCount);
        setNewPrice(product.price);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingId) {
            updateProduct(editingId, {
                name: newName,
                sku: newSku,
                stockCount: newStock,
                price: newPrice
            });
        } else {
            const newProduct: Product = {
                id: crypto.randomUUID(),
                name: newName,
                sku: newSku,
                stockCount: newStock,
                price: newPrice,
                description: ''
            };
            addProduct(newProduct);
        }
        
        setIsModalOpen(false);
        setNewName(''); setNewSku(''); setNewStock(0); setNewPrice(0); setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Package size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">Inventory Management</h1>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all duration-200 hover:border-indigo-300 border border-transparent"
                >
                    <Plus size={16} /> Add Product
                </button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or SKU..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-all duration-200 focus:border-indigo-300"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">Product Name</th>
                                <th className="px-6 py-3 font-medium text-gray-500">SKU</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">Stock</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">Price</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                                <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50 group transition-all duration-200 hover:border-gray-200 border border-transparent">
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 font-mono text-gray-500">{product.sku}</td>
                                    <td className="px-6 py-4 text-right">{product.stockCount}</td>
                                    <td className="px-6 py-4 text-right">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        {product.stockCount < 10 ? (
                                            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit text-xs font-medium">
                                                <AlertCircle size={12}/> Low Stock
                                            </span>
                                        ) : (
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">In Stock</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenEdit(product)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all duration-200 hover:border-indigo-200 border border-transparent"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(product.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 hover:border-red-200 border border-transparent"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]">
                        <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                <input required className="w-full border p-2 rounded" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                                <input required className="w-full border p-2 rounded" value={newSku} onChange={e => setNewSku(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                                    <input required type="number" className="w-full border p-2 rounded" value={newStock} onChange={e => setNewStock(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                    <input required type="number" step="0.01" className="w-full border p-2 rounded" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded transition-all duration-200 hover:border-gray-200 border border-transparent">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all duration-200 hover:border-indigo-300 border border-transparent">
                                {editingId ? 'Update Product' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
