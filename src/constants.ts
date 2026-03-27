import { Service, Professional, Package, Reminder, Review, ForumPost, RehabLog } from './types';

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'Chăm sóc người cao tuổi',
    category: 'elderly',
    description: 'Hỗ trợ sinh hoạt, tắm rửa, tập vận động nhẹ tại nhà.',
    priceRange: '500.000 - 700.000 VNĐ',
    icon: 'UserRound'
  },
  {
    id: '2',
    name: 'Phục hồi chức năng',
    category: 'rehab',
    description: 'PHCN sau đột quỵ, vận động trị liệu chuyên sâu.',
    priceRange: '600.000 - 900.000 VNĐ',
    icon: 'Activity'
  },
  {
    id: '3',
    name: 'Chăm sóc Mẹ & Bé',
    category: 'mother-baby',
    description: 'Tắm bé, massage, chăm sóc mẹ sau sinh.',
    priceRange: '400.000 - 600.000 VNĐ',
    icon: 'Baby'
  },
  {
    id: '4',
    name: 'Chăm sóc hậu phẫu',
    category: 'post-op',
    description: 'Thay băng, cắt chỉ, theo dõi biến chứng mổ.',
    priceRange: '500.000 - 800.000 VNĐ',
    icon: 'Stethoscope'
  }
];

export const PROFESSIONALS: Professional[] = [
  {
    id: 'p1',
    name: 'BS. Nguyễn Văn An',
    role: 'Doctor',
    specialty: 'Nội khoa & Lão khoa',
    rating: 4.9,
    experience: '15 năm',
    avatar: 'https://picsum.photos/seed/doc1/200'
  },
  {
    id: 'p2',
    name: 'ĐD. Trần Thị Mai',
    role: 'Nurse',
    specialty: 'Chăm sóc hậu phẫu',
    rating: 4.8,
    experience: '8 năm',
    avatar: 'https://picsum.photos/seed/nurse1/200'
  },
  {
    id: 'p3',
    name: 'KTV. Lê Hoàng Nam',
    role: 'Physiotherapist',
    specialty: 'PHCN Đột quỵ',
    rating: 5.0,
    experience: '10 năm',
    avatar: 'https://picsum.photos/seed/physio1/200'
  }
];

export const PACKAGES: Package[] = [
  {
    id: 'pkg1',
    name: 'Gói Chăm Sóc Theo Giờ',
    category: 'elderly',
    price: 600000,
    duration: '60 - 120 phút',
    description: 'Hỗ trợ sinh hoạt, vệ sinh cá nhân, tập vận động nhẹ.',
    features: ['Vệ sinh cá nhân', 'Tập vận động nhẹ', 'Theo dõi dấu hiệu sinh tồn']
  },
  {
    id: 'pkg2',
    name: 'Gói PHCN Đột Quỵ',
    category: 'rehab',
    price: 850000,
    duration: '90 phút',
    description: 'Vận động trị liệu, ngôn ngữ trị liệu chuyên sâu.',
    features: ['Vận động trị liệu', 'Ngôn ngữ trị liệu', 'PHCN hô hấp']
  }
];

export const REMINDERS: Reminder[] = [
  { id: 'rem1', type: 'medication', title: 'Uống thuốc huyết áp', time: '08:00', frequency: 'Hàng ngày', isActive: true },
  { id: 'rem2', type: 'appointment', title: 'Tái khám Bệnh viện Bạch Mai', time: '14:30', frequency: '20/03/2026', isActive: true },
  { id: 'rem3', type: 'follow-up', title: 'Tập vật lý trị liệu', time: '10:00', frequency: 'Thứ 2, 4, 6', isActive: false },
];

export const REVIEWS: Review[] = [
  { id: 'rev1', professionalId: 'p1', userName: 'Trần Văn B', rating: 5, comment: 'Bác sĩ rất tận tâm, giải thích kỹ càng.', date: '15/03/2026' },
  { id: 'rev2', professionalId: 'p3', userName: 'Lê Thị C', rating: 4, comment: 'Kỹ thuật viên nhiệt tình, bài tập hiệu quả.', date: '10/03/2026' },
];

export const FORUM_POSTS: ForumPost[] = [
  { id: 'fp1', category: 'rehab', title: 'Kinh nghiệm phục hồi sau đột quỵ', author: 'Minh Hoàng', content: 'Chào mọi người, bố mình vừa xuất viện...', likes: 24, replies: 12, date: '18/03/2026' },
  { id: 'fp2', category: 'elderly', title: 'Chế độ dinh dưỡng cho người cao tuổi', author: 'Thu Hà', content: 'Mọi người thường cho ông bà ăn gì vào buổi sáng?', likes: 15, replies: 8, date: '17/03/2026' },
  { id: 'fp3', category: 'mother-baby', title: 'Lưu ý khi tắm bé sơ sinh tại nhà', author: 'Ngọc Anh', content: 'Mình mới sinh bé đầu lòng, còn nhiều bỡ ngỡ...', likes: 42, replies: 25, date: '19/03/2026' },
];

export const REHAB_LOGS: RehabLog[] = [
  { id: 'log1', date: '2026-03-18', exerciseName: 'Tập đi bộ', duration: 20, reps: 1, notes: 'Hơi mỏi chân nhưng cảm thấy khỏe hơn.', mood: 'good' },
  { id: 'log2', date: '2026-03-17', exerciseName: 'Vận động tay', duration: 15, reps: 3, notes: 'Cần cố gắng hơn ở các khớp ngón tay.', mood: 'neutral' },
  { id: 'log3', date: '2026-03-16', exerciseName: 'Tập thở', duration: 10, reps: 5, notes: 'Thở đều, không còn hụt hơi.', mood: 'good' },
];
