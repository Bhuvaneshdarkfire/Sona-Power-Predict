import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getTeamByUid, saveTeamSetup } from '../services/firestore';
import Modal from './Modal';
import type { TeamLeaderDetails, TeamMemberDetails, WorkshopPreference } from '../types';
import { Users, UserCircle, ChevronRight, ChevronLeft, GraduationCap, Plus, Trash2, CheckCircle } from 'lucide-react';

const emptyLeader: TeamLeaderDetails = {
    name: '', collegeName: '', collegeState: '', collegePincode: '',
    department: '', year: '', whatsappNumber: '',
};

const emptyMember: TeamMemberDetails = {
    name: '', department: '', year: '', whatsappNumber: '',
};

const TeamSetup = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [teamId, setTeamId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Step 1: Leader
    const [leader, setLeader] = useState<TeamLeaderDetails>({ ...emptyLeader });
    const [leaderErrors, setLeaderErrors] = useState<Record<string, string>>({});

    // Step 2: Members + Workshop
    const [members, setMembers] = useState<TeamMemberDetails[]>([{ ...emptyMember }]);
    const [memberErrors, setMemberErrors] = useState<Record<string, string>[]>([]);
    const [workshop, setWorkshop] = useState<WorkshopPreference>({ willing: false, mode: null });

    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'info' });

    // Load team info
    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        (async () => {
            try {
                const team: any = await getTeamByUid(user.uid);
                if (!team) { navigate('/login'); return; }
                if (team.setupComplete) { navigate('/user-dashboard'); return; }
                setTeamId(team._id);
                // Pre-fill leader name and college from registration data
                setLeader(prev => ({
                    ...prev,
                    name: team.captainName || '',
                    collegeName: team.institute || '',
                }));
            } catch {
                navigate('/login');
            } finally {
                setLoading(false);
            }
        })();
    }, [user, navigate]);

    // ─── Validation ────────────────────────────────────────────
    const validateLeader = () => {
        const errs: Record<string, string> = {};
        if (!leader.name.trim()) errs.name = 'Required';
        if (!leader.collegeName.trim()) errs.collegeName = 'Required';
        if (!leader.collegeState.trim()) errs.collegeState = 'Required';
        if (!/^\d{6}$/.test(leader.collegePincode)) errs.collegePincode = 'Must be 6 digits';
        if (!leader.department.trim()) errs.department = 'Required';
        if (!leader.year) errs.year = 'Required';
        if (!/^\d{10}$/.test(leader.whatsappNumber)) errs.whatsappNumber = 'Must be 10 digits';
        setLeaderErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateMembers = () => {
        const errList: Record<string, string>[] = [];
        let valid = true;
        members.forEach((m, i) => {
            const errs: Record<string, string> = {};
            if (!m.name.trim()) errs.name = 'Required';
            if (!m.department.trim()) errs.department = 'Required';
            if (!m.year) errs.year = 'Required';
            if (!/^\d{10}$/.test(m.whatsappNumber)) errs.whatsappNumber = 'Must be 10 digits';
            if (Object.keys(errs).length > 0) valid = false;
            errList[i] = errs;
        });
        setMemberErrors(errList);
        return valid;
    };

    const handleNext = () => {
        if (validateLeader()) setStep(2);
    };

    const handleSubmit = async () => {
        if (!validateMembers()) return;
        setSaving(true);
        try {
            await saveTeamSetup(teamId, {
                leaderDetails: leader,
                memberDetails: members,
                workshopPreference: workshop,
            });
            setModal({
                isOpen: true,
                title: '🎉 Team Setup Complete!',
                message: 'Your team details have been saved successfully. You can now access the dashboard.',
                type: 'success',
            });
        } catch (err: any) {
            setModal({ isOpen: true, title: 'Error', message: err.message || 'Failed to save', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleCloseModal = () => {
        setModal({ ...modal, isOpen: false });
        if (modal.type === 'success') navigate('/user-dashboard');
    };

    const addMember = () => {
        if (members.length < 3) setMembers([...members, { ...emptyMember }]);
    };

    const removeMember = (idx: number) => {
        if (members.length > 1) setMembers(members.filter((_, i) => i !== idx));
    };

    const updateMember = (idx: number, field: keyof TeamMemberDetails, val: string) => {
        const copy = [...members];
        copy[idx] = { ...copy[idx], [field]: val };
        setMembers(copy);
        // Clear error
        if (memberErrors[idx]?.[field]) {
            const errCopy = [...memberErrors];
            errCopy[idx] = { ...errCopy[idx], [field]: '' };
            setMemberErrors(errCopy);
        }
    };

    const updateLeader = (field: keyof TeamLeaderDetails, val: string) => {
        setLeader({ ...leader, [field]: val });
        if (leaderErrors[field]) setLeaderErrors({ ...leaderErrors, [field]: '' });
    };

    const inputCls = (hasError: boolean) =>
        `w-full bg-gray-50 border ${hasError ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-200'} text-gray-900 rounded-xl p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-400 text-sm`;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-10 h-10 border-3 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
            <Modal isOpen={modal.isOpen} onClose={handleCloseModal} title={modal.title} message={modal.message} type={modal.type} />

            <div className="max-w-2xl mx-auto">
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 1 ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/20' : 'bg-green-100 text-green-700'}`}>
                        {step > 1 ? <CheckCircle size={16} /> : <UserCircle size={16} />}
                        Team Leader
                    </div>
                    <div className="w-8 h-0.5 bg-gray-200 rounded-full">
                        <div className={`h-full bg-[#1e3a8a] rounded-full transition-all duration-500 ${step > 1 ? 'w-full' : 'w-0'}`} />
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 2 ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 text-gray-400'}`}>
                        <Users size={16} />
                        Team Members
                    </div>
                </div>

                {/* STEP 1: Team Leader Details */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <UserCircle size={32} className="text-[#1e3a8a]" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Team Leader Details</h2>
                            <p className="text-gray-400 text-sm mt-1">Tell us about the team leader</p>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">Team Lead Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    className={inputCls(!!leaderErrors.name)}
                                    value={leader.name}
                                    onChange={e => updateLeader('name', e.target.value)}
                                />
                                {leaderErrors.name && <p className="text-red-500 text-xs mt-1">{leaderErrors.name}</p>}
                            </div>

                            {/* College Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">College Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sona College of Technology"
                                    className={inputCls(!!leaderErrors.collegeName)}
                                    value={leader.collegeName}
                                    onChange={e => updateLeader('collegeName', e.target.value)}
                                />
                                {leaderErrors.collegeName && <p className="text-red-500 text-xs mt-1">{leaderErrors.collegeName}</p>}
                            </div>

                            {/* State + Pincode Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1.5">College State <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tamil Nadu"
                                        className={inputCls(!!leaderErrors.collegeState)}
                                        value={leader.collegeState}
                                        onChange={e => updateLeader('collegeState', e.target.value)}
                                    />
                                    {leaderErrors.collegeState && <p className="text-red-500 text-xs mt-1">{leaderErrors.collegeState}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1.5">College Pincode <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 636005"
                                        maxLength={6}
                                        className={inputCls(!!leaderErrors.collegePincode)}
                                        value={leader.collegePincode}
                                        onChange={e => updateLeader('collegePincode', e.target.value.replace(/\D/g, ''))}
                                    />
                                    {leaderErrors.collegePincode && <p className="text-red-500 text-xs mt-1">{leaderErrors.collegePincode}</p>}
                                </div>
                            </div>

                            {/* Dept + Year Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Department <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CSE"
                                        className={inputCls(!!leaderErrors.department)}
                                        value={leader.department}
                                        onChange={e => updateLeader('department', e.target.value)}
                                    />
                                    {leaderErrors.department && <p className="text-red-500 text-xs mt-1">{leaderErrors.department}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Year <span className="text-red-400">*</span></label>
                                    <select
                                        className={inputCls(!!leaderErrors.year)}
                                        value={leader.year}
                                        onChange={e => updateLeader('year', e.target.value)}
                                    >
                                        <option value="">Select year</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                    {leaderErrors.year && <p className="text-red-500 text-xs mt-1">{leaderErrors.year}</p>}
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1.5">WhatsApp Number <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400 text-sm font-medium">+91</span>
                                    <input
                                        type="tel"
                                        placeholder="10-digit number"
                                        maxLength={10}
                                        className={`${inputCls(!!leaderErrors.whatsappNumber)} pl-12`}
                                        value={leader.whatsappNumber}
                                        onChange={e => updateLeader('whatsappNumber', e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                {leaderErrors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{leaderErrors.whatsappNumber}</p>}
                            </div>
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNext}
                            className="w-full mt-8 bg-[#1e3a8a] hover:bg-blue-800 text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            Continue to Team Members <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* STEP 2: Team Members + Workshop */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Members Section */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center">
                                    <Users size={32} className="text-[#1e3a8a]" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
                                <p className="text-gray-400 text-sm mt-1">Add up to 3 team members</p>
                            </div>

                            <div className="space-y-5">
                                {members.map((member, idx) => (
                                    <div key={idx} className="relative bg-gray-50 rounded-xl p-5 border border-gray-100">
                                        {/* Member Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold text-[#1e3a8a] uppercase tracking-wider flex items-center gap-1.5">
                                                <GraduationCap size={14} />
                                                Member {idx + 1}
                                            </span>
                                            {members.length > 1 && (
                                                <button
                                                    onClick={() => removeMember(idx)}
                                                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {/* Name */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-400">*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="Full name"
                                                    className={inputCls(!!memberErrors[idx]?.name)}
                                                    value={member.name}
                                                    onChange={e => updateMember(idx, 'name', e.target.value)}
                                                />
                                                {memberErrors[idx]?.name && <p className="text-red-500 text-xs mt-1">{memberErrors[idx].name}</p>}
                                            </div>

                                            {/* Dept + Year Row */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Department <span className="text-red-400">*</span></label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. CSE"
                                                        className={inputCls(!!memberErrors[idx]?.department)}
                                                        value={member.department}
                                                        onChange={e => updateMember(idx, 'department', e.target.value)}
                                                    />
                                                    {memberErrors[idx]?.department && <p className="text-red-500 text-xs mt-1">{memberErrors[idx].department}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Year <span className="text-red-400">*</span></label>
                                                    <select
                                                        className={inputCls(!!memberErrors[idx]?.year)}
                                                        value={member.year}
                                                        onChange={e => updateMember(idx, 'year', e.target.value)}
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="1st Year">1st Year</option>
                                                        <option value="2nd Year">2nd Year</option>
                                                        <option value="3rd Year">3rd Year</option>
                                                        <option value="4th Year">4th Year</option>
                                                    </select>
                                                    {memberErrors[idx]?.year && <p className="text-red-500 text-xs mt-1">{memberErrors[idx].year}</p>}
                                                </div>
                                            </div>

                                            {/* WhatsApp */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp Number <span className="text-red-400">*</span></label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-gray-400 text-sm font-medium">+91</span>
                                                    <input
                                                        type="tel"
                                                        placeholder="10-digit number"
                                                        maxLength={10}
                                                        className={`${inputCls(!!memberErrors[idx]?.whatsappNumber)} pl-12`}
                                                        value={member.whatsappNumber}
                                                        onChange={e => updateMember(idx, 'whatsappNumber', e.target.value.replace(/\D/g, ''))}
                                                    />
                                                </div>
                                                {memberErrors[idx]?.whatsappNumber && <p className="text-red-500 text-xs mt-1">{memberErrors[idx].whatsappNumber}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Member Button */}
                                {members.length < 3 && (
                                    <button
                                        onClick={addMember}
                                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-[#1e3a8a] hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                    >
                                        <Plus size={16} /> Add Member ({members.length}/3)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Workshop Preference */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <GraduationCap size={20} className="text-[#1e3a8a]" />
                                ML Model Training Workshop
                            </h3>
                            <p className="text-gray-400 text-sm mb-5">Interested in attending our Machine Learning training workshop?</p>

                            {/* Willingness Checkbox */}
                            <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-blue-50/30 hover:border-blue-200 transition group">
                                <input
                                    type="checkbox"
                                    checked={workshop.willing}
                                    onChange={e => setWorkshop({ willing: e.target.checked, mode: e.target.checked ? workshop.mode : null })}
                                    className="mt-0.5 w-5 h-5 text-[#1e3a8a] border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-[#1e3a8a] transition">
                                        Yes, I am willing to attend the ML Model Training Workshop
                                    </span>
                                    <p className="text-xs text-gray-400 mt-0.5">Learn how to build ML models for IPL score prediction</p>
                                </div>
                            </label>

                            {/* Mode Selection (shown only if willing) */}
                            {workshop.willing && (
                                <div className="mt-4 pl-4 border-l-2 border-blue-200 space-y-3 animate-fade-in">
                                    <p className="text-sm font-medium text-gray-600 mb-2">Preferred Mode:</p>
                                    <div className="flex gap-3">
                                        {(['online', 'offline'] as const).map(mode => (
                                            <label
                                                key={mode}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold
                          ${workshop.mode === mode
                                                        ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a] shadow-md shadow-blue-500/10'
                                                        : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:bg-blue-50/30'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="workshopMode"
                                                    value={mode}
                                                    checked={workshop.mode === mode}
                                                    onChange={() => setWorkshop({ ...workshop, mode })}
                                                    className="sr-only"
                                                />
                                                {mode === 'online' ? '💻' : '🏫'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-bold border border-gray-200 transition flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={18} /> Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-[2] py-3.5 bg-[#1e3a8a] hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} /> Complete Setup
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamSetup;
