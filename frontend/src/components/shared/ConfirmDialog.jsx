import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={30} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 w-full pt-1">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
