/**
 * Nomes das filas BullMQ.
 *
 * Spec Fase 4 §7 — duas filas principais:
 *
 * - MOTOR_RECALC: jobs por usuario que recalculam o motor. Concorrencia
 *   por usuario garantida via `groupId={userId}` no enqueue (BullMQ
 *   group concurrency, 1 por grupo).
 * - MOTOR_SCHEDULED: jobs periodicos (notificacoes, projecoes, snapshots,
 *   refresh de tabelas de referencia). Schedulers BullMQ adicionam jobs
 *   recorrentes nesta fila.
 */
export const MOTOR_RECALC_QUEUE = "motor-recalc";
export const MOTOR_SCHEDULED_QUEUE = "motor-scheduled";

export const ALL_QUEUES = [MOTOR_RECALC_QUEUE, MOTOR_SCHEDULED_QUEUE] as const;
export type QueueName = (typeof ALL_QUEUES)[number];
