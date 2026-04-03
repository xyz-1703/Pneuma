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
        <p className="text-sm text-ink/70">
          Reflect on your day. Get AI insights powered by emotion analysis.
        </p>
      </div>

      {/* Form Section - Like Google Keep's top input */}
      <div className="mb-8">
        <JournalForm onSubmit={handleSubmit} loading={loading} />
        {error && <p className="mt-3 text-sm font-medium text-center text-roseleaf animate-rise">{error}</p>}
      </div>

      {/* Recent Insight - Show the latest analyzed entry */}
      {result && (
        <div className="mb-8 glass rounded-[2rem] p-6 md:p-8 shadow-lg shadow-lagoon/5 animate-rise">
          <div className="mb-4 flex items-center justify-between border-b border-lagoon/10 pb-4">
            <h3 className="font-heading text-lg font-bold text-ink">Latest AI Insight</h3>
            <span className="rounded-full bg-lagoon/10 px-3 py-1 text-xs font-semibold text-lagoon uppercase tracking-wide">
              {result.emotion}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
              <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-2">Summary</h4>
              <p className="text-sm leading-relaxed text-ink/80">{result.summary}</p>
            </div>
            
            <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
              <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-2">Insight</h4>
              <p className="text-sm leading-relaxed text-ink/80">{result.insight}</p>
            </div>
            
            <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
              <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-2">Suggestion</h4>
              <p className="text-sm leading-relaxed text-ink/80">{result.suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* All Entries Grid - Like Google Keep Notes Grid */}
      <div>
        <h3 className="font-heading text-xl font-bold text-ink mb-4 pl-2">All Entries</h3>
        
        {historyError && (
          <div className="glass rounded-[2rem] p-6 md:p-8 shadow-lg shadow-roseleaf/10 mb-6 border border-roseleaf/20 animate-rise">
            <p className="text-sm font-medium text-roseleaf mb-3">⚠ Error loading journal entries:</p>
            <p className="text-sm text-roseleaf/80 mb-4">{historyError}</p>
            <button
              onClick={loadJournalHistory}
              className="px-4 py-2 rounded-lg bg-roseleaf/10 hover:bg-roseleaf/20 text-roseleaf text-sm font-medium transition-all active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}
        
        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-ink/70 font-medium">Loading journal entries...</p>
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
              <div className="glass rounded-[2rem] p-6 md:p-8 shadow-lg shadow-lagoon/5 mt-8 animate-rise">
                <div className="mb-6 flex items-center justify-between border-b border-lagoon/10 pb-4">
                  <h3 className="font-heading text-lg font-bold text-ink">Full Entry</h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-lagoon/10 px-3 py-1 text-xs font-semibold text-lagoon uppercase tracking-wide">
                      {selectedEntry.emotion}
                    </span>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="px-3 py-1 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink text-sm font-medium transition-all active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Editable Entry Text */}
                  <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider">Your Entry</h4>
                      {editingEntry !== selectedEntry.id && (
                        <button
                          onClick={() => handleEditStart(selectedEntry)}
                          className="text-xs font-semibold text-lagoon hover:text-lagoon/70 transition-all"
                        >
                          ✎ Edit
                        </button>
                      )}
                    </div>
                    
                    {editingEntry === selectedEntry.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={6}
                          className="w-full rounded-lg border border-lagoon/20 bg-white p-3 text-sm text-ink outline-none transition-all focus:border-lagoon focus:ring-2 focus:ring-lagoon/10 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleEditCancel}
                            disabled={isEditSubmitting}
                            className="px-4 py-2 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink text-sm font-medium transition-all disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleEditSave}
                            disabled={isEditSubmitting}
                            className="px-4 py-2 rounded-lg bg-lagoon text-white text-sm font-medium transition-all hover:bg-lagoon/90 disabled:opacity-60 active:scale-95"
                          >
                            {isEditSubmitting ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-ink/80 whitespace-pre-wrap">{selectedEntry.text}</p>
                    )}
                  </div>
                  
                  {/* AI Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
                      <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-1">Summary</h4>
                      <p className="text-sm leading-relaxed text-ink/80">{selectedEntry.summary}</p>
                    </div>
                    
                    <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
                      <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-1">Insight</h4>
                      <p className="text-sm leading-relaxed text-ink/80">{selectedEntry.insight}</p>
                    </div>
                    
                    <div className="bg-surface/60 rounded-2xl p-4 border border-lagoon/5">
                      <h4 className="text-xs font-bold text-lagoon uppercase tracking-wider mb-1">Suggestion</h4>
                      <p className="text-sm leading-relaxed text-ink/80">{selectedEntry.suggestion}</p>
                    </div>
                  </div>

                  {/* Delete Section */}
                  <div className="border-t border-lagoon/10 pt-4 mt-4">
                    {deleteConfirm === selectedEntry.id ? (
                      <div className="bg-roseleaf/10 rounded-2xl p-4 border border-roseleaf/20">
                        <p className="text-sm font-semibold text-roseleaf mb-3">
                          Are you sure you want to permanently delete this journal entry? This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleDeleteCancel}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink text-sm font-medium transition-all disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteExecute}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-lg bg-roseleaf text-white text-sm font-medium transition-all hover:bg-roseleaf/90 disabled:opacity-60 active:scale-95"
                          >
                            {isDeleting ? "Deleting..." : "Delete Entry"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteConfirm(selectedEntry.id)}
                        className="px-4 py-2 rounded-lg bg-roseleaf/10 hover:bg-roseleaf/20 text-roseleaf text-sm font-medium transition-all active:scale-95"
                      >
                        🗑 Delete Entry
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
