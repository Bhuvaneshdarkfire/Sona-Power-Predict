import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Users, X, CheckCircle, Trash2, Shield, LogOut,
  Megaphone, DollarSign, Send, Plus, Play, Trophy,
  Loader2, AlertCircle, BarChart3, Clock, Search,
  Mail, Eye, ChevronDown, ChevronUp, RefreshCw,
  FileText, Calendar, Hash, User, Building, Image
} from 'lucide-react';
import Modal from './Modal';
import { getAdminData, saveSetting, postAnnouncement, adminAction, approveTeam, getSponsors, addSponsor, deleteSponsor } from '../services/firestore';
import { logoutUser } from '../services/auth';
import { listMatches, createMatch, updateMatch, evaluateMatch, getPredictions, uploadMatchCSV, getSubmissions } from '../services/api';

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — Sona Power Predict
   5 Tabs: Overview · Teams · Matches · Announcements · Settings
   ═══════════════════════════════════════════════════════════════ */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<{ teams: any[], announcements: any[], settings: any[] }>({ teams: [], announcements: [], settings: [] });
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'matches' | 'announce' | 'sponsors' | 'mail'>('overview');
  const [loading, setLoading] = useState(true);

  // Settings State
  const [paymentMode, setPaymentMode] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('0');

  // Announcement State
  const [newMessage, setNewMessage] = useState('');

  // Modal State
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [editScore, setEditScore] = useState('');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });

  // Match State
  const [matches, setMatches] = useState<any[]>([]);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({
    matchNumber: '', team1: '', team2: '', stadium: '', tossWinner: '', tossDecision: 'bat'
  });
  const [showScoreModal, setShowScoreModal] = useState<any>(null);
  const [scoreInput, setScoreInput] = useState({ actualRunsInning1: '', actualRunsInning2: '' });
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [showPredictions, setShowPredictions] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [uploadingCSV, setUploadingCSV] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  // Teams Enhancement State
  const [teamSearch, setTeamSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<'all' | 'Pending' | 'Approved' | 'Paid'>('all');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [teamSubmissions, setTeamSubmissions] = useState<Record<string, any[]>>({});
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Sponsor State
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [newSponsor, setNewSponsor] = useState({ name: '', website: '', logoSvg: '' });
  const [addingSponsor, setAddingSponsor] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const d = await getAdminData();
      setData(d);
      const pMode = d.settings.find((s: any) => s.key === 'payment_mode');
      const pAmt = d.settings.find((s: any) => s.key === 'payment_amount');
      setPaymentMode(pMode ? (pMode as any).value : false);
      setPaymentAmount(pAmt ? (pAmt as any).value : '0');
    } catch (e) { console.error("Fetch error", e); }
    await fetchMatches();
    await fetchSponsors();
    setLoading(false);
  };

  const fetchSponsors = async () => {
    try {
      const s = await getSponsors();
      setSponsors(s);
    } catch (e) { console.error('Sponsors fetch error', e); }
  };

  const fetchMatches = async () => {
    try {
      setMatchError(null);
      const result = await listMatches();
      setMatches(result.matches || []);
    } catch (e: any) {
      console.error("Matches fetch error", e);
      setMatchError(e.message || 'Cannot connect to backend server.');
    }
  };

  const saveSettings = async (key: string, value: any) => {
    await saveSetting(key, value);
    fetchData();
    if (key === 'payment_amount') setModal({ isOpen: true, title: 'Saved', message: 'Payment amount updated.', type: 'success' });
  };

  const handleAddSponsor = async () => {
    if (!newSponsor.name) {
      setModal({ isOpen: true, title: 'Error', message: 'Sponsor name is required.', type: 'error' });
      return;
    }
    setAddingSponsor(true);
    try {
      await addSponsor(newSponsor);
      setNewSponsor({ name: '', website: '', logoSvg: '' });
      fetchSponsors();
      setModal({ isOpen: true, title: 'Sponsor Added', message: 'Sponsor has been added to the site.', type: 'success' });
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    } finally {
      setAddingSponsor(false);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this sponsor?')) return;
    try {
      await deleteSponsor(id);
      fetchSponsors();
      setModal({ isOpen: true, title: 'Sponsor Removed', message: 'Sponsor has been deleted.', type: 'info' });
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handlePostAnnouncement = async () => {
    if (!newMessage.trim()) return;
    await postAnnouncement(newMessage);
    setNewMessage('');
    fetchData();
    setModal({ isOpen: true, title: 'Sent', message: 'Announcement broadcasted to all users.', type: 'success' });
  };

  const handleAction = async (action: string) => {
    if (!selectedTeam) return;
    try {
      if (action === 'kick') {
        if (!confirm(`Delete ${selectedTeam.teamName}?`)) return;
        await adminAction('kick', selectedTeam._id);
        setModal({ isOpen: true, title: 'Team Deleted', message: 'The team has been removed.', type: 'info' });
      } else if (action === 'score') {
        await adminAction('score', selectedTeam._id, editScore);
        setModal({ isOpen: true, title: 'Score Updated', message: `New score set to ${editScore}`, type: 'success' });
      } else if (action === 'approve') {
        const uid = selectedTeam.uid;
        if (!uid) {
          setModal({ isOpen: true, title: 'Error', message: 'This team does not have a linked account.', type: 'error' });
          setSelectedTeam(null);
          return;
        }
        await approveTeam(selectedTeam._id, uid);
        // Auto-send credentials email after approval
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || '/api';
          await fetch(`${API_BASE}/send-credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: selectedTeam.captainEmail, teamName: selectedTeam.teamName, email: selectedTeam.captainEmail, password: '(set during registration)' }),
          });
          setModal({ isOpen: true, title: 'Team Approved! 📧', message: `${selectedTeam.teamName} approved and credentials email sent to ${selectedTeam.captainEmail}.`, type: 'success' });
        } catch {
          setModal({ isOpen: true, title: 'Team Approved!', message: `${selectedTeam.teamName} approved. Email send failed — send manually from team details.`, type: 'success' });
        }
      } else if (action === 'markPaid') {
        await adminAction('markPaid', selectedTeam._id);
        setModal({ isOpen: true, title: 'Payment Marked', message: `${selectedTeam.teamName} has been marked as Paid.`, type: 'success' });
      }
      setSelectedTeam(null);
      fetchData();
    } catch (err) {
      setModal({ isOpen: true, title: 'Error', message: 'Action failed.', type: 'error' });
    }
  };

  const handleBulkApprove = async () => {
    if (!confirm('Are you sure you want to approve ALL pending teams? This will not auto-send emails.')) return;
    try {
      const res = await adminAction('bulkApprove', '');
      setModal({ isOpen: true, title: 'Bulk Approve Complete', message: `Successfully approved ${(res as any)?.count || 0} pending teams.`, type: 'success' });
      fetchData();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message || 'Bulk approve failed.', type: 'error' });
    }
  };

  const handleCleanIncomplete = async () => {
    if (!confirm('Are you sure you want to purge all incomplete team setups older than 1 hour?')) return;
    try {
      const res = await adminAction('cleanIncompleteTeams', '');
      setModal({ isOpen: true, title: 'Cleanup Complete', message: `Removed ${(res as any)?.count || 0} incomplete teams.`, type: 'info' });
      fetchData();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message || 'Cleanup failed.', type: 'error' });
    }
  };

  const handleResetMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to reset this match to Live? Scores will be cleared.')) return;
    try {
      await updateMatch(matchId, { status: 'live', actualRunsInning1: null, actualRunsInning2: null, evaluatedAt: null });
      setModal({ isOpen: true, title: 'Match Reset', message: 'Match is live again and scores were cleared.', type: 'info' });
      fetchMatches();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message || 'Reset failed.', type: 'error' });
    }
  };

  const handleCreateMatch = async () => {
    if (!newMatch.matchNumber || !newMatch.team1 || !newMatch.team2 || !newMatch.stadium) {
      setModal({ isOpen: true, title: 'Missing Fields', message: 'Fill in match number, both teams, and stadium.', type: 'error' });
      return;
    }
    try {
      await createMatch({
        matchNumber: Number(newMatch.matchNumber),
        team1: newMatch.team1, team2: newMatch.team2, stadium: newMatch.stadium,
        tossWinner: newMatch.tossWinner, tossDecision: newMatch.tossDecision,
      });
      setModal({ isOpen: true, title: 'Match Created', message: `Match #${newMatch.matchNumber} created.`, type: 'success' });
      setShowCreateMatch(false);
      setNewMatch({ matchNumber: '', team1: '', team2: '', stadium: '', tossWinner: '', tossDecision: 'bat' });
      fetchMatches();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleUpdateScores = async () => {
    if (!showScoreModal) return;
    try {
      await updateMatch(showScoreModal.id, {
        actualRunsInning1: Number(scoreInput.actualRunsInning1),
        actualRunsInning2: Number(scoreInput.actualRunsInning2),
      });
      setModal({ isOpen: true, title: 'Scores Updated', message: 'Actual scores saved. Match marked as completed.', type: 'success' });
      setShowScoreModal(null);
      setScoreInput({ actualRunsInning1: '', actualRunsInning2: '' });
      fetchMatches();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleEvaluate = async (matchId: string) => {
    setEvaluating(matchId);
    try {
      const result = await evaluateMatch(matchId);
      setModal({ isOpen: true, title: '🏏 Evaluation Started!', message: result.message || 'Containers are running.', type: 'success' });
      fetchMatches();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Evaluation Failed', message: err.message, type: 'error' });
    } finally { setEvaluating(null); }
  };

  const handleViewPredictions = async (matchId: string) => {
    try {
      const result = await getPredictions(matchId);
      setPredictions(result.predictions || []);
      setShowPredictions(matchId);
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleCSVUpload = async (matchId: string, file: File) => {
    setUploadingCSV(matchId);
    try {
      const result = await uploadMatchCSV(matchId, file);
      setModal({
        isOpen: true, title: '📄 CSV Uploaded!',
        message: `${result.message}\n\nInnings 1: ${result.summary?.innings1?.battingTeam} vs ${result.summary?.innings1?.bowlingTeam}\nInnings 2: ${result.summary?.innings2?.battingTeam} vs ${result.summary?.innings2?.bowlingTeam}`,
        type: 'success',
      });
      fetchMatches();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'CSV Upload Failed', message: err.message, type: 'error' });
    } finally { setUploadingCSV(null); }
  };

  const handleSendCredentials = async (team: any) => {
    setSendingEmail(team._id);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '/api';
      const res = await fetch(`${API_BASE}/send-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: team.captainEmail,
          teamName: team.teamName,
          email: team.captainEmail,
          password: '(set during registration)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModal({ isOpen: true, title: '📧 Email Sent!', message: `Credentials sent to ${team.captainEmail}`, type: 'success' });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Email Failed', message: err.message, type: 'error' });
    } finally { setSendingEmail(null); }
  };

  const loadTeamSubmissions = async (teamId: string) => {
    if (teamSubmissions[teamId]) return;
    try {
      const result = await getSubmissions(teamId);
      setTeamSubmissions(prev => ({ ...prev, [teamId]: result.submissions || [] }));
    } catch { setTeamSubmissions(prev => ({ ...prev, [teamId]: [] })); }
  };

  // Computed stats
  const stats = useMemo(() => ({
    totalTeams: data.teams.length,
    pendingTeams: data.teams.filter(t => t.status === 'Pending').length,
    approvedTeams: data.teams.filter(t => t.status === 'Approved').length,
    paidTeams: data.teams.filter(t => t.status === 'Paid').length,
    totalMatches: matches.length,
    completedMatches: matches.filter(m => m.status === 'completed').length,
    evaluatedMatches: matches.filter(m => m.evaluatedAt).length,
    setupComplete: data.teams.filter(t => t.setupComplete).length,
  }), [data.teams, matches]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    let teams = data.teams;
    if (teamFilter !== 'all') teams = teams.filter(t => t.status === teamFilter);
    if (teamSearch.trim()) {
      const s = teamSearch.toLowerCase();
      teams = teams.filter(t =>
        t.teamName?.toLowerCase().includes(s) ||
        t.captainEmail?.toLowerCase().includes(s) ||
        t.institute?.toLowerCase().includes(s)
      );
    }
    return teams;
  }, [data.teams, teamFilter, teamSearch]);

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-400 text-sm";

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen p-4 md:p-6 pt-24 bg-gray-50">
      <Modal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />

      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Shield className="text-[#1e3a8a]" size={28} /> Admin Command Center</h1>
            <p className="text-gray-400 text-xs mt-1">Sona Power Predict 2026 — Management Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchData(); }} className="bg-gray-100 text-gray-600 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={async () => { await logoutUser(); navigate('/'); }} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition flex items-center gap-1.5"><LogOut size={16} /> Logout</button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-fit overflow-x-auto">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'teams', icon: Users, label: 'Teams', badge: stats.pendingTeams },
            { id: 'matches', icon: Trophy, label: 'Matches' },
            { id: 'announce', icon: Megaphone, label: 'Announcements' },
            { id: 'sponsors', icon: Image, label: 'Sponsors' },
            { id: 'mail', icon: Settings, label: 'Settings' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${activeTab === tab.id ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <tab.icon size={16} /> {tab.label}
              {tab.badge ? <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{tab.badge}</span> : null}
            </button>
          ))}
        </div>

        {/* ═══ TAB: OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Teams', value: stats.totalTeams, icon: Users, color: 'blue', sub: `${stats.setupComplete} setup done` },
                { label: 'Pending Approval', value: stats.pendingTeams, icon: Clock, color: 'yellow', sub: `${stats.approvedTeams} approved` },
                { label: 'Total Matches', value: stats.totalMatches, icon: Trophy, color: 'purple', sub: `${stats.completedMatches} completed` },
                { label: 'Evaluated', value: stats.evaluatedMatches, icon: CheckCircle, color: 'green', sub: `${stats.totalMatches - stats.evaluatedMatches} remaining` },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${s.color === 'blue' ? 'bg-blue-50 text-blue-600' : s.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' : s.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                      <s.icon size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions + Recent Teams */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Play size={16} className="text-[#1e3a8a]" /> Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Create Match', icon: Plus, action: () => { setActiveTab('matches'); setShowCreateMatch(true); }, color: 'bg-blue-50 text-blue-600 border-blue-200' },
                    { label: 'View Teams', icon: Users, action: () => setActiveTab('teams'), color: 'bg-purple-50 text-purple-600 border-purple-200' },
                    { label: 'Broadcast', icon: Megaphone, action: () => setActiveTab('announce'), color: 'bg-green-50 text-green-600 border-green-200' },
                    { label: 'Settings', icon: Settings, action: () => setActiveTab('mail'), color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action} className={`${a.color} border rounded-xl p-4 text-left hover:shadow-md transition`}>
                      <a.icon size={20} className="mb-2" />
                      <p className="text-xs font-bold">{a.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock size={16} className="text-yellow-500" /> Pending Approvals</h3>
                {data.teams.filter(t => t.status === 'Pending').length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.teams.filter(t => t.status === 'Pending').slice(0, 5).map(team => (
                      <div key={team._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{team.teamName}</p>
                          <p className="text-[10px] text-gray-400">{team.captainEmail}</p>
                        </div>
                        <button onClick={() => { setSelectedTeam(team); setEditScore(team.score); }} className="bg-[#1e3a8a] text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-800 transition">Review</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-300">
                    <CheckCircle className="mx-auto mb-2" size={28} />
                    <p className="text-xs font-medium">All teams approved!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Trophy size={16} className="text-yellow-500" /> Recent Matches</h3>
              {matches.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-3">
                  {matches.slice(0, 6).map(m => (
                    <div key={m.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-gray-400">#{m.matchNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.status === 'completed' ? 'bg-green-50 border-green-200 text-green-600' : m.status === 'live' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{m.status}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{m.team1} <span className="text-gray-300 font-normal">vs</span> {m.team2}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{m.stadium}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-300 text-sm py-6">No matches created yet</p>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: TEAMS ═══ */}
        {activeTab === 'teams' && (
          <div className="space-y-5">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={teamSearch} onChange={e => setTeamSearch(e.target.value)} placeholder="Search teams, emails, institutes..." className={`${inputCls} !pl-10`} />
              </div>
              <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-200 w-fit">
                <div className="flex items-center gap-2">
                  {(['all', 'Pending', 'Approved', 'Paid'] as const).map(f => (
                    <button key={f} onClick={() => setTeamFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${teamFilter === f ? 'bg-[#1e3a8a] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                      {f === 'all' ? `All (${data.teams.length})` : `${f} (${data.teams.filter(t => t.status === f).length})`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleBulkApprove} className="bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition flex items-center gap-1.5 whitespace-nowrap"><CheckCircle size={14} /> Bulk Approve Pending</button>
                  <button onClick={handleCleanIncomplete} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5 whitespace-nowrap"><Trash2 size={14} /> Purge Incomplete (&lt;1 hr)</button>
                </div>
              </div>
            </div>

            {/* Teams List */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              {filteredTeams.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {filteredTeams.map(team => (
                    <div key={team._id}>
                      {/* Team Row */}
                      <div className="flex items-center justify-between p-4 hover:bg-blue-50/30 transition cursor-pointer" onClick={() => { const newId = expandedTeam === team._id ? null : team._id; setExpandedTeam(newId); if (newId) loadTeamSubmissions(team._id); }}>
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {team.teamName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-sm truncate">{team.teamName}</div>
                            <div className="text-[10px] text-gray-400 truncate">{team.captainEmail} · {team.institute || 'No institute'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${team.status === 'Approved' ? 'bg-green-50 border-green-200 text-green-600' : team.status === 'Paid' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                            {team.status === 'Paid' ? 'Payment Verified' : team.status}
                          </span>
                          {team.setupComplete && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Setup ✓</span>}
                          <span className="font-mono text-sm font-bold text-gray-700">{team.cumulativeError ?? team.score ?? 0}</span>
                          {expandedTeam === team._id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {expandedTeam === team._id && (
                        <div className="px-4 pb-4 bg-gray-50/50 border-t border-gray-100">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {/* Team Layout -> Leader Info */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                              <h4 className="text-xs font-bold text-[#1e3a8a] uppercase mb-3 flex items-center gap-1.5"><User size={14} /> Leader Details</h4>
                              <div className="space-y-2 text-xs">
                                <div><span className="text-gray-400">Name:</span> <span className="text-gray-900 font-bold">{team.captainName || team.leaderDetails?.name || '—'}</span></div>
                                <div><span className="text-gray-400">Email:</span> <span className="text-gray-900 font-medium">{team.captainEmail}</span></div>
                                <div><span className="text-gray-400">Phone/WA:</span> <span className="text-gray-900 font-mono font-medium">{team.leaderDetails?.whatsappNumber || '—'}</span></div>
                                <div><span className="text-gray-400">Institute:</span> <span className="text-gray-900 font-medium">{team.institute || team.leaderDetails?.collegeName || '—'}</span></div>
                                <div><span className="text-gray-400">Department:</span> <span className="text-gray-900">{team.leaderDetails?.department || '—'}</span></div>
                                <div><span className="text-gray-400">Year:</span> <span className="text-gray-900">{team.leaderDetails?.year || '—'}</span></div>
                                <div><span className="text-gray-400">State/PIN:</span> <span className="text-gray-900">{team.leaderDetails?.collegeState || '—'} - {team.leaderDetails?.collegePincode || '—'}</span></div>
                                <div className="pt-2 mt-2 border-t border-gray-100">
                                  <span className="text-gray-400">Registered:</span> <span className="text-gray-900">{formatDate(team.createdAt)}</span>
                                </div>
                                <div><span className="text-gray-400">Account UID:</span> <span className="text-gray-600 font-mono text-[9px]">{team.uid || '—'}</span></div>
                              </div>
                            </div>
                            
                            {/* Member Details */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                              <h4 className="text-xs font-bold text-[#1e3a8a] uppercase mb-3 flex items-center gap-1.5"><Users size={14} /> Members & Workshop</h4>
                              {team.memberDetails && Array.isArray(team.memberDetails) && team.memberDetails.length > 0 ? (
                                <div className="space-y-4">
                                  {team.memberDetails.map((m: any, i: number) => (
                                    <div key={i} className="text-xs relative pl-3 border-l-2 border-blue-200">
                                      <p className="font-bold text-gray-900 mb-0.5">{i+1}. {m.name}</p>
                                      <p className="text-gray-500">{m.department} · {m.year}</p>
                                      <p className="text-gray-500 font-mono text-[10px] mt-0.5">📞 {m.whatsappNumber}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : team.members ? (
                                <div className="space-y-1">
                                  {team.members.filter((m: string) => m).map((m: string, i: number) => (
                                    <p key={i} className="text-xs text-gray-700">{i + 1}. {m} <em className="text-gray-400">(legacy format)</em></p>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No additional members.</p>
                              )}
                              
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Workshop Preference</h5>
                                {team.workshopPreference ? (
                                  team.workshopPreference.willing ? (
                                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-xs font-bold">
                                      ✓ Attending • {team.workshopPreference.mode === 'online' ? '💻 Online' : '🏫 Offline'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 border border-gray-200 px-2 py-1 rounded text-xs font-medium">
                                      ✕ Not Attending
                                    </span>
                                  )
                                ) : (
                                  <span className="text-xs text-gray-400">Not selected yet.</span>
                                )}
                              </div>
                            </div>

                            {/* Submissions */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100">
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1"><FileText size={12} /> Submissions</h4>
                              {teamSubmissions[team._id]?.length > 0 ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {teamSubmissions[team._id].map((sub: any, i: number) => (
                                    <div key={i} className="p-2 bg-gray-50 rounded-lg text-[10px]">
                                      <p className="font-medium text-gray-700">{sub.filename || `Submission ${i + 1}`}</p>
                                      <p className="text-gray-400">{sub.createdAt || '—'}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-300 text-center py-4">No submissions yet</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100">
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Actions</h4>
                              <div className="space-y-2">
                                {team.status !== 'Approved' && (
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setEditScore(team.score); handleAction('approve'); }} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition">
                                    <CheckCircle size={12} /> Approve Team
                                  </button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleSendCredentials(team); }} disabled={sendingEmail === team._id} className="w-full py-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50">
                                  {sendingEmail === team._id ? <><Loader2 size={12} className="animate-spin" /> Sending...</> : <><Mail size={12} /> Send Credentials</>}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); setEditScore(team.score); }} className="w-full py-2 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-700 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition">
                                  <Eye size={12} /> Manage / Edit Score
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); handleAction('kick'); }} className="w-full py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition">
                                  <Trash2 size={12} /> Delete Team
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-gray-300">
                  <Users className="mx-auto mb-2" size={32} />
                  <p className="text-sm">No teams found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: MATCHES ═══ */}
        {activeTab === 'matches' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Match Management</h2>
              <button onClick={() => setShowCreateMatch(true)} className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition">
                <Plus size={16} /> Create Match
              </button>
            </div>

            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map(match => (
                  <div key={match.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Match Header */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#{match.matchNumber}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{match.team1} <span className="text-gray-300 text-sm font-normal">vs</span> {match.team2}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-2">
                            <Building size={10} /> {match.stadium}
                            {match.tossWinner && <><span className="text-gray-200">·</span> Toss: {match.tossWinner} ({match.tossDecision})</>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(match.actualRunsInning1 !== null && match.actualRunsInning1 !== undefined) && (
                          <span className="font-mono text-green-600 text-xs font-bold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                            I1: {match.actualRunsInning1} | I2: {match.actualRunsInning2}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${match.status === 'completed' ? 'bg-green-50 border-green-200 text-green-600' : match.status === 'live' ? 'bg-yellow-50 border-yellow-200 text-yellow-600 animate-pulse' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{match.status}</span>
                        {match.csvUploaded && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">CSV ✓</span>}
                        {match.evaluatedAt && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">Evaluated ✓</span>}
                      </div>
                    </div>

                    {/* Match Actions */}
                    <div className="px-5 pb-4 flex flex-wrap gap-2">
                       {match.status === 'completed' && (
                         <button onClick={() => handleResetMatch(match.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition flex items-center gap-1">
                            Reset to Live
                         </button>
                       )}
                      <button onClick={() => { setShowScoreModal(match); setScoreInput({ actualRunsInning1: match.actualRunsInning1?.toString() || '', actualRunsInning2: match.actualRunsInning2?.toString() || '' }); }}
                        className="bg-yellow-50 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-500 hover:text-white transition flex items-center gap-1">
                        <Hash size={12} /> Set Scores
                      </button>
                      <label className={`inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold border transition ${match.csvUploaded ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white' : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-500 hover:text-white'}`}>
                        <input type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVUpload(match.id, f); e.target.value = ''; }} />
                        {uploadingCSV === match.id ? <><Loader2 size={12} className="animate-spin" /> Parsing…</> : match.csvUploaded ? <><CheckCircle size={12} /> Re-upload CSV</> : <><Plus size={12} /> Upload CSV</>}
                      </label>
                      {match.status === 'completed' && (
                        <button onClick={() => handleEvaluate(match.id)} disabled={evaluating === match.id}
                          className="bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white transition disabled:opacity-50 flex items-center gap-1">
                          {evaluating === match.id ? <><Loader2 size={12} className="animate-spin" /> Running…</> : <><Play size={12} /> Evaluate</>}
                        </button>
                      )}
                      {match.evaluatedAt && (
                        <button onClick={() => handleViewPredictions(match.id)}
                          className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500 hover:text-white transition flex items-center gap-1">
                          <Eye size={12} /> View Results
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center text-gray-400">
                {matchError ? (
                  <>
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left max-w-lg mx-auto">
                      <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Backend Server Not Running</p>
                      <p className="text-xs text-amber-700 leading-relaxed">{matchError}</p>
                    </div>
                    <button onClick={fetchMatches} className="text-xs text-royal font-medium hover:underline">Retry</button>
                  </>
                ) : (
                  <>
                    <Trophy className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="text-sm font-bold text-gray-500">No matches yet</p>
                    <p className="text-xs">Create your first match to get started.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: ANNOUNCEMENTS ═══ */}
        {activeTab === 'announce' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm col-span-1">
              <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2 text-sm"><Send size={16} /> New Broadcast</h3>
              <textarea className={`${inputCls} h-36 mb-4 resize-none`} placeholder="Type message here..." value={newMessage} onChange={e => setNewMessage(e.target.value)}></textarea>
              <button onClick={handlePostAnnouncement} className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition">Send Message</button>
            </div>
            <div className="col-span-2 space-y-3">
              <h3 className="text-gray-400 font-bold text-xs uppercase">History</h3>
              {data.announcements.map((msg: any, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-3">
                  <div className="bg-blue-50 p-2 rounded-full text-blue-500 h-fit"><Megaphone size={16} /></div>
                  <div>
                    <p className="text-gray-900 text-sm mb-1">{msg.message}</p>
                    <p className="text-xs text-gray-400">{formatDate(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB: SPONSORS ═══ */}
        {activeTab === 'sponsors' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm col-span-1 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><Image className="text-blue-600" size={20} /> Add New Sponsor</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Company Name</label>
                  <input value={newSponsor.name} onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })} className={inputCls} placeholder="e.g. Zentropy Technologies" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Website URL (Optional)</label>
                  <input value={newSponsor.website} onChange={e => setNewSponsor({ ...newSponsor, website: e.target.value })} className={inputCls} placeholder="https://zentropytech.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Logo URL or SVG Code (Optional)</label>
                  <textarea value={newSponsor.logoSvg} onChange={e => setNewSponsor({ ...newSponsor, logoSvg: e.target.value })} className={`${inputCls} h-32 resize-none font-mono text-xs`} placeholder="Paste SVG code or image URL here..." />
                </div>
                <button disabled={addingSponsor} onClick={handleAddSponsor} className="w-full bg-[#1e3a8a] disabled:bg-blue-300 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition flex justify-center items-center gap-2">
                  {addingSponsor ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Sponsor
                </button>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><Building className="text-blue-600" size={20} /> Current Sponsors</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {sponsors.length === 0 ? (
                  <div className="col-span-2 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                    <p>No custom sponsors added.</p>
                    <p className="text-xs mt-1">Default (Zentropy) will be shown on the home page.</p>
                  </div>
                ) : (
                  sponsors.map((s) => (
                    <div key={s.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-3">
                        {s.logoSvg ? (
                          <div className="h-12 w-24 bg-white rounded border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                            {s.logoSvg.startsWith('<svg') ? (
                              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: s.logoSvg }} />
                            ) : (
                              <img src={s.logoSvg} alt={s.name} className="max-h-full max-w-full object-contain" />
                            )}
                          </div>
                        ) : (
                          <div className="h-12 w-24 bg-blue-50 text-blue-600 font-bold text-xs rounded flex items-center justify-center">No Logo</div>
                        )}
                        <button onClick={() => handleDeleteSponsor(s.id)} className="text-red-400 hover:text-red-600 transition bg-white p-1.5 rounded-lg border border-red-100"><Trash2 size={14} /></button>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                        {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate block">{s.website}</a>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: SETTINGS ═══ */}
        {activeTab === 'mail' && (
          <div className="bg-white p-8 rounded-2xl max-w-2xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Payment & Gateway</h2>
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
              <div><h3 className="text-sm font-bold text-gray-900">Enable Payment Mode</h3><p className="text-gray-500 text-xs">Teams will see payment instructions.</p></div>
              <button onClick={() => saveSettings('payment_mode', !paymentMode)} className={`relative h-6 w-11 rounded-full transition ${paymentMode ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`block h-4 w-4 bg-white rounded-full transform transition mt-1 ml-1 shadow ${paymentMode ? 'translate-x-5' : ''}`} /></button>
            </div>
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
              <label className="text-gray-900 text-sm font-bold mb-2 block flex items-center gap-2"><DollarSign size={14} /> Registration Fee (₹)</label>
              <div className="flex gap-3">
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={inputCls} />
                <button onClick={() => saveSettings('payment_amount', paymentAmount)} className="bg-[#1e3a8a] px-5 rounded-lg text-white text-sm font-bold hover:bg-blue-800 transition">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──── MANAGE TEAM MODAL ──── */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl border border-gray-200 shadow-2xl relative">
            <button onClick={() => setSelectedTeam(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-5">{selectedTeam.teamName}</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="text-xs font-bold text-gray-500 uppercase">Score</label>
                <div className="flex gap-2 mt-2">
                  <input type="number" value={editScore} onChange={e => setEditScore(e.target.value)} className={inputCls} />
                  <button onClick={() => handleAction('score')} className="bg-[#1e3a8a] px-4 rounded-lg text-white text-sm font-bold">Save</button>
                </div>
              </div>
              {selectedTeam.status !== 'Approved' && (
                <button onClick={() => handleAction('approve')} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
                  <CheckCircle size={16} /> Approve Team
                </button>
              )}
              <button onClick={() => handleAction('kick')} className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
                <Trash2 size={16} /> Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── CREATE MATCH MODAL ──── */}
      {showCreateMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg p-7 rounded-2xl border border-gray-200 shadow-2xl relative">
            <button onClick={() => setShowCreateMatch(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><Plus size={18} /> Create Match</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Match #</label><input type="number" value={newMatch.matchNumber} onChange={e => setNewMatch({ ...newMatch, matchNumber: e.target.value })} className={inputCls} placeholder="1" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Stadium</label><input value={newMatch.stadium} onChange={e => setNewMatch({ ...newMatch, stadium: e.target.value })} className={inputCls} placeholder="Wankhede Stadium" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Team 1</label><input value={newMatch.team1} onChange={e => setNewMatch({ ...newMatch, team1: e.target.value })} className={inputCls} placeholder="CSK" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Team 2</label><input value={newMatch.team2} onChange={e => setNewMatch({ ...newMatch, team2: e.target.value })} className={inputCls} placeholder="MI" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Toss Winner</label><input value={newMatch.tossWinner} onChange={e => setNewMatch({ ...newMatch, tossWinner: e.target.value })} className={inputCls} placeholder="CSK" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Toss Decision</label><select value={newMatch.tossDecision} onChange={e => setNewMatch({ ...newMatch, tossDecision: e.target.value })} className={inputCls}><option value="bat">Bat</option><option value="field">Field</option></select></div>
              </div>
              <button onClick={handleCreateMatch} className="w-full py-3 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md transition mt-1">Create Match</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── UPDATE SCORES MODAL ──── */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md p-7 rounded-2xl border border-gray-200 shadow-2xl relative">
            <button onClick={() => setShowScoreModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Update Actual Scores</h2>
            <p className="text-gray-400 text-sm mb-5">Match #{showScoreModal.matchNumber}: {showScoreModal.team1} vs {showScoreModal.team2}</p>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Total Score — Innings 1</label><input type="number" value={scoreInput.actualRunsInning1} onChange={e => setScoreInput({ ...scoreInput, actualRunsInning1: e.target.value })} className={inputCls} placeholder="e.g. 185" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Total Score — Innings 2</label><input type="number" value={scoreInput.actualRunsInning2} onChange={e => setScoreInput({ ...scoreInput, actualRunsInning2: e.target.value })} className={inputCls} placeholder="e.g. 172" /></div>
              <button onClick={handleUpdateScores} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md transition">Save Scores & Mark Completed</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── PREDICTIONS MODAL ──── */}
      {showPredictions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl p-7 rounded-2xl border border-gray-200 shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowPredictions(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2"><Trophy className="text-yellow-500" size={18} /> Evaluation Results</h2>
            {predictions.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                  <tr><th className="p-3">#</th><th className="p-3">Team</th><th className="p-3">Pred I1</th><th className="p-3">Pred I2</th><th className="p-3">Err I1</th><th className="p-3">Err I2</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {predictions.map((pred: any, i: number) => (
                    <tr key={pred.id} className="hover:bg-blue-50/40">
                      <td className="p-3 font-mono text-gray-400 text-xs">{i + 1}</td>
                      <td className="p-3 font-bold text-gray-900 text-xs">{pred.teamName || pred.teamId}</td>
                      <td className="p-3 font-mono text-blue-600 text-xs">{pred.predictedRunsInning1 ?? '—'}</td>
                      <td className="p-3 font-mono text-blue-600 text-xs">{pred.predictedRunsInning2 ?? '—'}</td>
                      <td className="p-3 font-mono text-yellow-600 text-xs">{pred.errorInning1}</td>
                      <td className="p-3 font-mono text-yellow-600 text-xs">{pred.errorInning2}</td>
                      <td className="p-3 font-mono font-bold text-red-500 text-xs">{pred.totalError}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pred.status === 'success' ? 'bg-green-50 text-green-600 border-green-200' : pred.status === 'timeout' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-red-50 text-red-500 border-red-200'}`}>{pred.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <AlertCircle className="mx-auto mb-2 text-gray-300" size={28} />
                <p className="text-sm">No predictions found for this match.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;