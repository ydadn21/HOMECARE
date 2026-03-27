import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ThumbsUp, ChevronRight, Filter, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, collection, query, onSnapshot, setDoc, doc, updateDoc, handleFirestoreError, OperationType, orderBy } from '../firebase';
import { ForumPost } from '../types';

export const ForumScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ForumPost['category']>('all');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPost, setNewPost] = useState<Partial<ForumPost>>({
    category: 'general'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'forum_posts'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumPost[];
      setPosts(postList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forum_posts');
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'rehab', label: 'PHCN Đột quỵ' },
    { id: 'elderly', label: 'Người cao tuổi' },
    { id: 'mother-baby', label: 'Mẹ & Bé' },
    { id: 'general', label: 'Sức khỏe chung' },
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content || !auth.currentUser) return;

    const id = Math.random().toString(36).substr(2, 9);
    const postData = {
      uid: auth.currentUser.uid,
      title: newPost.title,
      content: newPost.content,
      category: newPost.category as any,
      author: auth.currentUser.displayName || 'Người dùng',
      date: new Date().toISOString(),
      likes: 0,
      replies: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'forum_posts', id), postData);
      setShowAddModal(false);
      setNewPost({ category: 'general' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'forum_posts');
    }
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    if (!auth.currentUser) return;
    try {
      const postRef = doc(db, 'forum_posts', postId);
      await updateDoc(postRef, { likes: currentLikes + 1 });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forum_posts/${postId}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 px-6 pt-4 space-y-6"
    >
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Diễn đàn cộng đồng</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm chủ đề..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeCategory === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                  {post.category}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(post.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 leading-tight">{post.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{post.content}</p>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-400">Bởi {post.author}</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(post.id, post.likes)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <ThumbsUp size={14} />
                    <span className="text-[10px] font-bold">{post.likes}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MessageSquare size={14} />
                    <span className="text-[10px] font-bold">{post.replies}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-400">Không tìm thấy bài viết nào</p>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-200 hover:scale-110 transition-transform"
      >
        <Plus size={24} />
      </button>

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
                  <h3 className="text-xl font-bold text-slate-900">Tạo bài viết mới</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Chủ đề</label>
                    <select 
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value as any })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tiêu đề</label>
                    <input 
                      type="text" 
                      placeholder="Nhập tiêu đề bài viết..."
                      value={newPost.title || ''}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nội dung</label>
                    <textarea 
                      placeholder="Chia sẻ câu chuyện hoặc thắc mắc của bạn..."
                      value={newPost.content || ''}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddPost}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95"
                >
                  Đăng bài
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
