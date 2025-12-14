import React, { useContext, useState, useMemo } from 'react';
import { StoreContext } from '../App';
import { Plus, Search, AlertCircle, Package, Pencil, Trash2, Settings, X, Check } from 'lucide-react';
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
    
    // New Fields State
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState('');
    const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
    const [newCategories, setNewCategories] = useState<string[]>([]);

    // Catalog State (In-memory for now, could be persisted)
    const [brandCatalog, setBrandCatalog] = useState<string[]>(['Generic', 'Acme', 'Premium']);
    const [modelCatalog, setModelCatalog] = useState<string[]>(['Standard', 'Pro', 'Elite']);
    const [categoryCatalog, setCategoryCatalog] = useState<string[]>(['Electronics', 'Office', 'Furniture', 'Raw Materials']);
    
    // Catalog Management State
    const [managingCatalog, setManagingCatalog] = useState<'brand' | 'model' | 'category' | null>(null);
    const [catalogItemInput, setCatalogItemInput] = useState('');

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
        setNewBrand('');
        setNewModel('');
        setNewYear(new Date().getFullYear());
        setNewCategories([]);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product: Product) => {
        setEditingId(product.id);
        setNewName(product.name);
        setNewSku(product.sku);
        setNewStock(product.stockCount);
        setNewPrice(product.price);
        setNewBrand(product.brand || '');
        setNewModel(product.model || '');
        setNewYear(product.year || new Date().getFullYear());
        setNewCategories(product.categories || []);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const productData = {
            name: newName,
            sku: newSku,
            stockCount: newStock,
            price: newPrice,
            brand: newBrand,
            model: newModel,
            year: newYear,
            categories: newCategories
        };

        if (editingId) {
            updateProduct(editingId, productData);
        } else {
            const newProduct: Product = {
                id: crypto.randomUUID(),
                description: '',
                ...productData
            };
            addProduct(newProduct);
        }
        
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewName(''); setNewSku(''); setNewStock(0); setNewPrice(0); 
        setNewBrand(''); setNewModel(''); setNewYear(new Date().getFullYear()); setNewCategories([]);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    // Catalog Helpers
    const addToCatalog = (type: 'brand' | 'model' | 'category') => {
        if (!catalogItemInput.trim()) return;
        if (type === 'brand') setBrandCatalog(prev => [...prev, catalogItemInput]);
        if (type === 'model') setModelCatalog(prev => [...prev, catalogItemInput]);
        if (type === 'category') setCategoryCatalog(prev => [...prev, catalogItemInput]);
        setCatalogItemInput('');
    };

    const removeFromCatalog = (type: 'brand' | 'model' | 'category', item: string) => {
        if (type === 'brand') setBrandCatalog(prev => prev.filter(i => i !== item));
        if (type === 'model') setModelCatalog(prev => prev.filter(i => i !== item));
        if (type === 'category') setCategoryCatalog(prev => prev.filter(i => i !== item));
    };

    const toggleCategory = (cat: string) => {
        setNewCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Package size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">Inventory Management</h1>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all duration-200 hover:border-indigo-300 border border-transparent shadow-sm"
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
                        placeholder="Search by name, SKU, brand..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition-all duration-200 focus:border-indigo-300 shadow-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500">Product</th>
                                <th className="px-6 py-3 font-medium text-gray-500">Brand/Model</th>
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
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{product.name}</div>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {product.categories?.map(c => (
                                                <span key={c} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{c}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {product.brand} <span className="text-gray-400">/</span> {product.model}
                                        {product.year && <span className="text-xs text-gray-400 block">{product.year}</span>}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-500">{product.sku}</td>
                                    <td className="px-6 py-4 text-right">{product.stockCount}</td>
                                    <td className="px-6 py-4 text-right">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        {product.stockCount < 10 ? (
                                            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit text-xs font-medium border border-red-100">
                                                <AlertCircle size={12}/> Low Stock
                                            </span>
                                        ) : (
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100">In Stock</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenEdit(product)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all duration-200 hover:border-indigo-200 border border-transparent"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(product.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 hover:border-red-200 border border-transparent"
                                                title="Delete"
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                                    <input required className="w-full border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Wireless Mouse" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU</label>
                                    <input required className="w-full border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all font-mono" value={newSku} onChange={e => setNewSku(e.target.value)} placeholder="ABC-123" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock</label>
                                        <input required type="number" className="w-full border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all" value={newStock} onChange={e => setNewStock(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price ($)</label>
                                        <input required type="number" step="0.01" className="w-full border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Catalog Fields */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Brand */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Brand</label>
                                        <button type="button" onClick={() => setManagingCatalog('brand')} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"><Settings size={10} /> Manage</button>
                                    </div>
                                    <select 
                                        title="Select Brand"
                                        aria-label="Select Brand"
                                        className="w-full border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
                                        value={newBrand}
                                        onChange={e => setNewBrand(e.target.value)}
                                    >
                                        <option value="">Select Brand...</option>
                                        {brandCatalog.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                {/* Model */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Model</label>
                                        <button type="button" onClick={() => setManagingCatalog('model')} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"><Settings size={10} /> Manage</button>
                                    </div>
                                    <select 
                                        title="Select Model"
                                        aria-label="Select Model"
                                        className="w-full border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
                                        value={newModel}
                                        onChange={e => setNewModel(e.target.value)}
                                    >
                                        <option value="">Select Model...</option>
                                        {modelCatalog.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>

                                {/* Year */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Year</label>
                                    <input 
                                        type="number" 
                                        className="w-full border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
                                        value={newYear}
                                        onChange={e => setNewYear(Number(e.target.value))}
                                        min="1900" max="2100"
                                    />
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Categories</label>
                                    <button type="button" onClick={() => setManagingCatalog('category')} className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"><Settings size={10} /> Manage</button>
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50/50 min-h-[60px]">
                                    {categoryCatalog.map(cat => (
                                        <button 
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleCategory(cat)}
                                            className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${newCategories.includes(cat) ? 'bg-indigo-100 text-indigo-700 border-indigo-200 font-medium' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                    {categoryCatalog.length === 0 && <span className="text-gray-400 text-xs italic">No categories available. Add some!</span>}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-sm hover:border-gray-300">Cancel</button>
                            <button onClick={handleSubmit} type="button" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-all shadow-sm hover:border-indigo-300 border border-transparent">
                                {editingId ? 'Save Changes' : 'Create Product'}
                            </button>
                        </div>
                    </div>

                    {/* Catalog Manager Popover Overlay */}
                    {managingCatalog && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={() => setManagingCatalog(null)}>
                            <div className="bg-white rounded-lg shadow-xl p-4 w-72 border border-gray-200" onClick={e => e.stopPropagation()}>
                                <h3 className="font-bold text-gray-800 mb-3 capitalize flex items-center gap-2">
                                    <Settings size={14}/> Manage {managingCatalog}s
                                </h3>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        autoFocus
                                        className="flex-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:ring-2 focus:ring-indigo-500" 
                                        placeholder={`New ${managingCatalog}...`}
                                        value={catalogItemInput}
                                        onChange={e => setCatalogItemInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addToCatalog(managingCatalog)}
                                    />
                                    <button onClick={() => addToCatalog(managingCatalog)} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 transition-colors">
                                        <Plus size={16}/>
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {(managingCatalog === 'brand' ? brandCatalog : managingCatalog === 'model' ? modelCatalog : categoryCatalog).map(item => (
                                        <div key={item} className="flex justify-between items-center text-sm p-1.5 hover:bg-gray-50 rounded group">
                                            <span>{item}</span>
                                            <button onClick={() => removeFromCatalog(managingCatalog!, item)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={14}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setManagingCatalog(null)} className="w-full mt-3 text-xs text-gray-500 hover:text-gray-900 font-medium">Done</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
