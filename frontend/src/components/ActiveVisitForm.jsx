export default function ActiveVisitForm({ activeVisit, note, setNote, onCompleteVisit }) {
  return (
    <form onSubmit={onCompleteVisit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse mr-2"></span>
            Visit In Progress
          </h2>
          <p className="text-slate-400 text-sm">Task #<u>{activeVisit.task_title}</u></p>
        </div>
        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-lg text-sm font-medium">
          Clock is running...
        </span>
      </div>
      <textarea 
        required 
        value={note} 
        onChange={(e) => setNote(e.target.value)}
        placeholder="Work performed, site conditions, inspection details..."
        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none transition-shadow"
      />
      <div className="flex justify-end">
        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-amber-600/20">
          Complete & Submit Notes
        </button>
      </div>
    </form>
  );
}