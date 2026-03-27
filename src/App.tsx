import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  User, 
  Search, 
  Activity, 
  Heart, 
  Thermometer, 
  Bell, 
  Phone, 
  Baby, 
  Stethoscope, 
  UserRound,
  ChevronRight,
  Plus,
  ArrowRight,
  ShieldAlert,
  Video,
  PlayCircle,
  History,
  Award,
  AlertCircle,
  X,
  Star,
  Clock,
  MapPin,
  CheckCircle,
  LogOut,
  LogIn,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICES, PROFESSIONALS, PACKAGES, REVIEWS } from './constants';
import { Service, Professional, Package, HealthMetric, Reminder, Review, ForumPost, RehabLog } from './types';
import { ReminderSection } from './components/Reminders';
import { ForumScreen } from './components/Forum';
import { RehabTracker } from './components/RehabTracker';
import { auth, db, signInWithGoogle, logout, onAuthStateChanged, collection, addDoc, setDoc, doc, handleFirestoreError, OperationType, query, where, onSnapshot } from './firebase';
import { getGeminiResponse } from './services/gemini';

// --- Components ---

const AuthScreen = () => (
  <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-8 space-y-8 text-center">
    <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200">
      <Heart size={48} className="text-white" fill="white" />
    </div>
    <div className="space-y-2">
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">HomeCare Plus</h2>
      <p className="text-slate-500 text-sm">Chăm sóc sức khỏe toàn diện tại nhà</p>
    </div>
    <button 
      onClick={signInWithGoogle}
      className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
      Đăng nhập với Google
    </button>
  </div>
);

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Trang chủ' },
    { id: 'booking', icon: Calendar, label: 'Đặt lịch' },
    { id: 'forum', icon: MessageSquare, label: 'Cộng đồng' },
    { id: 'ai', icon: MessageSquare, label: 'Trợ lý AI' },
    { id: 'profile', icon: User, label: 'Cá nhân' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'
          }`}
        >
          <tab.icon size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

const Header = ({ title, showSOS = true, onSOS }: { title: string, showSOS?: boolean, onSOS?: () => void }) => (
  <header className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center z-40 border-b border-slate-50">
    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
    <div className="flex items-center gap-4">
      <button className="text-slate-400 hover:text-blue-600 transition-colors">
        <Bell size={22} />
      </button>
      {showSOS && (
        <button 
          onClick={onSOS}
          className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse shadow-lg shadow-red-200"
        >
          <Phone size={14} fill="white" />
          SOS
        </button>
      )}
    </div>
  </header>
);

const MetricCard = ({ metric }: { metric: HealthMetric }) => (
  <div className={`p-4 rounded-2xl border ${
    metric.status === 'critical' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
  } shadow-sm transition-all hover:shadow-md`}>
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg ${
        metric.status === 'critical' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
      }`}>
        {metric.icon === 'Activity' && <Activity size={20} />}
        {metric.icon === 'Heart' && <Heart size={20} />}
        {metric.icon === 'Thermometer' && <Thermometer size={20} />}
      </div>
      {metric.status === 'critical' && (
        <ShieldAlert size={16} className="text-red-500 animate-bounce" />
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 font-medium">{metric.label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${
          metric.status === 'critical' ? 'text-red-600' : 'text-slate-900'
        }`}>{metric.value}</span>
        <span className="text-[10px] text-slate-400 uppercase font-bold">{metric.unit}</span>
      </div>
    </div>
  </div>
);

// --- Screens ---

const Dashboard = ({ onBookNow }: { onBookNow: () => void }) => {
  const [user, setUser] = useState(auth.currentUser);
  const metrics: HealthMetric[] = [
    { label: 'Nhịp tim', value: 78, unit: 'BPM', status: 'normal', icon: 'Heart' },
    { label: 'SpO2', value: 94, unit: '%', status: 'critical', icon: 'Activity' },
    { label: 'Nhiệt độ', value: 36.8, unit: '°C', status: 'normal', icon: 'Thermometer' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-24 px-6 pt-4 space-y-8"
    >
      {/* Welcome Banner */}
      <section className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-100">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Chào bạn, {user?.displayName?.split(' ').pop() || 'An'}!</h2>
          <p className="text-blue-100 text-sm mb-6 max-w-[200px]">Hôm nay sức khỏe của bạn thế nào?</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm dịch vụ..." 
              className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-blue-200 focus:outline-none focus:bg-white/20 transition-all"
            />
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      {/* IoT Integration - Vital Signs */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Chỉ số sinh tồn (IoT)</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thời gian thực</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m, i) => (
            <div key={i}>
              <MetricCard metric={m} />
            </div>
          ))}
        </div>
      </section>

      {/* Reminders Section */}
      <ReminderSection />

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={onBookNow}
          className="bg-emerald-500 text-white p-4 rounded-2xl flex flex-col gap-3 shadow-lg shadow-emerald-100 hover:scale-[1.02] transition-transform"
        >
          <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center">
            <Plus size={24} />
          </div>
          <div className="text-left">
            <span className="block text-sm font-bold">Đặt lịch ngay</span>
            <span className="text-[10px] text-emerald-100">Chăm sóc tại nhà</span>
          </div>
        </button>
        <button className="bg-blue-500 text-white p-4 rounded-2xl flex flex-col gap-3 shadow-lg shadow-blue-100 hover:scale-[1.02] transition-transform">
          <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center">
            <Video size={24} />
          </div>
          <div className="text-left">
            <span className="block text-sm font-bold">Tư vấn 24/7</span>
            <span className="text-[10px] text-blue-100">Video call bác sĩ</span>
          </div>
        </button>
      </section>

      {/* Core Services */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Dịch vụ cốt lõi</h3>
          <button className="text-blue-600 text-xs font-bold uppercase tracking-wider">Tất cả</button>
        </div>
        <div className="space-y-3">
          {SERVICES.map((service) => (
            <div 
              key={service.id} 
              className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-200 transition-all cursor-pointer group"
            >
              <div className="bg-slate-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-50 transition-colors">
                {service.icon === 'UserRound' && <UserRound size={24} />}
                {service.icon === 'Activity' && <Activity size={24} />}
                {service.icon === 'Baby' && <Baby size={24} />}
                {service.icon === 'Stethoscope' && <Stethoscope size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{service.description}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const BookingScreen = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [bookingInfo, setBookingInfo] = useState({ date: '', time: '', address: '' });
  const [reviewingPro, setReviewingPro] = useState<Professional | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleAddReview = async () => {
    if (!reviewingPro || !newReview.comment || !auth.currentUser) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    const reviewData = {
      professionalId: reviewingPro.id,
      userName: auth.currentUser.displayName || 'Người dùng',
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString(),
      uid: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'reviews', id), reviewData);
      setReviewingPro(null);
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedPro || !auth.currentUser) return;
    setLoading(true);

    const id = Math.random().toString(36).substr(2, 9);
    const bookingData = {
      uid: auth.currentUser.uid,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      professionalId: selectedPro.id,
      professionalName: selectedPro.name,
      date: bookingInfo.date,
      time: bookingInfo.time,
      address: bookingInfo.address,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'bookings', id), bookingData);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setStep(1);
      setSelectedService(null);
      setSelectedPro(null);
      setBookingInfo({ date: '', time: '', address: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 px-6 pt-4"
    >
      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-600' : 'bg-slate-100'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Chọn dịch vụ</h2>
              <p className="text-sm text-slate-500">Vui lòng chọn loại hình chăm sóc bạn cần</p>
            </div>
            <div className="space-y-3">
              {SERVICES.map(service => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); nextStep(); }}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                    selectedService?.id === service.id ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <div className="bg-slate-50 p-3 rounded-xl text-blue-600">
                    {service.icon === 'UserRound' && <UserRound size={24} />}
                    {service.icon === 'Activity' && <Activity size={24} />}
                    {service.icon === 'Baby' && <Baby size={24} />}
                    {service.icon === 'Stethoscope' && <Stethoscope size={24} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                    <p className="text-[10px] text-slate-500">{service.priceRange}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <button onClick={prevStep} className="text-slate-400 hover:text-blue-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Chọn chuyên viên</h2>
            </div>
            <div className="space-y-4">
              {PROFESSIONALS.map(pro => (
                <div key={pro.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={pro.avatar} alt={pro.name} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900">{pro.name}</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{pro.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-bold text-slate-900">{pro.rating}</span>
                        <span className="text-[10px] text-slate-400 font-medium ml-2">{pro.experience} kinh nghiệm</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setReviewingPro(pro)}
                      className="flex-1 py-2 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50"
                    >
                      Xem đánh giá
                    </button>
                    <button 
                      onClick={() => { setSelectedPro(pro); nextStep(); }}
                      className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-100"
                    >
                      Chọn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <button onClick={prevStep} className="text-slate-400 hover:text-blue-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Thời gian & Địa chỉ</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày hẹn</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date" 
                    value={bookingInfo.date}
                    onChange={(e) => setBookingInfo({ ...bookingInfo, date: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giờ hẹn</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="time" 
                    value={bookingInfo.time}
                    onChange={(e) => setBookingInfo({ ...bookingInfo, time: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa chỉ</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                  <textarea 
                    placeholder="Nhập địa chỉ của bạn..."
                    value={bookingInfo.address}
                    onChange={(e) => setBookingInfo({ ...bookingInfo, address: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  />
                </div>
              </div>
              <button 
                onClick={nextStep}
                disabled={!bookingInfo.date || !bookingInfo.time || !bookingInfo.address}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
              >
                Tiếp tục
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <button onClick={prevStep} className="text-slate-400 hover:text-blue-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Xác nhận</h2>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-50">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                  {selectedService?.icon === 'UserRound' && <UserRound size={24} />}
                  {selectedService?.icon === 'Activity' && <Activity size={24} />}
                  {selectedService?.icon === 'Baby' && <Baby size={24} />}
                  {selectedService?.icon === 'Stethoscope' && <Stethoscope size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedService?.name}</h3>
                  <p className="text-[10px] text-slate-500">{selectedService?.priceRange}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <User size={18} className="text-slate-400" />
                  <span className="text-slate-600">Chuyên viên: <span className="font-bold text-slate-900">{selectedPro?.name}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={18} className="text-slate-400" />
                  <span className="text-slate-600">Ngày: <span className="font-bold text-slate-900">{bookingInfo.date}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={18} className="text-slate-400" />
                  <span className="text-slate-600">Giờ: <span className="font-bold text-slate-900">{bookingInfo.time}</span></span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={18} className="text-slate-400 mt-0.5" />
                  <span className="text-slate-600">Địa chỉ: <span className="font-bold text-slate-900">{bookingInfo.address}</span></span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleConfirmBooking}
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={24} />
                    Xác nhận đặt lịch
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center px-6">
                Bằng cách nhấn xác nhận, bạn đồng ý với điều khoản dịch vụ của HomeCare Plus.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-6 right-6 z-[100] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-emerald-200 flex items-center gap-3"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm">Đặt lịch thành công!</h4>
              <p className="text-[10px] text-emerald-50">Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingPro && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingPro(null)}
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
                  <h3 className="text-xl font-bold text-slate-900">Đánh giá chuyên viên</h3>
                  <button onClick={() => setReviewingPro(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <img src={reviewingPro.avatar} alt={reviewingPro.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900">{reviewingPro.name}</h4>
                    <p className="text-[10px] text-slate-500">{reviewingPro.role}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Xếp hạng của bạn</label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={`transition-transform active:scale-90 ${star <= newReview.rating ? 'text-amber-500' : 'text-slate-200'}`}
                        >
                          <Award size={32} fill={star <= newReview.rating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nhận xét</label>
                    <textarea 
                      placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddReview}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95"
                >
                  Gửi đánh giá
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PricingScreen = () => {
  const [activeTab, setActiveTab] = useState('elderly');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 px-6 pt-4 space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Gói dịch vụ</h2>
        <p className="text-sm text-slate-500">Minh bạch chi phí & Chất lượng chuyên môn</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'elderly', label: 'Người cao tuổi' },
          { id: 'rehab', label: 'PHCN chuyên sâu' },
          { id: 'mother-baby', label: 'Mẹ & Bé' },
          { id: 'telehealth', label: 'AI & Telehealth' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {PACKAGES.filter(p => p.category === activeTab || activeTab === 'elderly').map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{pkg.name}</h3>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{pkg.duration}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-blue-600">{pkg.price.toLocaleString('vi-VN')}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VNĐ / Buổi</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">{pkg.description}</p>
              <div className="space-y-2">
                {pkg.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-3 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ưu đãi Member: -5%</span>
              <button className="text-blue-600 text-xs font-bold flex items-center gap-1">
                Chi tiết <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const AIScreen = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Xin chào! Tôi là Trợ lý Y tế AI. Tôi có thể giúp bạn giải đáp thắc mắc, nhắc lịch uống thuốc hoặc sàng lọc nguy cơ sức khỏe.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const response = await getGeminiResponse(userMessage, history);
      setMessages(prev => [...prev, { role: 'ai', text: response || 'Xin lỗi, tôi không thể trả lời lúc này.' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Đã có lỗi xảy ra khi kết nối với trợ lý AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 px-6 pt-4 flex flex-col h-[calc(100vh-160px)]"
    >
      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`${
              msg.role === 'ai' 
                ? 'bg-blue-50 text-blue-900 rounded-tl-none' 
                : 'bg-white border border-slate-100 text-slate-900 rounded-tr-none ml-auto shadow-sm'
            } p-4 rounded-2xl max-w-[85%] leading-relaxed text-sm`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="bg-blue-50 p-4 rounded-2xl rounded-tl-none max-w-[85%] flex gap-1">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      <div className="mt-4 relative">
        <input 
          type="text" 
          placeholder="Hỏi trợ lý AI..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-95"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const ProfileScreen = ({ onShowRehab }: { onShowRehab: () => void }) => {
  const user = auth.currentUser;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 px-6 pt-4 space-y-8"
    >
      {/* User Info */}
      <div className="flex items-center gap-4">
        <img src={user?.photoURL || "https://picsum.photos/seed/user/200"} alt="User" className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-xl" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">{user?.displayName || 'Người dùng'}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Gold Member</span>
            <span className="text-slate-400 text-[10px] font-bold">1,250 Points</span>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Loyalty Progress */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến trình thăng hạng</span>
          <span className="text-xs font-bold text-slate-900">750 / 2,000 pts</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-[37.5%]" />
        </div>
        <p className="text-[10px] text-slate-500 text-center">Còn 750 điểm nữa để đạt hạng Platinum</p>
      </div>

      {/* Menu Sections */}
      <div className="space-y-6">
        <section>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Hồ sơ sức khỏe (EMR)</h3>
          <div className="space-y-3">
            <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-200 transition-all">
              <History className="text-blue-600" size={20} />
              <span className="flex-1 text-left text-sm font-bold text-slate-900">Lịch sử khám bệnh</span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-200 transition-all">
              <Activity className="text-emerald-600" size={20} />
              <span className="flex-1 text-left text-sm font-bold text-slate-900">Kết quả xét nghiệm</span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tiện ích</h3>
          <div className="space-y-3">
            <button 
              onClick={onShowRehab}
              className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-200 transition-all"
            >
              <PlayCircle className="text-purple-600" size={20} />
              <span className="flex-1 text-left text-sm font-bold text-slate-900">Thư viện & Tiến trình PHCN</span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-200 transition-all">
              <Phone className="text-red-500" size={20} />
              <span className="flex-1 text-left text-sm font-bold text-slate-900">Liên hệ & Hỗ trợ</span>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showRehab, setShowRehab] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Header title="HomeCare Plus" showSOS={false} />
        <main className="max-w-md mx-auto bg-white min-h-[calc(100vh-140px)] shadow-2xl shadow-slate-200/50">
          <AuthScreen />
        </main>
      </div>
    );
  }

  const renderScreen = () => {
    if (showRehab) return <RehabTracker onBack={() => setShowRehab(false)} />;

    switch (activeTab) {
      case 'home': return <Dashboard onBookNow={() => setActiveTab('booking')} />;
      case 'booking': return <BookingScreen />;
      case 'forum': return <ForumScreen />;
      case 'ai': return <AIScreen />;
      case 'profile': return <ProfileScreen onShowRehab={() => setShowRehab(true)} />;
      default: return <Dashboard onBookNow={() => setActiveTab('booking')} />;
    }
  };

  const getTitle = () => {
    if (showRehab) return 'Tiến trình PHCN';

    switch (activeTab) {
      case 'home': return 'HomeCare Plus';
      case 'booking': return 'Đặt lịch dịch vụ';
      case 'forum': return 'Cộng đồng';
      case 'ai': return 'Trợ lý Y tế AI';
      case 'profile': return 'Hồ sơ của bạn';
      default: return 'HomeCare Plus';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <Header title={getTitle()} onSOS={() => setShowSOSModal(true)} />
      
      <main className="max-w-md mx-auto bg-white min-h-[calc(100vh-140px)] shadow-2xl shadow-slate-200/50">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOSModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSOSModal(false)}
              className="absolute inset-0 bg-red-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden text-center p-8 space-y-6"
            >
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Phone size={48} fill="currentColor" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Khẩn cấp!</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn kích hoạt cuộc gọi khẩn cấp? Chuyên viên y tế gần nhất sẽ được thông báo ngay lập tức.
                </p>
              </div>
              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => {
                    alert('Đang kết nối với trung tâm cấp cứu...');
                    setShowSOSModal(false);
                  }}
                  className="w-full bg-red-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-red-200 active:scale-95 transition-transform"
                >
                  GỌI NGAY (115)
                </button>
                <button 
                  onClick={() => setShowSOSModal(false)}
                  className="w-full py-4 text-slate-400 font-bold text-sm"
                >
                  Hủy bỏ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

