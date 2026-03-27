import React, { useState, useEffect } from 'react';
import { Bell, Plus, Clock, CheckCircle2, Circle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, collection, query, where, onSnapshot, setDoc, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from '../firebase';
import { Reminder } from '../types';

export const ReminderSection = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    type: 'medication',
    time: '08:00',
    frequency: 'Hàng ngày',
    isActive: true
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setReminders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'reminders'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reminderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      setReminders(reminderList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reminders');
    });

    return () => unsubscribe();
  }, []);

  const toggleReminder = async (id: string, currentStatus: boolean) => {
    try {
      const reminderRef = doc(db, 'reminders', id);
      await updateDoc(reminderRef, { isActive: !currentStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reminders/${id}`);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !auth.currentUser) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    const reminderData = {
      uid: auth.currentUser.uid,
      title: newReminder.title,
      type: newReminder.type as any,
      time: newReminder.time || '08:00',
      frequency: newReminder.frequency || 'Hàng ngày',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'reminders', id), reminderData);
      setShowAddModal(false);
      setNewReminder({
        type: 'medication',
        time: '08:00',
        frequency: 'Hàng ngày',
        isActive: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reminders');
    }
  };

  if (!auth.currentUser) return null;

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Lời nhắc của bạn</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-blue-600 p-1 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400 font-medium">Chưa có lời nhắc nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div 
              key={reminder.id}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                reminder.isActive ? 'bg-white border-slate-100' : 'bg-slate-50 border-transparent opacity-60'
              }`}
            >
              <div className={`p-2 rounded-xl ${
                reminder.type === 'medication' ? 'bg-purple-50 text-purple-600' :
                reminder.type === 'appointment' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">{reminder.title}</h4>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  <span>{reminder.time}</span>
                  <span>•</span>
                  <span>{reminder.frequency}</span>
                </div>
              </div>
              <button 
                onClick={() => toggleReminder(reminder.id, reminder.isActive)}
                className={`transition-colors ${reminder.isActive ? 'text-blue-600' : 'text-slate-300'}`}
              >
                {reminder.isActive ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Thêm lời nhắc mới</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tên lời nhắc</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Uống thuốc huyết áp"
                      value={newReminder.title || ''}
                      onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Loại</label>
                      <select 
                        value={newReminder.type}
                        onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value as any })}
                        className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="medication">Thuốc</option>
                        <option value="appointment">Lịch hẹn</option>
                        <option value="follow-up">Theo dõi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Thời gian</label>
                      <input 
                        type="time" 
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tần suất</label>
                    <select 
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Hàng ngày">Hàng ngày</option>
                      <option value="Cách ngày">Cách ngày</option>
                      <option value="Hàng tuần">Hàng tuần</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAddReminder}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95"
                >
                  Lưu lời nhắc
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
