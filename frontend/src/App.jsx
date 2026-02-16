import React, { useState, useEffect } from 'react';
import {
    User,
    Lock,
    LogOut,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    BookOpen,
    Fingerprint,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            const result = await response.json();
            if (result.success) {
                setData(result.data);
                setIsLoggedIn(true);
            } else {
                setError(result.detail || 'Login failed');
            }
        } catch (err) {
            setError('Could not connect to backend server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setData(null);
        setCredentials({ username: '', password: '' });
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background ambient shapes */}
                <div className="login-bg-shape w-96 h-96 bg-primary/20 rounded-full top-[-100px] left-[-100px]" />
                <div
                    className="login-bg-shape w-96 h-96 bg-secondary/20 rounded-full bottom-[-100px] right-[-100px]"
                    style={{ animationDelay: '2s' }}
                />

                {/* Grid overlay for texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                {/* Waves Container */}
                <div className="absolute bottom-0 left-0 right-0 z-0">
                    <svg className="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
                        viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
                        <defs>
                            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                        </defs>
                        <g className="parallax">
                            <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(59, 130, 246, 0.7)" />
                            <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(139, 92, 246, 0.5)" />
                            <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(59, 130, 246, 0.3)" />
                            <use xlinkHref="#gentle-wave" x="48" y="7" fill="rgba(139, 92, 246, 0.1)" />
                        </g>
                    </svg>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="glass w-full max-w-md p-8 md:p-10 rounded-3xl relative z-10 border border-white/10 shadow-2xl backdrop-blur-xl"
                >
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <div className="mb-6 inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/5">
                            <Fingerprint className="w-10 h-10 text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                            Samvidha
                            <span className="block text-2xl font-normal text-blue-300/90 mt-1">Attendance</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-4">Welcome! Please log in to continue.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="group">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                        className="w-full glass-input rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 outline-none"
                                        placeholder="Username"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        className="w-full glass-input rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder:text-slate-500 outline-none"
                                        placeholder="Password"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                            ) : (
                                <>
                                    LOGIN
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 relative z-10">
            {/* Header */}
            <div className="glass neon-border-purple rounded-3xl p-6 md:px-10 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight neon-text-glow">
                        Welcome, <span className="uppercase">{data.student_info.Name || 'Student'}</span>
                    </h2>
                    <p className="text-slate-400 mt-2 text-lg">Roll No: <span className="text-slate-200 font-mono">{data.student_info.Rollno || data.student_info['Roll No']}</span></p>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                        <p className="text-xs uppercase text-slate-500 tracking-wider font-semibold">Semester</p>
                        <p className="text-2xl font-bold text-white">{data.student_info.Semester || '6'}</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="group px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-semibold transition-all flex items-center gap-2 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <NeonStatCard
                    title="Overall Attendance"
                    value={`${data.overall_course_avg}%`}
                    icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
                    color="blue"
                    delay={0}
                />
                <NeonStatCard
                    title="Biometric Total"
                    value={`${data.biometric?.biometric_percentage || 0}%`}
                    icon={<Fingerprint className="w-6 h-6 text-purple-400" />}
                    color="purple"
                    delay={0.1}
                />
                <NeonStatCard
                    title="Days Present"
                    value={data.biometric?.biometric_present || 0}
                    icon={<CheckCircle2 className="w-6 h-6 text-cyan-400" />}
                    color="cyan"
                    delay={0.2}
                />
                <NeonStatCard
                    title="Academic Year"
                    value={data.student_info['Academic Year'] || '2025-26'}
                    icon={<BookOpen className="w-6 h-6 text-orange-400" />}
                    color="orange"
                    delay={0.3}
                />
            </div>

            {/* Attendance Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass neon-border-pink rounded-3xl overflow-hidden p-1"
            >
                <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-white/5">
                    <BookOpen className="w-5 h-5 text-pink-400" />
                    <h3 className="text-xl font-bold text-white tracking-wide">Course Attendance Breakdown</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-sm border-b border-white/5">
                                <th className="p-6 font-medium tracking-wide">Course Name</th>
                                <th className="p-6 font-medium tracking-wide">Conducted</th>
                                <th className="p-6 font-medium tracking-wide">Attended</th>
                                <th className="p-6 font-medium tracking-wide w-1/4">Percentage</th>
                                <th className="p-6 font-medium tracking-wide text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {data.course_attendance.map((course, idx) => (
                                <tr key={idx} className="group table-row-hover transition-colors border-b border-white/5 last:border-0">
                                    <td className="p-6">
                                        <p className="font-semibold text-white text-base mb-1">{course['Course Name']}</p>
                                        <p className="text-xs text-slate-500 font-mono">{course['Course Code']}</p>
                                    </td>
                                    <td className="p-6 text-slate-300 font-medium">{course['Conducted']}</td>
                                    <td className="p-6 text-slate-300 font-medium">{course['Attended']}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${course['Attendance %']}%` }}
                                                    transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                                                    className={`h-full rounded-full ${getProgressColor(course['Attendance %'])} shadow-[0_0_10px_currentColor]`}
                                                />
                                            </div>
                                            <span className="font-bold text-white w-12 text-right">{course['Attendance %']}%</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <StatusPill status={course['Status']} percentage={course['Attendance %']} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Bunk Analysis Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass neon-border-cyan rounded-3xl overflow-hidden p-6 md:p-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-2xl font-bold text-white tracking-wide">Bunk Analysis <span className="text-sm font-normal text-slate-400 ml-2">(Target: 75%)</span></h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.course_attendance.map((course, idx) => {
                        const stats = calculateBunkStats(course['Conducted'], course['Attended']);
                        return (
                            <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <h4 className="font-semibold text-white mb-1 truncate" title={course['Course Name']}>{course['Course Name']}</h4>
                                <p className="text-xs text-slate-500 mb-4">{course['Course Code']}</p>

                                <div className={`flex items-center gap-3 p-3 rounded-xl ${stats.safe
                                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'}`}>

                                    <div className={`p-2 rounded-lg ${stats.safe ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                        {stats.safe ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                                    </div>

                                    <div>
                                        <p className={`text-sm font-bold ${stats.safe ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {stats.safe ? 'Available Bunks' : 'Need to Attend'}
                                        </p>
                                        <p className="text-2xl font-bold text-white">
                                            {stats.count} <span className="text-xs font-normal text-slate-400">classes</span>
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 mt-3 pl-1">
                                    Current: <span className={stats.safe ? 'text-emerald-400' : 'text-red-400'}>{course['Attendance %']}%</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

const calculateBunkStats = (conductedStr, attendedStr) => {
    const conducted = parseInt(conductedStr);
    const attended = parseInt(attendedStr);
    const target = 0.75;
    const current = attended / conducted;

    if (current >= target) {
        // Safe: How many can be bunked?
        // Formula: floor((Attended / 0.75) - Conducted)
        // Simplified: floor((4 * Attended) / 3 - Conducted)
        const canBunk = Math.floor((4 * attended) / 3 - conducted);
        return { safe: true, count: canBunk };
    } else {
        // Danger: How many need to attend?
        // Formula: ceiling((0.75 * Conducted - Attended) / 0.25)
        // Simplified: ceiling(3 * Conducted - 4 * Attended)
        const needToAttend = Math.ceil(3 * conducted - 4 * attended);
        return { safe: false, count: needToAttend };
    }
};

const NeonStatCard = ({ title, value, icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`glass neon-border-${color} p-6 rounded-3xl relative overflow-hidden group flex flex-col justify-between h-32 md:h-40`}
    >
        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/20 rounded-full blur-2xl group-hover:bg-${color}-500/30 transition-colors`} />

        <div className="flex justify-between items-start z-10">
            <span className="text-slate-400 text-sm font-medium tracking-wide">{title}</span>
            <div className={`p-2 rounded-lg border border-${color}-500/20 bg-${color}-500/10`}>
                {icon}
            </div>
        </div>

        <div className="z-10 flex items-baseline gap-2">
            <h4 className="text-3xl md:text-4xl font-bold text-white tracking-tight neon-text-glow">
                {value}
            </h4>
            {title.includes("Overall") && (
                <TrendingUp className="w-5 h-5 text-green-400 mb-1" />
            )}
        </div>
    </motion.div>
);

const StatusPill = ({ status, percentage }) => {
    let colorClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";
    let glowClass = "";

    // Determine status based on text or percentage if "Status" field is generic
    const p = parseFloat(percentage);

    if (status === 'Satisfactory' || p >= 75) {
        colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        glowClass = "shadow-[0_0_10px_rgba(16,185,129,0.1)]";
    } else if (status === 'Condonation' || (p >= 65 && p < 75)) {
        colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
        glowClass = "shadow-[0_0_10px_rgba(245,158,11,0.1)]";
    } else {
        colorClass = "bg-red-500/10 text-red-400 border-red-500/30";
        glowClass = "shadow-[0_0_10px_rgba(239,68,68,0.1)]";
    }

    return (
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${colorClass} ${glowClass}`}>
            {status}
        </span>
    );
};

const getProgressColor = (percent) => {
    const p = parseFloat(percent);
    if (p >= 75) return 'bg-emerald-400';
    if (p >= 65) return 'bg-amber-400';
    return 'bg-red-500';
};

export default App;
