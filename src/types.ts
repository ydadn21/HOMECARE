export type ServiceCategory = 'elderly' | 'rehab' | 'mother-baby' | 'post-op' | 'telehealth';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  priceRange: string;
  icon: string;
}

export interface Professional {
  id: string;
  name: string;
  role: 'Doctor' | 'Nurse' | 'Physiotherapist';
  specialty: string;
  rating: number;
  experience: string;
  avatar: string;
}

export interface Package {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: string;
  features: string[];
  description: string;
}

export interface HealthMetric {
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
}

export interface Reminder {
  id: string;
  type: 'medication' | 'appointment' | 'follow-up';
  title: string;
  time: string;
  frequency: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  professionalId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ForumPost {
  id: string;
  category: 'rehab' | 'elderly' | 'mother-baby' | 'general';
  title: string;
  author: string;
  content: string;
  likes: number;
  replies: number;
  date: string;
}

export interface RehabLog {
  id: string;
  date: string;
  exerciseName: string;
  duration: number; // minutes
  reps: number;
  notes: string;
  mood: 'good' | 'neutral' | 'bad';
}
