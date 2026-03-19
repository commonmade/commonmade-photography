import React, { useState, useEffect } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
} from "date-fns";
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, type Schedule, type ScheduleCategory } from "../../lib/firestoreService";
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Trash2, Edit2 } from "lucide-react";

export const CATEGORY_COLORS: Record<string, string> = {
    "촬영예정": "bg-blue-50 text-blue-600 border-blue-200",
    "촬영완료": "bg-green-50 text-green-600 border-green-200",
    "메일발송": "bg-yellow-50 text-yellow-600 border-yellow-200",
    "메일수신": "bg-orange-50 text-orange-600 border-orange-200",
    "앨범제작": "bg-purple-50 text-purple-600 border-purple-200",
    "출고완료": "bg-gray-100 text-gray-600 border-gray-200",
};

export default function ScheduleManager() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Form state
    const [formTitle, setFormTitle] = useState("");
    const [formMemo, setFormMemo] = useState("");
    const [formCategory, setFormCategory] = useState<ScheduleCategory>("촬영예정");

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const data = await getSchedules();
            setSchedules(data);
        } catch (err) {
            console.error("Failed to load schedules", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const openModal = (date: Date, schedule?: Schedule) => {
        setSelectedDate(date);
        if (schedule) {
            setEditingId(schedule.id);
            setFormTitle(schedule.title);
            setFormMemo(schedule.memo);
            setFormCategory(schedule.category || "촬영예정");
        } else {
            setEditingId(null);
            setFormTitle("");
            setFormMemo("");
            setFormCategory("촬영예정");
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setSelectedDate(null);
        setIsConfirmingDelete(false);
    };

    const handleSave = async () => {
        if (!selectedDate || !formTitle.trim()) return;

        try {
            if (editingId) {
                await updateSchedule(editingId, {
                    title: formTitle,
                    memo: formMemo,
                    category: formCategory,
                });
            } else {
                await addSchedule({
                    title: formTitle,
                    memo: formMemo,
                    date: format(selectedDate, "yyyy-MM-dd"),
                    category: formCategory,
                });
            }
            await loadSchedules();
            closeModal();
        } catch (err) {
            console.error("Failed to save schedule", err);
            alert("스케줄 저장에 실패했습니다.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            console.log("Deleting schedule:", id);
            await deleteSchedule(id);
            await loadSchedules();
            if (editingId === id) closeModal();
        } catch (err) {
            console.error("Failed to delete schedule:", err);
            alert(`삭제 실패: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    // Calendar Cells Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;
    while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
    }

    const currentMonthPrefix = format(currentDate, "yyyy-MM");
    const currentMonthSchedules = schedules
        .filter(s => s.date.startsWith(currentMonthPrefix))
        .sort((a, b) => a.date.localeCompare(b.date));

    const handleCategoryChange = async (id: string, newCategory: ScheduleCategory) => {
        try {
            await updateSchedule(id, { category: newCategory });
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, category: newCategory } : s));
        } catch (err) {
            console.error("Failed to update category:", err);
            alert("카테고리 변경에 실패했습니다.");
        }
    };

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-light tracking-widest uppercase text-black">스케줄 관리</h1>
                    <p className="text-sm text-gray-400 mt-1">촬영 및 미팅 스케줄을 달력에서 관리합니다.</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Calendar Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-lg font-medium text-black w-32 text-center">
                            {format(currentDate, "yyyy년 MM월")}
                        </h2>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        오늘
                    </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
                    {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                        <div key={d} className={`py-3 text-center text-xs font-semibold ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                    {days.map((d, i) => {
                        const dateStr = format(d, "yyyy-MM-dd");
                        const daySchedules = schedules.filter(s => s.date === dateStr);
                        const isCurrentMonth = isSameMonth(d, monthStart);
                        const isToday = isSameDay(d, new Date());
                        const isSunday = d.getDay() === 0;
                        const isSaturday = d.getDay() === 6;

                        return (
                            <div
                                key={d.toString()}
                                className={`min-h-[120px] border-b border-r border-gray-100 p-2 relative group hover:bg-gray-50 transition-colors cursor-pointer ${!isCurrentMonth ? "bg-gray-50/50" : ""
                                    }`}
                                onClick={() => openModal(d)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-black text-white" :
                                        !isCurrentMonth ? "text-gray-300" :
                                            isSunday ? "text-red-500" :
                                                isSaturday ? "text-blue-500" :
                                                    "text-gray-700"
                                        }`}>
                                        {format(d, "d")}
                                    </span>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-black transition-all"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openModal(d);
                                        }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                    {daySchedules.map((schedule) => {
                                        const catColor = schedule.category ? CATEGORY_COLORS[schedule.category] : CATEGORY_COLORS["촬영예정"];
                                        return (
                                            <div
                                                key={schedule.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal(d, schedule);
                                                }}
                                                className={`text-[11px] px-2 py-1 border rounded truncate transition-colors hover:brightness-95 ${catColor}`}
                                            >
                                                {schedule.title}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* List View below Calendar */}
                <div className="border-t border-gray-200 bg-gray-50/50 p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CalendarIcon size={16} />
                        {format(currentDate, "yyyy년 MM월")} 스케줄 목록
                    </h3>
                    {currentMonthSchedules.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-400 bg-white rounded-lg border border-gray-200 shadow-sm">
                            이번 달 스케줄이 없습니다.
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100 mb-2">
                            {currentMonthSchedules.map((schedule) => (
                                <div key={schedule.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer gap-4 sm:gap-0" onClick={() => openModal(new Date(schedule.date), schedule)}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-14 text-center shrink-0">
                                            <span className="text-sm font-semibold text-black">{format(new Date(schedule.date), "M.d")}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-black">{schedule.title}</p>
                                            {schedule.memo && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{schedule.memo}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end sm:justify-start gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                                        <div className="relative">
                                            <select
                                                className={`text-xs px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer appearance-none text-center font-medium ${schedule.category ? CATEGORY_COLORS[schedule.category] : CATEGORY_COLORS["촬영예정"]}`}
                                                value={schedule.category || "촬영예정"}
                                                onChange={(e) => handleCategoryChange(schedule.id, e.target.value as ScheduleCategory)}
                                            >
                                                {Object.keys(CATEGORY_COLORS).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && selectedDate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-lg font-medium text-black flex items-center gap-2">
                                <CalendarIcon size={20} />
                                {format(selectedDate, "yyyy년 MM월 dd일")} 일정
                            </h3>
                            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-black transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                                    일정 제목 *
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                    placeholder="예: 웨딩 스냅 촬영 (홍길동 고객님)"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                                    상태 분류 *
                                </label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white font-medium"
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value as ScheduleCategory)}
                                >
                                    {Object.keys(CATEGORY_COLORS).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
                                    상세 메모
                                </label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors min-h-[120px] resize-none"
                                    placeholder="장소, 시간, 특이사항 등..."
                                    value={formMemo}
                                    onChange={(e) => setFormMemo(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between">
                            {editingId ? (
                                isConfirmingDelete ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-red-500 font-medium">정말 삭제할까요?</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(editingId);
                                            }}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                        >
                                            네, 삭제합니다
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmingDelete(false)}
                                            className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            취소
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsConfirmingDelete(true)}
                                        className="flex items-center gap-2 text-red-500 hover:text-red-600 px-4 py-2 text-sm transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        삭제
                                    </button>
                                )
                            ) : (
                                <div></div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!formTitle.trim()}
                                    className="px-6 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
