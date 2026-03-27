import React, { useState, useEffect } from 'react';
import { Activity, Clock, RotateCcw, FileText, Smile, Meh, Frown, Plus, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, auth, collection, query, where, onSnapshot, setDoc, doc, handleFirestoreError, OperationType, orderBy } from '../firebase';
import { RehabLog } from '../types';

export const RehabTracker = ({ onBack }: { onBack: () => void }) => {
  const [logs, setLogs] = useState<RehabLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLog, setNewLog] = useState<Partial<RehabLog>>({
    mood: 'good',
    duration: 15,
    reps: 3
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'rehab_logs'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RehabLog[];
      setLogs(logList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rehab_logs');
    });

    return () => unsubscribe();
  }, []);

  const chartData = [...logs].reverse().map(log => ({
    date: log.date.split('-')[2] + '/' + log.date.split('-')[1],
    duration: log.duration,
    reps: log.reps
  }));

  const handleAddLog = async () => {
    if (!newLog.exerciseName || !auth.currentUser) return;

    const id = Math.random().toString(36).substr(2, 9);
    const logData = {
      uid: auth.currentUser.uid,
      exerciseName: newLog.exerciseName,
      duration: newLog.duration || 15,
      reps: newLog.reps || 3,
      notes: newLog.notes || '',
      mood: newLog.mood as any,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'rehab_logs', id), logData);
      setShowForm(false);
      setNewLog({ mood: 'good', duration: 15, reps: 3 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rehab_logs');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 px-6 pt-4 space-y-8"
    >
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-blue-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Tiến trình PHCN</h2>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thời gian tập luyện (Phút)</h3>
        <div className="h-48 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="duration" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              Chưa có dữ liệu biểu đồ
            </div>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Lịch sử tập luyện</h3>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-100 transition-transform active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-400">Chưa có nhật ký tập luyện</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                <div className={`p-3 rounded-xl flex items-center justify-center ${
                  log.mood === 'good' ? 'bg-emerald-50 text-emerald-600' :
                  log.mood === 'neutral' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                }`}>
                  {log.mood === 'good' ? <Smile size={24} /> : log.mood === 'neutral' ? <Meh size={24} /> : <Frown size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900">{log.exerciseName}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(log.date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={12} />
                      {log.duration} phút
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <RotateCcw size={12} />
                      {log.reps} hiệp
                    </div>
                  </div>
                  {log.notes && (
                    <p className="text-[10px] text-slate-400 mt-2 italic">"{log.notes}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
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
                  <h3 className="text-xl font-bold text-slate-900">Ghi nhật ký tập luyện</h3>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tên bài tập</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Tập đi bộ, Co duỗi tay..."
                      value={newLog.exerciseName || ''}
                      onChange={(e) => setNewLog({ ...newLog, exerciseName: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Thời gian (phút)</label>
                      <input 
                        type="number" 
                        value={newLog.duration}
                        onChange={(e) => setNewLog({ ...newLog, duration: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Số hiệp</label>
                      <input 
                        type="number" 
                        value={newLog.reps}
                        onChange={(e) => setNewLog({ ...newLog, reps: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tâm trạng</label>
                    <div className="flex gap-4">
                      {[
                        { id: 'good', icon: Smile, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { id: 'neutral', icon: Meh, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { id: 'bad', icon: Frown, color: 'text-red-600', bg: 'bg-red-50' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setNewLog({ ...newLog, mood: m.id as any })}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            newLog.mood === m.id ? 'border-blue-600 bg-blue-50' : 'border-transparent bg-slate-50'
                          }`}
                        >
                          <m.icon size={24} className={m.color} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ghi chú</label>
                    <textarea 
                      placeholder="Cảm nhận sau khi tập..."
                      value={newLog.notes || ''}
                      onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddLog}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95"
                >
                  Lưu nhật ký
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
