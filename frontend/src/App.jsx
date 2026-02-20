import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
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
    Loader2,
    XCircle,
    Github,
    Linkedin,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


// Main Application Component

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [activeTab, setActiveTab] = useState('home');
    const [targetPercentage, setTargetPercentage] = useState(75);

    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchAttendanceData = async (userCreds) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userCreds),
            });
            const result = await response.json();
            if (result.success) {
                setData(result.data);
                setLastUpdated(new Date().toLocaleTimeString());
                return true;
            } else {
                setError(result.detail || 'Failed to fetch data');
                return false;
            }
        } catch (err) {
            setError('Could not connect to backend server');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const success = await fetchAttendanceData(credentials);
        if (success) {
            setIsLoggedIn(true);
        }
    };

    const handleRefresh = () => {
        fetchAttendanceData(credentials);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setData(null);
        setCredentials({ username: '', password: '' });
        setActiveTab('home');
        setLastUpdated(null);
    };

    // 3D Rotation Variants
    const pageVariants = {
        initial: (direction) => ({
            rotateY: direction > 0 ? 90 : -90,
            opacity: 0,
            scale: 0.8,
            x: direction > 0 ? 100 : -100
        }),
        animate: {
            rotateY: 0,
            opacity: 1,
            scale: 1,
            x: 0,
            transition: {
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 20
            }
        },
        exit: (direction) => ({
            rotateY: direction > 0 ? -90 : 90,
            opacity: 0,
            scale: 0.8,
            x: direction > 0 ? -100 : 100,
            transition: {
                duration: 0.5,
                ease: "easeInOut"
            }
        })
    };

    // Determine direction for animation
    const [direction, setDirection] = useState(0);

    const switchTab = (newTab) => {
        if (newTab === activeTab) return;
        const tabs = ['home', 'bunks', 'register'];
        const oldIndex = tabs.indexOf(activeTab);
        const newIndex = tabs.indexOf(newTab);
        setDirection(newIndex > oldIndex ? 1 : -1);
        setActiveTab(newTab);
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
                {/* Background ambient shapes */}
                <div className="login-bg-shape w-96 h-96 bg-primary/20 rounded-full top-[-100px] left-[-100px] absolute" />
                <div
                    className="login-bg-shape w-96 h-96 bg-secondary/20 rounded-full bottom-[-100px] right-[-100px] absolute"
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

                <div className="flex-1 flex items-center justify-center w-full">
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
                <Footer />
                <Analytics />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-x-hidden page-container">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            </div>

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-slate-950/80">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/5">
                            <Fingerprint className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                                Samvidha
                            </h1>
                            <span className="text-xs font-medium text-blue-400/80">Attendance</span>
                        </div>
                    </div>

                    {/* User Profile & Refresh */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-right hidden md:block border-r border-white/10 pr-6 mr-1">
                            <p className="text-sm font-medium text-white">{data.student_info.Name || 'Student'}</p>
                            <div className="flex items-center justify-end gap-2 text-xs text-slate-500 font-mono">
                                <span>{data.student_info.Rollno || data.student_info['Roll No']}</span>
                                {lastUpdated && <span className="text-blue-400 opacity-60">• {lastUpdated}</span>}
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className={`p-2.5 rounded-xl text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-300 transition-all border border-transparent hover:border-blue-500/20 active:scale-95 ${isLoading ? 'animate-pulse' : ''}`}
                            title="Refresh Data"
                        >
                            <TrendingUp className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20 active:scale-95"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Dashboard */}
            <div className="sticky top-20 z-40 bg-slate-950/50 backdrop-blur-md border-b border-white/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-2 py-1.5">
                    <nav className="flex items-center justify-start md:justify-center gap-1 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => switchTab('home')}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1 flex-shrink-0 border ${activeTab === 'home'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <BookOpen className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Home</span>
                        </button>
                        <button
                            onClick={() => switchTab('bunks')}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1 flex-shrink-0 border ${activeTab === 'bunks'
                                ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                                : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Bunk Board</span>
                        </button>
                        <button
                            onClick={() => switchTab('register')}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1 flex-shrink-0 border ${activeTab === 'register'
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Attendance Register</span>
                        </button>

                    </nav>
                </div>
            </div>

            {/* 3D Content Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative z-10 perspective-1000">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={activeTab}
                        custom={direction}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="transform-style-3d min-h-[calc(100vh-140px)]"
                    >
                        {activeTab === 'home' ? (
                            <div className="space-y-8">
                                {/* Welcome Banner moved from Header */}
                                <div className="glass neon-border-purple rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-500" />

                                    <div className="relative z-10">
                                        <h2 className="text-3xl font-bold text-white mb-2">
                                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{data.student_info.Name}</span>
                                        </h2>
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <span>SEMESTER {data.student_info.Semester || '6'}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                            <span>{data.student_info['Academic Year'] || '2025-26'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stat Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <NeonStatCard
                                        title="Overall Attendance"
                                        value={`${data.overall_course_avg}%`}
                                        icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
                                        color="blue"
                                        delay={0.1}
                                    />
                                    <NeonStatCard
                                        title="Biometric Total"
                                        value={`${data.biometric?.biometric_percentage || 0}%`}
                                        icon={<Fingerprint className="w-6 h-6 text-purple-400" />}
                                        color="purple"
                                        delay={0.2}
                                    />
                                    {data.biometric && data.biometric.biometric_percentage < 75 && (
                                        <NeonStatCard
                                            title="Biometric Goal"
                                            value={`Attend ${calculateBunkStats(data.biometric.biometric_adjusted, data.biometric.biometric_present, 75).count} Days`}
                                            description="To Reach 75% Biometric"
                                            icon={<Fingerprint className="w-6 h-6 text-emerald-400" />}
                                            color="emerald"
                                            delay={0.25}
                                        />
                                    )}
                                    <NeonStatCard
                                        title="Days Present"
                                        value={data.biometric?.biometric_present || 0}
                                        icon={<CheckCircle2 className="w-6 h-6 text-cyan-400" />}
                                        color="cyan"
                                        delay={0.3}
                                    />
                                    <NeonStatCard
                                        title="Days Absent"
                                        value={(data.biometric?.biometric_adjusted - data.biometric?.biometric_present) || 0}
                                        icon={<XCircle className="w-6 h-6 text-rose-400" />}
                                        color="rose"
                                        delay={0.4}
                                    />
                                    <NeonStatCard
                                        title="Academic Year"
                                        value={data.student_info['Academic Year'] || '2025-26'}
                                        icon={<BookOpen className="w-6 h-6 text-orange-400" />}
                                        color="orange"
                                        delay={0.5}
                                    />
                                </div>

                                {/* Attendance Table */}
                                <div className="glass neon-border-pink rounded-3xl overflow-hidden p-1">
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
                                                    <th className="p-6 font-medium tracking-wide">To Attend</th>
                                                    <th className="p-6 font-medium tracking-wide text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {data.course_attendance.map((course, idx) => (
                                                    <tr key={idx} className="group table-row-hover transition-colors border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
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
                                                        <td className="p-6">
                                                            <span className="text-slate-300 font-semibold">
                                                                {parseFloat(course['Attendance %']) < 75 ? (
                                                                    <span className="text-amber-400">
                                                                        {calculateBunkStats(course['Conducted'], course['Attended'], 75).count}
                                                                        <span className="text-[10px] ml-1 opacity-60">Classes</span>
                                                                    </span>
                                                                ) : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <StatusPill status={course['Status']} percentage={course['Attendance %']} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'bunks' ? (
                            <div className="space-y-8">
                                {/* Bunk Header */}
                                <div className="glass neon-border-cyan rounded-3xl p-8 relative overflow-hidden">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <h2 className="text-3xl font-bold text-white mb-2">Bunk Analysis Board</h2>
                                            <p className="text-slate-400">Strategic attendance planning. Target: <span className="text-cyan-400 font-bold">{targetPercentage}%</span></p>
                                        </div>

                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <span>Set Goal</span>
                                                <span className="text-cyan-400">{targetPercentage}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="60"
                                                max="90"
                                                step="5"
                                                value={targetPercentage}
                                                onChange={(e) => setTargetPercentage(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-600">
                                                <span>60%</span>
                                                <span>90%</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 self-center">
                                            <AlertCircle className="w-8 h-8 text-cyan-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data.course_attendance.map((course, idx) => {
                                        const stats = calculateBunkStats(course['Conducted'], course['Attended'], targetPercentage);
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="glass p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 group"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1 mr-4">
                                                        <h4 className="font-bold text-white text-lg leading-tight mb-1">{course['Course Name']}</h4>
                                                        <p className="text-xs text-slate-500 font-mono">{course['Course Code']}</p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${stats.safe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {course['Attendance %']}%
                                                    </div>
                                                </div>

                                                <div className={`flex items-center gap-4 p-4 rounded-2xl mb-4 ${stats.safe
                                                    ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20'
                                                    : 'bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20'}`}>

                                                    <div className={`p-3 rounded-xl shadow-lg ${stats.safe ? 'bg-emerald-500/20 shadow-emerald-500/10' : 'bg-red-500/20 shadow-red-500/10'}`}>
                                                        {stats.safe ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <AlertCircle className="w-6 h-6 text-red-400" />}
                                                    </div>

                                                    <div>
                                                        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${stats.safe ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {stats.safe ? 'Safe to Bunk' : 'Must Attend'}
                                                        </p>
                                                        <p className="text-3xl font-bold text-white tracking-tight">
                                                            {stats.count}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${stats.safe ? 'bg-emerald-400' : 'bg-red-400'}`}
                                                        style={{ width: `${Math.min(100, (parseFloat(course['Attendance %']) / 75) * 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                    <span>0%</span>
                                                    <span>Target 75%</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : activeTab === 'register' ? (
                            <div className="space-y-8">
                                {/* Register Header */}
                                <div className="glass neon-border-indigo rounded-3xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10">
                                        <h2 className="text-3xl font-bold text-white mb-2">Attendance Register</h2>
                                        <p className="text-slate-400">Detailed period-wise attendance history</p>
                                    </div>
                                </div>

                                {/* Register Table */}
                                <div className="glass neon-border-indigo rounded-3xl overflow-hidden p-1">
                                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-indigo-400" />
                                            <h3 className="text-xl font-bold text-white tracking-wide">Historical Logs</h3>
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                            Scroll laterally for more dates →
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                                            <thead>
                                                <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-white/5 bg-slate-900/40">
                                                    {(data.register && data.register.length > 0) ?
                                                        Object.keys(data.register[0]).map((header, idx) => (
                                                            <th key={idx} className={`p-4 font-bold border-r border-white/10 last:border-r-0 ${header === 'Subject' ? 'sticky left-0 z-20 bg-slate-900/90 backdrop-blur-md w-64 border-r border-white/20' :
                                                                header === 'S.No' || header === 'Date' ? 'w-16 text-center' : 'w-12 text-center'
                                                                }`}>
                                                                {header}
                                                            </th>
                                                        ))
                                                        : <th className="p-6 font-medium tracking-wide">No Data Available</th>
                                                    }
                                                </tr>
                                            </thead>
                                            <tbody className="text-[11px] md:text-xs">
                                                {data.register && data.register.length > 0 ? (
                                                    data.register.map((entry, rowIdx) => (
                                                        <tr key={rowIdx} className="group transition-colors border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                                            {Object.entries(entry).map(([key, val], colIdx) => {
                                                                const isHeader = key === 'Subject' || key === 'S.No' || key === 'Date';
                                                                const valStr = val.toString();
                                                                const isAbsent = !isHeader && (valStr.includes('A') || valStr.toLowerCase().includes('absent'));
                                                                const isPresent = !isHeader && !isAbsent && !isNaN(val) && val !== '' && val !== '-' && val !== '0';

                                                                return (
                                                                    <td key={colIdx} className={`p-3 relative border-r border-white/5 last:border-r-0 ${key === 'Subject' ? 'sticky left-0 z-10 bg-slate-950/80 backdrop-blur-md font-semibold text-white border-r border-white/10' : 'text-center'
                                                                        }`}>
                                                                        <div className={`
                                                                            flex flex-col items-center justify-center rounded-lg py-1.5 transition-all
                                                                            ${isAbsent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                                                                            ${isPresent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : ''}
                                                                            ${!isAbsent && !isPresent && !isHeader ? 'text-slate-600 opacity-40' : ''}
                                                                        `}>
                                                                            {val}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="100%" className="p-12 text-center text-slate-500">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <AlertCircle className="w-10 h-10 opacity-20" />
                                                                <p>No register entries found for this session.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : null}



                    </motion.div>
                </AnimatePresence>


            </main>
            <Footer />
            <Analytics />
        </div >
    );
};

const Footer = () => (
    <footer className="w-full py-8 mt-auto border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
            <p className="text-slate-500 text-sm font-medium">
                Maintained By <span className="text-blue-400">Kadari Uday</span>
            </p>

            <div className="flex items-center gap-4">
                <a
                    href="https://github.com/KadariUday"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all active:scale-95 group"
                    title="GitHub"
                >
                    <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold tracking-wide">GitHub</span>
                </a>

                <a
                    href="https://www.linkedin.com/in/kadariuday"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-[#0077b5] hover:bg-[#0077b5]/10 hover:border-[#0077b5]/20 transition-all active:scale-95 group"
                    title="LinkedIn"
                >
                    <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold tracking-wide">LinkedIn</span>
                </a>
            </div>
        </div>
    </footer>
);

const calculateBunkStats = (conductedStr, attendedStr, targetPct = 75) => {
    const conducted = parseInt(conductedStr);
    const attended = parseInt(attendedStr);
    const target = targetPct / 100;
    const current = attended / conducted;

    if (current >= target) {
        // Safe: How many can be bunked?
        // Formula: floor((Attended / Target) - Conducted)
        const canBunk = Math.floor((attended / target) - conducted);
        return { safe: true, count: canBunk };
    } else {
        // Danger: How many need to attend?
        // Formula: ceiling((Target * Conducted - Attended) / (1 - Target))
        const needToAttend = Math.ceil((target * conducted - attended) / (1 - target));
        return { safe: false, count: needToAttend };
    }
};

const NeonStatCard = ({ title, value, description, icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`glass neon-border-${color} p-5 rounded-3xl relative overflow-hidden group flex flex-col justify-between h-32 md:h-36`}
    >
        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/20 rounded-full blur-2xl group-hover:bg-${color}-500/30 transition-colors`} />

        <div className="flex justify-between items-start z-10 mb-2">
            <span className="text-slate-400 text-xs font-medium tracking-wide uppercase">{title}</span>
            <div className={`p-1.5 rounded-lg border border-${color}-500/20 bg-${color}-500/10`}>
                {icon}
            </div>
        </div>

        <div className="z-10 flex flex-col justify-end flex-grow">
            <div className="flex items-baseline gap-2 flex-wrap">
                <h4 className="text-xl md:text-2xl font-bold text-white tracking-tight neon-text-glow break-words leading-tight">
                    {value}
                </h4>
                {title.includes("Overall") && (
                    <TrendingUp className="w-4 h-4 text-green-400 mb-1" />
                )}
            </div>
            {description && (
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-medium truncate">{description}</p>
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
