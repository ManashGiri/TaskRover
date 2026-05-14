import { useState, useEffect } from "react";
import api from "../scripts/api";

export default function EditTaskModal({ isOpen, onClose, onTaskUpdated, task }) {
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (task) {
      setDescription(task.description);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/tasks/update/${task.id}/`, { 
        description: description,
        is_edited: true 
      });
      await api.post("/api/logs/", { action: `Admin edited task #${task.id}` });
      
      onTaskUpdated(); 
      onClose();       
    } catch (error) {
      console.error("Error editing task:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Edit Task #<u>{task.title}</u></h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">New Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}