'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { usePilatesAuth } from '@/hooks/usePilatesAuth';

export default function ProfessorDashboard() {
  const { loading: authLoading } = usePilatesAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: classesData } = await supabase
            .from('classes_pilates')
            .select('*')
            .eq('professor_id', session.user.id)
            .limit(10);

          setClasses(classesData || []);
        }
      } catch (err) {
        console.error('[ERROR]:', err);
      }
      setLoading(false);
    };

    if (!authLoading) fetchData();
  }, [authLoading, supabase]);

  if (authLoading || loading) return <div className="flex items-center justify-center h-screen"><div>Loading...</div></div>;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-50">
      <h1 className="text-2xl font-bold mb-6">👨‍🏫 Meu Dashboard</h1>
      <h2 className="text-xl mb-4">Minhas Turmas: {classes.length}</h2>
      <div className="grid gap-4">
        {classes.map((c) => (
          <div key={c.id} className="bg-gray-800 p-4 rounded">
            <p className="font-bold">{c.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
