/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Edit3, 
  Mic, 
  Clock, 
  Save,
  Calendar,
  ShoppingBag,
  FileText,
  X,
  ChevronLeft,
  LayoutGrid,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface ShoppingItem {
  id: string;
  name: string;
  isPurchased: boolean;
  purchasedAt?: string;
}

interface ShoppingGroup {
  id: string;
  title: string;
  createdAt: string;
  items: ShoppingItem[];
}

export default function App() {
  const [groups, setGroups] = useState<ShoppingGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [itemFilter, setItemFilter] = useState<'all' | 'purchased' | 'pending'>('all');
  const [isListening, setIsListening] = useState(false);
  
  // Group Form State
  const [groupTitle, setGroupTitle] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Item Form State
  const [itemName, setItemName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    const savedGroups = localStorage.getItem('list_team_groups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('list_team_groups', JSON.stringify(groups));
  }, [groups]);

  // Add/Edit Group
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;

    if (editingGroupId) {
      setGroups(groups.map(g => 
        g.id === editingGroupId ? { ...g, title: groupTitle } : g
      ));
      setEditingGroupId(null);
    } else {
      const newGroup: ShoppingGroup = {
        id: crypto.randomUUID(),
        title: groupTitle,
        createdAt: new Date().toISOString(),
        items: []
      };
      setGroups([newGroup, ...groups]);
    }
    setGroupTitle('');
  };

  // Delete Group
  const deleteGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('আপনি কি এই গ্রুপটি মুছতে চান?')) {
      setGroups(groups.filter(g => g.id !== id));
      if (activeGroupId === id) setActiveGroupId(null);
    }
  };

  // Add/Edit Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !activeGroupId) return;

    setGroups(groups.map(group => {
      if (group.id === activeGroupId) {
        if (editingItemId) {
          return {
            ...group,
            items: group.items.map(item => 
              item.id === editingItemId ? { ...item, name: itemName } : item
            )
          };
        } else {
          const newItem: ShoppingItem = {
            id: crypto.randomUUID(),
            name: itemName,
            isPurchased: false
          };
          return {
            ...group,
            items: [newItem, ...group.items]
          };
        }
      }
      return group;
    }));

    setItemName('');
    setEditingItemId(null);
  };

  // Toggle Item Purchase
  const togglePurchase = (groupId: string, itemId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.map(item => {
            if (item.id === itemId) {
              const isPurchasing = !item.isPurchased;
              if (isPurchasing) {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ['#4F46E5', '#9333EA', '#DB2777']
                });
              }
              return { 
                ...item, 
                isPurchased: isPurchasing,
                purchasedAt: isPurchasing ? new Date().toISOString() : undefined
              };
            }
            return item;
          })
        };
      }
      return group;
    }));
  };

  // Delete Item
  const deleteItem = (groupId: string, itemId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          items: group.items.filter(item => item.id !== itemId)
        };
      }
      return group;
    }));
  };

  // Voice Input
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('ভয়েস ইনপুট সাপোর্ট করে না।');
      return;
    }
    // @ts-ignore
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (activeGroupId) {
        setItemName(transcript);
      } else {
        setGroupTitle(transcript);
      }
    };
    recognition.start();
  };

  const activeGroup = useMemo(() => 
    groups.find(g => g.id === activeGroupId), 
  [groups, activeGroupId]);

  const filteredItems = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.items.filter(item => {
      if (itemFilter === 'all') return true;
      if (itemFilter === 'purchased') return item.isPurchased;
      if (itemFilter === 'pending') return !item.isPurchased;
      return true;
    });
  }, [activeGroup, itemFilter]);

  // Stats for active group
  const activeGroupStats = useMemo(() => {
    if (!activeGroup) return { total: 0, purchased: 0 };
    return {
      total: activeGroup.items.length,
      purchased: activeGroup.items.filter(i => i.isPurchased).length
    };
  }, [activeGroup]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100/40 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-violet-100/30 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-fuchsia-100/30 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="glass border-b border-slate-200/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeGroupId && (
              <button 
                onClick={() => setActiveGroupId(null)}
                className="p-2 -ml-2 hover:bg-white/50 rounded-full transition-all active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <ShoppingBag className="text-white w-5.5 h-5.5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                List.team
              </h1>
            </div>
          </div>
          
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
            Smart Shopping Assistant
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!activeGroupId ? (
            /* Group List View */
            <motion.div 
              key="group-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black font-display flex items-center gap-3 text-slate-800">
                    <LayoutGrid className="w-8 h-8 text-indigo-600" />
                    আমার লিস্ট গ্রুপ
                  </h2>
                  <p className="text-slate-500 font-medium">আপনার কেনাকাটার তালিকাগুলো সুন্দরভাবে সাজিয়ে রাখুন</p>
                </div>
                
                <form onSubmit={handleAddGroup} className="relative flex gap-3">
                  <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      placeholder="নতুন গ্রুপের নাম (যেমন: সাপ্তাহিক বাজার)..."
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium shadow-sm group-hover:border-indigo-200"
                    />
                    <button 
                      type="button"
                      onClick={startVoiceInput}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all",
                        isListening ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      )}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    type="submit"
                    className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 ring-1 ring-white/10"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="hidden sm:inline">তৈরি করুন</span>
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.length === 0 ? (
                  <div className="col-span-full py-24 text-center glass rounded-[40px] border-dashed border-2 border-slate-200">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <LayoutGrid className="w-12 h-12 text-indigo-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">কোনো গ্রুপ নেই</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto">উপরের বক্সে নাম লিখে আপনার প্রথম শপিং লিস্ট গ্রুপটি তৈরি করুন।</p>
                  </div>
                ) : (
                  groups.map(group => {
                    const total = group.items.length;
                    const purchased = group.items.filter(i => i.isPurchased).length;
                    const progress = total === 0 ? 0 : (purchased / total) * 100;
                    
                    return (
                      <motion.div 
                        key={group.id}
                        layout
                        onClick={() => setActiveGroupId(group.id)}
                        className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        {/* Progress Background Overlay */}
                        <div 
                          className="absolute bottom-0 left-0 h-1.5 bg-indigo-600/10 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />

                        <div className="flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1">
                              <h3 className="font-black text-xl text-slate-800 font-display line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {group.title}
                              </h3>
                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400/70" />
                                {new Date(group.createdAt).toLocaleDateString('bn-BD')}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-400/70" />
                                {new Date(group.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            </div>
                            <button 
                              onClick={(e) => deleteGroup(group.id, e)}
                              className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="mt-6">
                            <div className="flex items-center justify-between text-xs font-black mb-2.5">
                              <span className="text-slate-400 uppercase tracking-wider">অগ্রগতি</span>
                              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{purchased}/{total}</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-1000"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : (
            /* Item List View (Inside Group) */
            <motion.div 
              key="item-list"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-8"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black font-display text-slate-800">{activeGroup?.title}</h2>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {activeGroup && new Date(activeGroup.createdAt).toLocaleDateString('bn-BD')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {activeGroup && new Date(activeGroup.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[100px]">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-violet-600">
                      {activeGroupStats.purchased}/{activeGroupStats.total}
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">আইটেম কেনা</div>
                  </div>
                </div>

                <form onSubmit={handleAddItem} className="relative flex gap-3">
                  <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      placeholder="আইটেমের নাম লিখুন..."
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium shadow-sm group-hover:border-indigo-200"
                    />
                    <button 
                      type="button"
                      onClick={startVoiceInput}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all",
                        isListening ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      )}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    type="submit"
                    className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 ring-1 ring-white/10"
                  >
                    {editingItemId ? <Save className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    <span className="hidden sm:inline">{editingItemId ? 'আপডেট' : 'যোগ করুন'}</span>
                  </button>
                </form>

                {/* Item Filters */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { id: 'all', label: 'সব আইটেম', icon: FileText },
                    { id: 'purchased', label: 'কেনা হয়েছে', icon: CheckCircle2 },
                    { id: 'pending', label: 'বাকি আছে', icon: Clock },
                  ].map((f) => (
                    <button 
                      key={f.id}
                      onClick={() => setItemFilter(f.id as any)}
                      className={cn(
                        "flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all whitespace-nowrap border-2",
                        itemFilter === f.id 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                          : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600"
                      )}
                    >
                      <f.icon className="w-4 h-4" />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredItems.length === 0 ? (
                    <div className="py-24 text-center glass rounded-[40px] border-dashed border-2 border-slate-200">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ListTodo className="w-12 h-12 text-slate-200" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">কোনো আইটেম নেই</h3>
                      <p className="text-slate-400 font-medium max-w-xs mx-auto">
                        {itemFilter === 'all' ? 'এই লিস্টে এখনো কোনো আইটেম যোগ করা হয়নি।' : 
                         itemFilter === 'purchased' ? 'এখনো কোনো আইটেম কেনা হয়নি। কেনা হলে টিক চিহ্ন দিন।' : 
                         'অভিনন্দন! আপনার সব আইটেম কেনা হয়ে গেছে।'}
                      </p>
                    </div>
                  ) : (
                    filteredItems.map(item => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "bg-white p-5 rounded-[24px] border border-slate-200 flex items-center justify-between group transition-all hover:shadow-md hover:border-indigo-100",
                          item.isPurchased && "bg-slate-50/50 border-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-5 flex-1">
                          <button 
                            onClick={() => togglePurchase(activeGroupId!, item.id)}
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90",
                              item.isPurchased 
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                                : "bg-slate-50 border-2 border-slate-200 text-transparent hover:border-indigo-500 hover:bg-indigo-50"
                            )}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-bold text-lg text-slate-700 transition-all",
                              item.isPurchased && "line-through text-slate-400"
                            )}>
                              {item.name}
                            </span>
                            {item.isPurchased && item.purchasedAt && (
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" />
                                কেনা: {new Date(item.purchasedAt).toLocaleDateString('bn-BD')} • {new Date(item.purchasedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => {
                              setEditingItemId(item.id);
                              setItemName(item.name);
                            }}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteItem(activeGroupId!, item.id)}
                            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200/50 glass">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left space-y-2">
            <div className="text-3xl font-black font-display bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">List.team</div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 Smart Shopping Assistant • Crafted for Clarity</p>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট গ্রুপ</span>
              <span className="text-3xl font-black text-slate-800 font-display">{groups.length}</span>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট আইটেম</span>
              <span className="text-3xl font-black text-slate-800 font-display">
                {groups.reduce((acc, g) => acc + g.items.length, 0)}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
