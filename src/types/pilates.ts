export interface PilatesUser {
  id: string;
  role: 'admin' | 'professor' | 'aluno' | 'fisioterapeuta' | 'prof_fisio' | 'prof_edfisica';
  plan_id?: number | null;
  status: 'ativo' | 'inativo' | 'inadimplente';
  phone?: string | null;
  full_name?: string | null;
  email?: string | null;
  monthly_value?: number | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  pay_mode?: string | null;   // professor: per_class | per_day | percent | fixed
  pay_rate?: number | null;   // valor por aula/dia, % do aluno, ou fixo mensal
  created_at: string;
  updated_at?: string;
}

export interface PilatesPlan {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  classes_per_week: number;
  is_active: boolean;
  stripe_price_id?: string | null;
  created_at?: string;
}

export interface PilatesClass {
  id: number;
  professor_id: string;
  name: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
  capacity: number;
  is_active: boolean;
  created_at?: string;
  enrolled_count?: number;
}

export interface PilatesEnrollment {
  id: number;
  user_id: string;
  class_id: number;
  enrollment_date: string;
  is_active: boolean;
  created_at?: string;
  class?: PilatesClass;
}

export interface PilatesAttendance {
  id: number;
  user_id: string;
  class_id: number;
  attendance_date: string;
  status: 'present' | 'absent' | 'canceled_in_advance' | 'replacement';
  notes?: string | null;
  created_at?: string;
  class?: PilatesClass;
}

export interface PilatesPhysicalEvaluation {
  id: number;
  user_id: string;
  evaluation_date: string;
  weight?: number | null;
  height?: number | null;
  measurements?: Record<string, number> | null;
  postural_notes?: string | null;
  image_url?: string | null;
  created_at?: string;
}

export interface DashboardStats {
  total_alunos: number;
  faturamento_mes: number;
  inadimplentes: number;
  turmas_ativas: number;
}

export interface PhysicalTherapySession {
  id: number;
  user_id: string;
  therapist_id?: string | null;
  session_date: string;
  session_time?: string | null;
  therapy_type?: string | null;
  duration_minutes?: number | null;
  cost?: number | null;
  discount?: number | null;
  paid?: boolean | null;
  payment_method?: string | null;
  status: 'scheduled' | 'completed' | 'canceled';
  notes?: string | null;
  created_at?: string;
  // joined
  aluno?: { full_name?: string | null; email?: string | null } | null;
  therapist?: { full_name?: string | null; email?: string | null } | null;
}
