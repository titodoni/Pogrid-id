'use client';

import { useActionState, useCallback, useEffect, useOptimistic, useRef, useState } from 'react';

import type { ItemWithRelations } from '../types';
import type { ItemStatus } from '@/lib/types';

import { updateProgressAction, approveDrawingAction, requestRedrawAction, updatePurchasingProgressAction, submitQCResultAction, confirmDeliveryAction } from '../actions';

type UpdatePanelProps = {
  item: ItemWithRelations;
  role: string;
  deptName: string | null;
  departmentId: string | null;
  onClose: () => void;
  onReportProblem: () => void;
};

export default function UpdatePanel({ item, role, deptName, departmentId, onClose, onReportProblem }: UpdatePanelProps) {
  const [showCancelToast, setShowCancelToast] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // useOptimistic for progress updates
  const [optimisticProgress, setOptimisticProgress] = useOptimistic(
    item.progresses.find((p) => p.departmentId === departmentId)?.progress || 0,
    (state, newProgress: number) => newProgress
  );

  const isAdmin = role === 'ADMIN';
  const isOperator = role.startsWith('OPERATOR_');

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCancelWindow() {
    setShowCancelToast(true);
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowCancelToast(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelUpdate() {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowCancelToast(false);
    setCountdown(5);
    // Revert optimistic update
    setOptimisticProgress(item.progresses.find((p) => p.departmentId === departmentId)?.progress || 0);
  }

  // Handle Operator Progress Save
  function handleOperatorSave(formData: FormData) {
    if (!departmentId) return;
    const progress = Number(formData.get('progress'));
    setOptimisticProgress(progress);
    startCancelWindow();
    // Actual server action will be called after 5s window
    setTimeout(() => {
      updateProgressAction(formData);
    }, 5000);
  }

  return (
    <div className="border-t-2 border-brand bg-brand-light/20 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-brand">
          UPDATE · {getStageLabel(item.status, deptName)}
        </h4>
        <button onClick={onClose} className="rounded-full p-1 text-[#6B7280] hover:bg-white/50">
          ✕
        </button>
      </div>

      <div className="mt-4">
        {item.status === 'DRAFTING' && (role === 'DRAFTER' || isAdmin) && (
          <DrafterPanel item={item} onClose={onClose} />
        )}

        {item.status === 'PURCHASING' && (role === 'PURCHASING' || isAdmin) && (
          <PurchasingPanel item={item} onClose={onClose} />
        )}

        {item.status === 'PRODUCTION' && (isOperator || isAdmin) && departmentId && (
          <OperatorPanel
            item={item}
            departmentId={departmentId}
            deptName={deptName}
            optimisticProgress={optimisticProgress}
            showCancelToast={showCancelToast}
            countdown={countdown}
            onSave={handleOperatorSave}
            onCancel={cancelUpdate}
            onClose={onClose}
          />
        )}

        {item.status === 'QC' && (role === 'QC' || isAdmin) && (
          <QCPanel item={item} onClose={onClose} />
        )}

        {item.status === 'DELIVERY' && (role === 'DELIVERY' || isAdmin) && (
          <DeliveryPanel item={item} onClose={onClose} />
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onReportProblem}
          className="rounded-full border border-warning/30 px-3 py-1.5 text-xs font-semibold text-warning hover:bg-warning/5"
        >
          ⚠ Laporkan Masalah
        </button>
      </div>

      {/* Cancel Toast */}
      {showCancelToast && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-success/10 px-4 py-2.5 text-sm">
          <span className="text-success">Progress disimpan ✓ — Batalkan? ({countdown}s)</span>
          <button onClick={cancelUpdate} className="font-semibold text-danger hover:underline">
            Batalkan
          </button>
        </div>
      )}
    </div>
  );
}

// ========== Drafter Panel ==========

function DrafterPanel({ item, onClose }: { item: ItemWithRelations; onClose: () => void }) {
  const [state, action, pending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await approveDrawingAction(formData);
    if (result.success) onClose();
    return result;
  }, null);

  return (
    <div>
      <p className="text-sm font-semibold text-[#1A1A2E]">
        {item.name} · Rev. {item.auditLogs.length}
      </p>

      <div className="mt-4 flex gap-3">
        <form action={action} className="flex-1">
          <input name="itemId" type="hidden" value={item.id} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-white hover:bg-success/90 disabled:opacity-50"
          >
            ✅ Setujui Gambar
          </button>
        </form>

        <form action={async (formData) => {
          await requestRedrawAction(formData);
          onClose();
        }} className="flex-1">
          <input name="itemId" type="hidden" value={item.id} />
          <button
            type="submit"
            className="w-full rounded-xl border border-warning px-4 py-2.5 text-sm font-bold text-warning hover:bg-warning/5"
          >
            ↩ Perlu Redraw
          </button>
        </form>
      </div>

      {state && 'error' in state && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}
    </div>
  );
}

// ========== Purchasing Panel ==========

function PurchasingPanel({ item, onClose }: { item: ItemWithRelations; onClose: () => void }) {
  const [state, action, pending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await updatePurchasingProgressAction(formData);
    if (result.success) onClose();
    return result;
  }, null);

  const steps = [
    { label: 'Order dibuat', value: 33, progress: item.purchasing_progress },
    { label: 'Konfirmasi vendor', value: 66, progress: item.purchasing_progress },
    { label: 'Material tiba', value: 100, progress: item.purchasing_progress },
  ];

  return (
    <div>
      <p className="text-sm font-semibold text-[#1A1A2E]">{item.name}</p>

      <div className="mt-4 space-y-2">
        {steps.map((step) => (
          <form key={step.value} action={action}>
            <input name="itemId" type="hidden" value={item.id} />
            <input name="progress" type="hidden" value={step.value} />
            <button
              type="submit"
              disabled={pending || step.value <= item.purchasing_progress}
              className={`w-full rounded-xl px-4 py-2.5 text-left text-sm ${
                step.progress >= step.value
                  ? 'bg-success/10 text-success'
                  : step.value <= item.purchasing_progress + 33
                  ? 'border border-[#E5E7EB] text-[#1A1A2E] hover:bg-gray-50'
                  : 'cursor-not-allowed text-[#6B7280] opacity-50'
              }`}
            >
              {step.progress >= step.value ? '✅' : '○'} {step.label} ({step.value}%)
            </button>
          </form>
        ))}
      </div>

      {state && 'error' in state && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}
    </div>
  );
}

