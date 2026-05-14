export default function StartVisitForm({ tasks, selectedTaskId, setSelectedTaskId, onStartVisit }) {
  return (
    <form onSubmit={onStartVisit} className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-2">Start a New Visit</h2>
      <select 
        required 
        value={selectedTaskId} 
        onChange={(e) => setSelectedTaskId(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="" disabled>Select a Task...</option>
        {tasks.map(t => (
          <option key={t.id} value={t.id}>Task #{t.id}: {t.title}</option>
        ))}
      </select>
      <div className="flex justify-end">
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20">
          Clock In & Start Visit
        </button>
      </div>
    </form>
  );
}