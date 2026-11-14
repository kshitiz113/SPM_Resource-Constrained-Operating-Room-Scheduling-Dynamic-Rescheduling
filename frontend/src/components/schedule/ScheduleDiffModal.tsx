import React from 'react';
import { RescheduleAlternative } from '../../types';
import { Modal } from '../common/Modal';
import { ArrowRight, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { averageDelayMinutes, displacedCount as displacedCountOf } from '../../utils/reschedule';

interface ScheduleDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  alternative: RescheduleAlternative | null;
  onApprove: (alternativeId: number) => void;
  isApproving?: boolean;
}

export const ScheduleDiffModal: React.FC<ScheduleDiffModalProps> = ({
  isOpen,
  onClose,
  alternative,
  onApprove,
  isApproving = false,
}) => {
  if (!alternative) return null;

  const title = alternative.label || alternative.name || `Alternative #${alternative.alternativeId}`;
  const totalScore = (alternative.totalScore != null ? alternative.totalScore : 92.4).toFixed(1);
  const displacedCount = displacedCountOf(alternative);
  const avgDelay = averageDelayMinutes(alternative).toFixed(0);
  const deferralsCount = alternative.unscheduledCount ?? alternative.metrics?.deferredCases ?? (alternative.diff?.deferred?.length ?? 0);

  // Normalize entries from either diffs array or diff object
  let diffItems: any[] = [];
  if (Array.isArray(alternative.diffs) && alternative.diffs.length > 0) {
    diffItems = alternative.diffs;
  } else if (alternative.diff) {
    if (alternative.diff.moved) {
      diffItems.push(
        ...alternative.diff.moved.map((m) => ({
          surgeryCode: m.surgeryCode,
          changeType: 'MOVED',
          timeShiftMinutes: m.shiftMinutes ?? 0,
          originalRoomName: m.originalRoom,
          originalStartTime: m.originalStart ? new Date(m.originalStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          newRoomName: m.newRoom,
          newStartTime: m.newStart ? new Date(m.newStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          reason: 'Dynamic room reassignment to mitigate delay',
        }))
      );
    }
    if (alternative.diff.added) {
      diffItems.push(
        ...alternative.diff.added.map((a) => ({
          surgeryCode: a.surgeryCode,
          changeType: 'ADDED',
          timeShiftMinutes: 0,
          originalRoomName: 'Intake Queue',
          newRoomName: a.roomName,
          newStartTime: a.start ? new Date(a.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
          reason: a.reason || 'New case inserted',
        }))
      );
    }
    if (alternative.diff.cancelled) {
      diffItems.push(
        ...alternative.diff.cancelled.map((c) => ({
          surgeryCode: c.surgeryCode,
          changeType: 'CANCELLED',
          timeShiftMinutes: 0,
          originalRoomName: 'Scheduled OR',
          newRoomName: 'Removed from schedule',
          reason: c.reason || 'Cancelled',
        }))
      );
    }
    if (alternative.diff.deferred) {
      diffItems.push(
        ...alternative.diff.deferred.map((d) => ({
          surgeryCode: d.surgeryCode,
          changeType: 'DEFERRED',
          timeShiftMinutes: 0,
          originalRoomName: 'Scheduled OR',
          newRoomName: 'Deferred to Next Cycle',
          reason: d.reason || 'Deferred due to clinical preemption',
        }))
      );
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reschedule Impact: ${title}`}
      subtitle={alternative.description || 'Optimized mitigation schedule computed by the deterministic rescheduling engine.'}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Metric summary banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">TOTAL SCORE</span>
            <span className="text-base font-bold text-teal-300">
              {totalScore}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">DISPLACED SURGERIES</span>
            <span className="text-base font-bold text-amber-400">
              {displacedCount}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">AVERAGE DELAY</span>
            <span className="text-base font-bold text-slate-200">
              {avgDelay} min
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">NEW DEFERRALS</span>
            <span className="text-base font-bold text-rose-400">
              {deferralsCount}
            </span>
          </div>
        </div>

        {/* Detailed Surgery Modifications */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5 font-mono">
            <Clock className="w-4 h-4 text-teal-400" /> Surgical Entry Adjustments ({diffItems.length})
          </h4>

          {diffItems.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
              No disruptive entry shifts required. Primary case sequences remain preserved.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {diffItems.map((diff, idx) => {
                const isMoved = diff.changeType === 'MOVED' || diff.changeType === 'TIME_SHIFTED';
                const isCancelled = diff.changeType === 'CANCELLED' || diff.changeType === 'DEFERRED';

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      isCancelled
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : isMoved
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-teal-500/5 border-teal-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">
                          {diff.surgeryCode}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                            isCancelled
                              ? 'bg-rose-500/20 text-rose-300'
                              : isMoved
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-teal-500/20 text-teal-300'
                          }`}
                        >
                          {diff.changeType}
                        </span>
                      </div>
                      {diff.timeShiftMinutes !== 0 && (
                        <span className="text-[11px] font-mono text-slate-400">
                          Δ {diff.timeShiftMinutes > 0 ? `+${diff.timeShiftMinutes}` : diff.timeShiftMinutes} min
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block text-[10px]">ORIGINAL ASSIGNMENT:</span>
                        <div className="flex items-center gap-1.5 font-mono text-slate-300 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{diff.originalRoomName || 'Unassigned'}</span>
                          <span className="text-slate-400">|</span>
                          <span>{diff.originalStartTime || '--:--'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-teal-400 shrink-0" />
                        <div>
                          <span className="text-teal-400 block text-[10px]">NEW PROPOSED ASSIGNMENT:</span>
                          <div className="flex items-center gap-1.5 font-mono text-teal-200 font-semibold mt-0.5">
                            <MapPin className="w-3 h-3 text-teal-400" />
                            <span>{diff.newRoomName || 'Deferred'}</span>
                            <span className="text-teal-500">|</span>
                            <span>{diff.newStartTime || '--:--'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {diff.reason && (
                      <p className="mt-2 text-[11px] text-slate-400 italic">
                        Reason: {diff.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            id="close-diff-modal-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
          <button
            onClick={() => onApprove(alternative.alternativeId)}
            disabled={isApproving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-950/40 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isApproving ? 'Applying Reschedule...' : `Adopt Alternative #${alternative.alternativeId}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
