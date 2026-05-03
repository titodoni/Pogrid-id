'use client';

import { useActionState } from 'react';

import { reportProblemAction } from '../actions';

const PROBLEM_CATEGORIES = [
  'Material belum datang',
  'Material tidak sesuai',
  'Mesin/alat bermasalah',
  'Operator tidak tersedia',
  'Gambar/spesifikasi tidak jelas',
  'Lainnya',
];

type ProblemSheetProps = {
  itemId: string;
  onClose: () => void;
};

export default function ProblemSheet({ itemId, onClose }: ProblemSheetProps) {
  const [state, action, pending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await reportProblemAction(formData);
    if (result.success) onClose();
    return result;
  }, null);

  const category = typeof state === 'object' && state !== null && 'category' in state ? (state as { category?: string }).category : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white p-6 animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">⚠ Laporkan Masalah</h3>
          <button onClick={onClose} className="rounded-full p-1 text-[#6B7280] hover:bg-gray-100">
            ✕
          </button>
        </div>

        <form action={action} className="space-y-4">
          <input name="itemId" type="hidden" value={itemId} />

          <div>
            <label className="text-sm font-semibold">
              Kategori *
            </label>
            <select
              name="category"
              defaultValue=""
              required
              className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <option value="" disabled>Pilih kategori...</option>
              {PROBLEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Catatan tambahan (opsional)
            </label>
            <textarea
              name="note"
              rows={3}
              className="mt-2 w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              placeholder={category === 'Lainnya' ? 'Wajib diisi jika kategori Lainnya' : ''}
            />
            {category === 'Lainnya' && (
              <p className="mt-1 text-xs text-danger">Wajib diisi jika kategori Lainnya</p>
            )}
          </div>

          {state && 'error' in state && (
            <p className="text-sm text-danger">{state.error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#E5E7EB] py-2.5 text-sm font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-full bg-warning py-2.5 text-sm font-bold text-white hover:bg-warning/90 disabled:opacity-50"
            >
              Kirim Laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
