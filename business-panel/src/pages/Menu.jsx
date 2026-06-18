import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newItem, setNewItem] = useState(null);

  const reload = () => api.menu().then(setCategories);
  useEffect(() => { reload(); }, []);

  async function addCategory() {
    if (!newCatName.trim()) return;
    await api.createCategory({ name: newCatName.trim() });
    setNewCatName(''); reload();
  }

  async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    await api.deleteCategory(id); reload();
  }

  async function toggleItem(item) {
    await api.updateItem(item.id, { available: !item.available }); reload();
  }

  async function deleteItem(id) {
    await api.deleteItem(id); reload();
  }

  async function saveItem() {
    if (newItem.id) {
      await api.updateItem(newItem.id, newItem);
    } else {
      await api.createItem(newItem);
    }
    setNewItem(null); reload();
  }

  async function handlePhoto(itemId, file) {
    await api.uploadPhoto(itemId, file); reload();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Menú</h1>

      <div className="flex gap-2">
        <input className="border rounded px-3 py-1.5 text-sm flex-1" placeholder="Nueva categoría" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
        <button onClick={addCategory} className="bg-orange-600 text-white px-3 py-1.5 rounded text-sm">+ Categoría</button>
      </div>

      {categories.map((cat) => (
        <div key={cat.id} className="bg-white rounded-xl shadow p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">{cat.name}</h2>
            <div className="flex gap-2">
              <button onClick={() => setNewItem({ category_id: cat.id, name:'', description:'', price:'', available: true })}
                className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm">+ Producto</button>
              <button onClick={() => deleteCategory(cat.id)} className="text-red-400 text-sm hover:underline">Eliminar</button>
            </div>
          </div>
          {cat.items.length === 0 && <p className="text-gray-400 text-sm">Sin productos.</p>}
          {cat.items.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 p-2 rounded ${item.available ? '' : 'opacity-50'}`}>
              {item.photo_url
                ? <img src={item.photo_url} className="w-12 h-12 rounded object-cover" />
                : <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">Sin foto</div>}
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">${parseFloat(item.price).toFixed(2)}</p>
              </div>
              <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                📷 Foto <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(item.id, e.target.files[0])} />
              </label>
              <button onClick={() => toggleItem(item)} className={`text-xs px-2 py-0.5 rounded ${item.available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {item.available ? 'Disponible' : 'Agotado'}
              </button>
              <button onClick={() => setNewItem({ ...item })} className="text-blue-500 text-sm hover:underline">Editar</button>
              <button onClick={() => deleteItem(item.id)} className="text-red-400 text-sm hover:underline">✕</button>
            </div>
          ))}
        </div>
      ))}

      {newItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setNewItem(null)}>
          <div className="bg-white rounded-xl p-6 w-80 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold">{newItem.id ? 'Editar' : 'Nuevo'} producto</h2>
            {[['name','Nombre'],['description','Descripción']].map(([k,l]) => (
              <div key={k}><label className="text-xs text-gray-600">{l}</label>
                <input className="w-full border rounded px-2 py-1 text-sm" value={newItem[k] || ''} onChange={(e) => setNewItem({ ...newItem, [k]: e.target.value })} />
              </div>
            ))}
            <div><label className="text-xs text-gray-600">Precio</label>
              <input type="number" step="0.5" className="w-full border rounded px-2 py-1 text-sm" value={newItem.price || ''} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button onClick={saveItem} className="bg-orange-600 text-white px-4 py-2 rounded text-sm">Guardar</button>
              <button onClick={() => setNewItem(null)} className="text-gray-500 text-sm hover:underline">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