// ========== Operator Panel ==========

function OperatorPanel({
  item,
  departmentId,
  deptName,
  optimisticProgress,
  showCancelToast,
  countdown,
  onSave,
  onCancel,
  onClose,
}: {
  item: ItemWithRelations;
  departmentId: string;
  deptName: string | null;
  optimisticProgress: number;
  showCancelToast: boolean;
  countdown: number;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const [localProgress, setLocalProgress] = useState(item.qty > 1 ? 0 : optimisticProgress);
  const [saving, setSaving] = useState(false);

  const doneQty = Math.round((localProgress / 100) * item.qty);

  function handleSave() {
    setSaving(true);
    const formData = new FormData();
    formData.append('itemId', item.id);
    formData.append('departmentId', departmentId);
    formData.append('progress', String(localProgress));
    onSave(formData);
    setSaving(false);
  }

  return (
    <div>
      <p className="text-sm text-[#6B7280]">
        Sudah selesai: <span className="font-bold text-[#1A1A2E]">{doneQty} / {item.qty} pcs</span>
      </p>

      {item.qty === 1 ? (
        /* Slider for qty=1 */
        <div className="mt-4">
          <input
            type="range"
            min="0"
            max="100"
            value={localProgress}
            onChange={(e) => setLocalProgress(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-[#6B7280]">
            <span>0%</span>
            <span className="font-bold text-brand">{localProgress}%</span>
            <span>100%</span>
          </div>
        </div>
      ) : (
        /* Qty stepper for qty>1 */
        <div className="mt-4">
          <p className="text-sm font-semibold">Tambah {deptName} Hari Ini:</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => setLocalProgress(Math.max(0, localProgress - 5))}
              className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm"
            >
              −
            </button>
            <span className="min-w-12 text-center font-bold">{localProgress}%</span>
            <button
              onClick={() => setLocalProgress(Math.min(100, localProgress + 5))}
              className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-xs text-[#6B7280]">
            Tersisa {item.qty - doneQty} pcs yang bisa ditambahkan
          </p>
          <div className="mt-2 flex gap-2">
            {[5, 10, 20].map((n) => (
              <button
                key={n}
                onClick={() => setLocalProgress(Math.min(100, localProgress + n))}
                className="rounded-full border border-brand/30 px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/5"
              >
                +{n}
              </button>
            ))}
            <button
              onClick={() => setLocalProgress(100)}
              className="rounded-full border border-brand/30 px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/5"
            >
              Semua ({item.qty})
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-[#E5E7EB] py-2 text-sm font-semibold"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={saving || localProgress === optimisticProgress}
          className="flex-1 rounded-xl bg-brand py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Simpan
        </button>
      </div>

      {/* Cancel toast - shown after save */}
      {showCancelToast && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-success/10 px-4 py-2.5 text-sm">
          <span className="text-success">Progress disimpan ✓ — Batalkan? ({countdown}s)</span>
          <button onClick={onCancel} className="font-semibold text-danger hover:underline">
            Batalkan
          </button>
        </div>
      )}
    </div>
  );
}

// ========== QC Panel ==========

  function QCPanel({ item, onClose }: { item: ItemWithRelations; onClose: () => void }) {
  const [lolos, setLolos] = useState(Math.min(item.qty, item.qty));
  const [minor, setMinor] = useState(0);
  const [mayor, setMayor] = useState(0);
  const [state, action, pending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await submitQCResultAction(formData);
    if (result.success) onClose();
    return result;
  }, null);

  function adjustLolos(delta: number) {
    const newVal = Math.max(0, Math.min(item.qty, lolos + delta));
    setLolos(newVal);
  }

  function adjustMinor(delta: number) {
    const newVal = Math.max(0, Math.min(item.qty, minor + delta));
    setMinor(newVal);
  }

  function adjustMayor(delta: number) {
    const newVal = Math.max(0, Math.min(item.qty, mayor + delta));
    setMayor(newVal);
  }

  const total = lolos + minor + mayor;
  const isValid = total === item.qty;

  return (
    <div>
      <p className="text-sm font-semibold text-[#1A1A2E]">
        {item.name} · Total: {item.qty} pcs
      </p>

      <div className="mt-4 space-y-3">
        {/* Lolos */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-success">✅ Lolos</span>
          <div className="flex items-center gap-2">
            <button onClick={() => adjustLolos(-1)} className="rounded-full border px-2 py-0.5 text-xs">−</button>
            <span className="w-6 text-center text-sm font-bold">{lolos}</span>
            <button onClick={() => adjustLolos(1)} className="rounded-full border px-2 py-0.5 text-xs">+</button>
          </div>
        </div>

        {/* Minor */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-warning">⚠ Minor</span>
          <div className="flex items-center gap-2">
            <button onClick={() => adjustMinor(-1)} className="rounded-full border px-2 py-0.5 text-xs">−</button>
            <span className="w-6 text-center text-sm font-bold">{minor}</span>
            <button onClick={() => adjustMinor(1)} className="rounded-full border px-2 py-0.5 text-xs">+</button>
          </div>
        </div>

        {/* Mayor */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-danger">❌ Mayor</span>
          <div className="flex items-center gap-2">
            <button onClick={() => adjustMayor(-1)} className="rounded-full border px-2 py-0.5 text-xs">−</button>
            <span className="w-6 text-center text-sm font-bold">{mayor}</span>
            <button onClick={() => adjustMayor(1)} className="rounded-full border px-2 py-0.5 text-xs">+</button>
          </div>
        </div>
      </div>

      {!isValid && (
        <p className="mt-2 text-xs text-danger">Total harus {item.qty} pcs (sekarang: {total})</p>
      )}

      <form action={action} className="mt-4">
        <input name="itemId" type="hidden" value={item.id} />
        <input name="lolos" type="hidden" value={lolos} />
        <input name="minor" type="hidden" value={minor} />
        <input name="mayor" type="hidden" value={mayor} />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#E5E7EB] py-2 text-sm font-semibold">
            Batal
          </button>
          <button
            type="submit"
            disabled={pending || !isValid}
            className="flex-1 rounded-xl bg-brand py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            ✅ Konfirmasi
          </button>
        </div>
      </form>

      {state && 'error' in state && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}
    </div>
  );
}

// ========== Delivery Panel ==========

function DeliveryPanel({ item, onClose }: { item: ItemWithRelations; onClose: () => void }) {
  const [qty, setQty] = useState(item.qty);
  const [state, action, pending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await confirmDeliveryAction(formData);
    if (result.success) onClose();
    return result;
  }, null);

  return (
    <div>
      <p className="text-sm font-semibold text-[#1A1A2E]">{item.name} · Total: {item.qty} pcs</p>

      <div className="mt-4">
        <p className="text-sm">Qty dikirim:</p>
        <div className="mt-2 flex items-center gap-3">
          <button onClick={() => setQty(Math.max(0, qty - 1))} className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm">
            −
          </button>
          <span className="min-w-12 text-center font-bold">{qty}</span>
          <button onClick={() => setQty(Math.min(item.qty, qty + 1))} className="rounded-full border border-[#E5E7EB] px-3 py-1 text-sm">
            +
          </button>
          <button onClick={() => setQty(item.qty)} className="rounded-full border border-brand/30 px-2 py-1 text-xs font-semibold text-brand">
            Semua ({item.qty})
          </button>
        </div>
      </div>

      <form action={action} className="mt-4">
        <input name="itemId" type="hidden" value={item.id} />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#E5E7EB] py-2 text-sm font-semibold">
            Batal
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-success px-4 py-2 text-sm font-bold text-white hover:bg-success/90 disabled:opacity-50"
          >
            ✅ Konfirmasi Terkirim
          </button>
        </div>
      </form>

      {state && 'error' in state && (
        <p className="mt-2 text-xs text-danger">{state.error}</p>
      )}

      {/* Return option - also available for Admin */}
      <div className="mt-3 border-t border-[#E5E7EB] pt-3">
        <p className="text-xs text-[#6B7280]">Atau tandai sebagai Return:</p>
        <button
          onClick={() => {
            // Return logic - spawn return item
            alert('Return functionality - to be implemented');
          }}
          className="mt-1 rounded-full border border-danger/30 px-3 py-1 text-xs font-semibold text-danger hover:bg-danger/5"
        >
          ↩ Return Item
        </button>
      </div>
    </div>
  );
}

function getStageLabel(status: string, deptName?: string | null): string {
  switch (status) {
    case 'DRAFTING': return 'DRAFTING';
    case 'PURCHASING': return 'PURCHASING';
    case 'PRODUCTION': return deptName || 'PRODUCTION';
    case 'QC': return 'QC';
    case 'DELIVERY': return 'DELIVERY';
    default: return status;
  }
}
