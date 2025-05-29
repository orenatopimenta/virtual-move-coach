import { supabase } from './supabaseClient';

/**
 * Salva um treino completo no Supabase.
 * @param userId ID do usuário
 * @param totalTime Tempo total do treino (em minutos)
 * @param xp Pontos de experiência ganhos
 * @param exercises Array de exercícios, cada um com séries, repetições e métricas
 * Estrutura esperada:
 * exercises = [
 *   {
 *     name: 'Agachamento',
 *     sets: [
 *       {
 *         seriesNumber: 1,
 *         repetitions: 12,
 *         completed: true,
 *         metrics: [
 *           { repetitionNumber: 1, quality: 'boa', duration_seconds: 3, extra_data: {} },
 *           ...
 *         ]
 *       },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 */
export async function saveWorkoutToSupabase({ userId, totalTime, xp, exercises }: {
  userId: string,
  totalTime: number,
  xp: number,
  exercises: Array<{
    name: string,
    modelo?: string,
    carga?: number,
    sets: Array<{
      seriesNumber: number,
      repetitions: number,
      completed: boolean,
      metrics: Array<{
        repetitionNumber: number,
        quality: string,
        duration_seconds: number,
        extra_data?: any
      }>
    }>
  }>
}) {
  // 1. Cria o histórico do treino
  const { data: workout, error: workoutError } = await supabase
    .from('workout_history')
    .insert({ user_id: userId, total_time: totalTime, xp })
    .select()
    .single();
  if (workoutError) throw workoutError;

  // 2. Para cada exercício e série, cria os sets e métricas
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      const { data: workoutSet, error: setError } = await supabase
        .from('workout_sets')
        .insert({
          workout_id: workout.id,
          exercise_name: exercise.name,
          modelo: exercise.modelo || null,
          carga: exercise.carga ?? null,
          series_number: set.seriesNumber,
          repetitions: set.repetitions,
          completed: set.completed
        })
        .select()
        .single();
      if (setError) throw setError;

      // 3. Para cada repetição, cria a métrica
      for (const metric of set.metrics) {
        const { error: metricError } = await supabase
          .from('workout_metrics')
          .insert({
            set_id: workoutSet.id,
            repetition_number: metric.repetitionNumber,
            quality: metric.quality,
            duration_seconds: metric.duration_seconds,
            extra_data: metric.extra_data || null
          });
        if (metricError) throw metricError;
      }
    }
  }
  return true;
} 