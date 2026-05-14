export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-full ${isDanger ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
            <svg className={`w-6 h-6 ${isDanger ? 'text-red-500' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-lg ${
              isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}