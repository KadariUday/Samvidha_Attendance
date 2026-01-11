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
            const response = await fetch('http://localhost:8000/api/attendance', {
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
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass w-full max-w-md p-8 rounded-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Samvidha Attendance
                        </h1>
                        <p className="text-slate-400 mt-2">Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    value={credentials.username}
                                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="23951AXXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Login
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-2xl">
                <div>
                    <h2 className="text-2xl font-bold text-white">Welcome, {data.student_info.Name || 'Student'}</h2>
                    <p className="text-slate-400">Roll No: {data.student_info.Rollno}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs uppercase text-slate-500 tracking-wider">Semester</p>
                        <p className="font-semibold">{data.student_info.Semester || 'N/A'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Course Average"
                    value={`${data.overall_course_avg}%`}
                    icon={<TrendingUp className="text-blue-400" />}
                    gradient="from-blue-500/20 to-cyan-500/20"
                />
                <StatCard
                    title="Biometric Total"
                    value={`${data.biometric?.biometric_percentage || 0}%`}
                    icon={<Fingerprint className="text-purple-400" />}
                    gradient="from-purple-500/20 to-pink-500/20"
                />
                <StatCard
                    title="Days Present"
                    value={data.biometric?.biometric_present || 0}
                    icon={<CheckCircle2 className="text-emerald-400" />}
                    gradient="from-emerald-500/20 to-teal-500/20"
                />
                <StatCard
                    title="Academic Year"
                    value={data.student_info['Academic Year'] || 'N/A'}
                    icon={<BookOpen className="text-amber-400" />}
                    gradient="from-amber-500/20 to-orange-500/20"
                />
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 gap-8">
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Course Attendance Breakdown
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-sm">
                                    <th className="p-4 font-medium">Course Name</th>
                                    <th className="p-4 font-medium">Conducted</th>
                                    <th className="p-4 font-medium">Attended</th>
                                    <th className="p-4 font-medium">Percentage</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {data.course_attendance.map((course, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <p className="font-medium text-slate-200">{course['Course Name']}</p>
                                            <p className="text-xs text-slate-500">{course['Course Code']}</p>
                                        </td>
                                        <td className="p-4 text-slate-300">{course['Conducted']}</td>
                                        <td className="p-4 text-slate-300">{course['Attended']}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden w-24">
                                                    <div
                                                        className={`h-full rounded-full ${paramsToColor(course['Attendance %'])}`}
                                                        style={{ width: `${course['Attendance %']}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold">{course['Attendance %']}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${course['Status'] === 'Satisfactory'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {course['Status']}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, gradient }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`glass p-6 rounded-2xl relative overflow-hidden group`}
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
        <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <h4 className="text-3xl font-bold tracking-tight text-white">{value}</h4>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                {icon}
            </div>
        </div>
    </motion.div>
);

const paramsToColor = (percent) => {
    const p = parseFloat(percent);
    if (p >= 75) return 'bg-emerald-500';
    if (p >= 65) return 'bg-amber-500';
    return 'bg-red-500';
};

export default App;
