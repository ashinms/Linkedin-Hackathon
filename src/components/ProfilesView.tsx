import React, { useState } from 'react';
import { Users, User, Download, Sparkles, Edit2, Save, X } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Survey, ParticipantProfile, CommunityInitiative } from '../types/survey';
import { createAIService } from '../services/services';
import { Modal } from './Modal';

export const ProfilesView: React.FC<{
  profiles: ParticipantProfile[];
  survey: Survey;
  surveyFileBuffer: ArrayBuffer | null;
  isDocxTemplate: boolean;
  initiatives: CommunityInitiative[];
  onUpdateProfile: (updated: ParticipantProfile) => void;
  onSelectProfile: (id: string) => void;
}> = ({ profiles, survey, surveyFileBuffer, isDocxTemplate, initiatives, onUpdateProfile, onSelectProfile }) => {
  const [editingProfile, setEditingProfile] = useState<ParticipantProfile | null>(null);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({});
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredProfiles = profiles.filter(p => p.surveyId === survey.id);

  const startEdit = (profile: ParticipantProfile) => {
    setEditingProfile(profile);
    setEditedResponses({ ...profile.responses });
    setEditedNotes(profile.interviewerNotes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingProfile) return;
    setIsSaving(true);
    try {
      const answeredCount = survey.questions.filter(q => editedResponses[q.fieldName]?.trim()).length;
      const completeness = Math.round((answeredCount / (survey.questions.length || 1)) * 100);

      const updatedProfile: ParticipantProfile = {
        ...editingProfile,
        responses: editedResponses,
        interviewerNotes: editedNotes,
        completeness
      };

      onUpdateProfile(updatedProfile);

      const aiService = createAIService();
      const matched = await aiService.matchReferrals(editedResponses, initiatives, editedNotes);
      const refs = (matched || []).map(m => ({ ...m, selected: false, followedUp: false, status: 'Matched' as const }));
      
      onUpdateProfile({ ...updatedProfile, referrals: refs });
      setEditingProfile(null);
    } catch {
      alert("Saved changes, but re-matching support schemes failed.");
      setEditingProfile(null);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToTxt = (profile: ParticipantProfile) => {
    let content = `==================================================\n`;
    content += `SURVEY FORM: ${survey.name}\n`;
    content += `==================================================\n`;
    content += `Date: ${new Date(profile.timestamp).toLocaleString()}\n`;
    content += `Completeness: ${profile.completeness}%\n\n`;
    
    content += `INTERVIEW RESPONSES:\n`;
    survey.questions.forEach((q, idx) => {
      content += `\n[Q${idx + 1}] ${q.fieldName}\n`;
      content += `Answer: ${profile.responses[q.fieldName] || "(No Response)"}\n`;
      content += `--------------------------------------------------\n`;
    });

    if (profile.interviewerNotes) {
      content += `\nINTERVIEWER EXTRA NOTES:\n`;
      content += `${profile.interviewerNotes}\n`;
      content += `--------------------------------------------------\n`;
    }
    
    if (profile.analysis?.needsAndWants) {
      content += `\nNEEDS & INTERESTS IDENTIFIED:\n` + profile.analysis.needsAndWants.map(n => `- ${n}`).join('\n') + '\n';
      content += `--------------------------------------------------\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey-filled-${profile.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToDocx = (profile: ParticipantProfile) => {
    if (!surveyFileBuffer) return;
    try {
      const zip = new PizZip(surveyFileBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      const renderData: Record<string, any> = {};
      survey.questions.forEach(q => {
        const val = profile.responses[q.fieldName] || "";
        renderData[q.fieldName] = val;
        renderData[q.id] = val;
        const cleanKey = q.fieldName.replace(/[^a-zA-Z0-9]/g, "");
        if (cleanKey) renderData[cleanKey] = val;
      });
      doc.render(renderData);
      const out = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(out);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-filled-${profile.id}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to render DOCX. Check tags in template.");
    }
  };

  if (filteredProfiles.length === 0) {
    return (
      <div className="p-12 text-center space-y-4">
        <Users size={48} className="text-white/30 mx-auto" />
        <h2 className="text-lg font-black uppercase text-white">No Profiles Found</h2>
        <p className="text-xs text-white/50">Perform voice capture in training labs or upload templates to capture profiles.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 pb-32 text-left font-sans animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black text-white/60 uppercase">{filteredProfiles.length} Profiles</h2>
      </div>
      <div className="space-y-3">
        {filteredProfiles.map(profile => {
          const participantName = profile.responses[survey.questions[0]?.fieldName] || 'Participant';
          return (
            <div key={profile.id} className="glass-card rounded-2xl p-5 space-y-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-11 h-11 glass-inset rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0"><User size={22} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{participantName}</h3>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-white/50 font-bold uppercase">{new Date(profile.timestamp).toLocaleDateString()}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-green-400/20 text-green-400">{profile.completeness}% Complete</span>
                  </div>
                </div>
              </div>

              {profile.interviewerNotes && (
                <div className="p-3 bg-slate-900/35 border border-white/5 rounded-xl text-[11px] text-white/80 leading-relaxed italic">
                  <span className="block text-[8px] font-black text-purple-400 uppercase not-italic mb-1">Interviewer Notes</span>
                  {profile.interviewerNotes}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => onSelectProfile(profile.id)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"><Sparkles size={12} /><span>Outreach Matcher</span></button>
                <button onClick={() => startEdit(profile)} className="py-2 px-3 glass-button rounded-xl text-white/70 hover:text-white" title="Edit Responses"><Edit2 size={14} /></button>
                <button onClick={() => isDocxTemplate && surveyFileBuffer ? exportToDocx(profile) : exportToTxt(profile)} className="py-2 px-3 glass-button rounded-xl" title="Download filled survey"><Download size={14} className="text-white/70" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={!!editingProfile} title="Edit Survey Responses" onClose={() => setEditingProfile(null)} icon={<Edit2 className="text-blue-400" size={20} />}>
        {editingProfile && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            <p className="text-xs text-white/60 mb-2">Edit responses to survey questions and update interviewer notes below:</p>
            <div className="space-y-3">
              {survey.questions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[9px] font-black text-blue-400 uppercase block">{q.fieldName}</label>
                  <input
                    type="text"
                    value={editedResponses[q.fieldName] || ''}
                    onChange={e => setEditedResponses(prev => ({ ...prev, [q.fieldName]: e.target.value }))}
                    className="w-full p-2.5 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30"
                    placeholder="Enter answer..."
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-3 border-t border-white/5">
              <label className="text-[9px] font-black text-purple-400 uppercase block">Extra Notes by Interviewer</label>
              <textarea
                value={editedNotes}
                onChange={e => setEditedNotes(e.target.value)}
                rows={3}
                placeholder="Add extra interviewer notes..."
                className="w-full p-3 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button onClick={() => setEditingProfile(null)} className="flex-1 py-3 glass-inset text-white/60 font-black uppercase text-xs rounded-xl" disabled={isSaving}>Cancel</button>
          <button onClick={handleSaveEdit} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5" disabled={isSaving}>
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Save & Re-Match</span>}
          </button>
        </div>
      </Modal>
    </div>
  );
};
