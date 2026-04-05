import { useState, useEffect } from "react";
import JournalForm from "../components/JournalForm";
import JournalHistory from "../components/JournalHistory";
import { submitJournal, getJournalHistory, updateJournal, deleteJournal } from "../services/api";

export default function Journal() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editText, setEditText] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadJournalHistory();
  }, []);

  const loadJournalHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const data = await getJournalHistory();
      setEntries(data || []);
      console.log("Journal entries loaded:", data);
    } catch (err) {
      const errorMsg = err.message || "Failed to load journal entries";
      console.error("Failed to load journal history:", err);
      setHistoryError(errorMsg);
      setEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (text) => {
    setLoading(true);
    setError("");
    setSelectedEntry(null);

    try {
      const data = await submitJournal(text);
      setResult(data);
      // Reload journal history to include the new entry
      await loadJournalHistory();
    } catch (err) {
      setError("Could not process your journal entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (entry) => {
    setEditingEntry(entry.id);
    setEditText(entry.text);
  };

  const handleEditCancel = () => {
    setEditingEntry(null);
    setEditText("");
  };

  const handleEditSave = async () => {
    if (!editText.trim()) {
      setError("Journal entry cannot be empty");
      return;
    }

    setIsEditSubmitting(true);
    setError("");

    try {
      const updatedEntry = await updateJournal(editingEntry, editText);
      
      // Update the local entry
      const updatedEntries = entries.map((e) =>
        e.id === editingEntry
          ? { ...e, ...updatedEntry }
          : e
      );
      setEntries(updatedEntries);
      
      // Update selected entry if it's the one being edited
      if (selectedEntry?.id === editingEntry) {
        setSelectedEntry({ ...selectedEntry, ...updatedEntry });
      }
      
      setEditingEntry(null);
      setEditText("");
    } catch (err) {
      setError("Could not update journal entry.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = (entryId) => {
    setDeleteConfirm(entryId);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteExecute = async () => {
    if (deleteConfirm === null) return;

    setIsDeleting(true);
    setError("");

    try {
      await deleteJournal(deleteConfirm);
      
      // Remove from entries
      const updatedEntries = entries.filter((e) => e.id !== deleteConfirm);
      setEntries(updatedEntries);
      
      // Clear selected entry if it's the one being deleted
      if (selectedEntry?.id === deleteConfirm) {
        setSelectedEntry(null);
      }
      
      setDeleteConfirm(null);
    } catch (err) {
      setError("Could not delete journal entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl animate-rise">
      {/* Header */}
      <div className="mb-8 pl-2">
        <h2 className="font-heading text-3xl font-bold text-ink mb-2">Journal</h2>
        <p className="text-[15px] font-medium text-ink/60">
          Reflect on your day. Get AI insights powered by emotion analysis.
        </p>
      </div>

      {/* Form Section - Like Google Keep's top input */}
      <div className="mb-8 relative z-10">
        <JournalForm onSubmit={handleSubmit} loading={loading} />
        {error && <p className="mt-4 text-sm font-semibold text-center text-roseleaf animate-rise">{error}</p>}
      </div>

      {/* Recent Insight - Show the latest analyzed entry */}
      {result && (
        <div className="mb-10 glass rounded-[2.5rem] p-6 md:p-8 shadow-glass hover:shadow-glass-hover transition-all animate-scaleUp border border-accent/20">
          <div className="mb-5 flex items-center justify-between border-b border-ink/10 pb-5">
            <h3 className="font-heading text-xl font-bold text-ink">Latest AI Insight</h3>
            <span className="rounded-full bg-accent/10 px-4 py-1.5 text-xs font-bold text-accent uppercase tracking-wider border border-accent/20">
              {result.emotion}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-surface/50 hover:bg-surface rounded-2xl p-5 border border-ink/5 transition-colors">
              <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Summary</h4>
              <p className="text-[15px] font-medium leading-relaxed text-ink/80">{result.summary}</p>
            </div>
            
            <div className="bg-surface/50 hover:bg-surface rounded-2xl p-5 border border-ink/5 transition-colors">
              <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Insight</h4>
              <p className="text-[15px] font-medium leading-relaxed text-ink/80">{result.insight}</p>
            </div>
            
            <div className="bg-surface/50 hover:bg-surface rounded-2xl p-5 border border-ink/5 transition-colors">
              <h4 className="text-xs font-bold text-accent uppercase tracking-widest mb-3">Suggestion</h4>
              <p className="text-[15px] font-medium leading-relaxed text-ink/80">{result.suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* All Entries Grid - Like Google Keep Notes Grid */}
      <div>
        <h3 className="font-heading text-2xl font-bold text-ink mb-6 pl-2">All Entries</h3>
        
        {historyError && (
          <div className="glass rounded-[2.5rem] p-6 md:p-8 shadow-glass mb-6 border border-roseleaf/20 animate-rise">
            <p className="text-[15px] font-bold text-roseleaf mb-2">⚠ Error loading journal entries</p>
            <p className="text-sm font-medium text-roseleaf/80 mb-5">{historyError}</p>
            <button
              onClick={loadJournalHistory}
              className="px-6 py-2.5 rounded-xl bg-roseleaf text-white text-sm font-bold tracking-wide transition-all hover:bg-roseleaf/90 active:scale-95 shadow-md shadow-roseleaf/20"
            >
              Try Again
            </button>
          </div>
        )}
        
        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-16 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-ink/10 border-t-accent animate-spin mb-4"></div>
            <p className="text-ink/60 font-semibold tracking-wide">Loading journal entries...</p>
          </div>
        ) : (
          <>
            <JournalHistory 
              entries={entries} 
              selectedEntry={selectedEntry}
              onSelectEntry={setSelectedEntry}
              onDeleteClick={handleDeleteConfirm}
            />

            {/* Expanded View of Selected Entry */}
            {selectedEntry && (
              <div className="glass rounded-[2.5rem] p-6 md:p-8 shadow-glass-hover mt-10 animate-slideIn border border-ink/10">
                <div className="mb-6 flex items-center justify-between border-b border-ink/10 pb-5">
                  <h3 className="font-heading text-xl font-bold text-ink">Full Entry</h3>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-surface px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm border border-ink/5">
                      {selectedEntry.emotion || "neutral"}
                    </span>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="px-4 py-2 rounded-xl bg-ink text-surface text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-95 shadow-md"
                    >
                      Close
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Editable Entry Text */}
                  <div className="bg-surface/50 rounded-3xl p-6 border border-ink/5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-ink/50 uppercase tracking-widest">Your Entry</h4>
                      {editingEntry !== selectedEntry.id && (
                        <button
                          onClick={() => handleEditStart(selectedEntry)}
                          className="text-xs font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest flex items-center gap-1"
                        >
                          ✎ Edit
                        </button>
                      )}
                    </div>
                    
                    {editingEntry === selectedEntry.id ? (
                      <div className="space-y-4 animate-scaleUp">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={6}
                          className="w-full rounded-2xl border border-ink/10 bg-surface/80 p-5 text-[15px] font-medium text-ink outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 resize-none shadow-inner"
                        />
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={handleEditCancel}
                            disabled={isEditSubmitting}
                            className="px-6 py-2.5 rounded-xl border border-ink/10 bg-surface hover:bg-surface/80 text-ink text-sm font-bold tracking-wide transition-all disabled:opacity-50 active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleEditSave}
                            disabled={isEditSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-accent text-white text-sm font-bold tracking-wide transition-all hover:bg-accent/90 disabled:opacity-50 active:scale-95 shadow-md shadow-accent/20"
                          >
                            {isEditSubmitting ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[16px] leading-relaxed font-medium text-ink/90 whitespace-pre-wrap">{selectedEntry.text}</p>
                    )}
                  </div>
                  
                  {/* AI Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-surface/50 hover:bg-surface transition-colors rounded-3xl p-5 border border-ink/5">
                      <h4 className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Summary</h4>
                      <p className="text-[14px] font-medium leading-relaxed text-ink/80">{selectedEntry.summary}</p>
                    </div>
                    
                    <div className="bg-surface/50 hover:bg-surface transition-colors rounded-3xl p-5 border border-ink/5">
                      <h4 className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Insight</h4>
                      <p className="text-[14px] font-medium leading-relaxed text-ink/80">{selectedEntry.insight}</p>
                    </div>
                    
                    <div className="bg-surface/50 hover:bg-surface transition-colors rounded-3xl p-5 border border-ink/5">
                      <h4 className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Suggestion</h4>
                      <p className="text-[14px] font-medium leading-relaxed text-ink/80">{selectedEntry.suggestion}</p>
                    </div>
                  </div>

                  {/* Delete Section */}
                  <div className="border-t border-ink/10 pt-6 mt-6">
                    {deleteConfirm === selectedEntry.id ? (
                      <div className="bg-roseleaf/10 rounded-2xl p-5 border border-roseleaf/20 animate-scaleUp">
                        <p className="text-[15px] font-bold text-roseleaf mb-4">
                          Are you sure you want to permanently delete this journal entry? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={handleDeleteCancel}
                            disabled={isDeleting}
                            className="px-6 py-2.5 rounded-xl border border-roseleaf/20 bg-surface/50 hover:bg-surface text-ink text-sm font-bold tracking-wide transition-all disabled:opacity-50 active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteExecute}
                            disabled={isDeleting}
                            className="px-6 py-2.5 rounded-xl bg-roseleaf text-white text-sm font-bold tracking-wide transition-all hover:bg-roseleaf/90 disabled:opacity-50 active:scale-95 shadow-md shadow-roseleaf/20"
                          >
                            {isDeleting ? "Deleting..." : "Delete Entry"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteConfirm(selectedEntry.id)}
                        className="px-4 py-2.5 rounded-xl border border-roseleaf/20 text-roseleaf hover:bg-roseleaf hover:text-white text-[13px] font-bold tracking-wide transition-colors active:scale-95 flex items-center justify-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        Delete Entry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
