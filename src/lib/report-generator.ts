import { getSupabaseBrowserClient } from './supabase-browser';

export async function generateStudentReport(studentId: string, format: 'pdf' | 'excel') {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data: student } = await supabase
      .from('users_pilates')
      .select('*')
      .eq('id', studentId)
      .single();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 24);

    const { data: payments } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', studentId)
      .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('payment_date', { ascending: false });

    const { data: therapy } = await supabase
      .from('physical_therapy_sessions')
      .select('*')
      .eq('user_id', studentId)
      .gte('session_date', sixMonthsAgo.toISOString().split('T')[0]);

    const reportData = {
      student,
      payments,
      therapy,
      generatedAt: new Date(),
    };

    console.log('Relatório gerado:', reportData);
    return reportData;
  } catch (err) {
    console.error('Erro ao gerar relatório:', err);
    throw err;
  }
}
