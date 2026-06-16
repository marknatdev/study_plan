"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  List,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Target,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "../plan.module.css";

interface Task {
  day: number;
  date: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedHours: number;
}

interface PlanData {
  title: string;
  summary: string;
  totalDays: number;
  startDate: string;
  endDate: string;
  tasks: Task[];
}

export default function PlanViewPage() {
  const params = useParams();
  const planId = params?.id as string;
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const supabase = createClient();

  const fetchPlan = useCallback(async () => {
    const { data, error } = await supabase
      .from("study_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!error && data) {
      setPlan(data.plan_data as PlanData);
      if (data.completed_tasks) {
        setCompletedTasks(new Set(data.completed_tasks));
      }
      // Set calendar to plan's start month
      if (data.start_date) {
        setCurrentMonth(new Date(data.start_date));
      }
    }
    setLoading(false);
  }, [planId, supabase]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const toggleTask = async (day: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(day)) {
      newCompleted.delete(day);
    } else {
      newCompleted.add(day);
    }
    setCompletedTasks(newCompleted);

    // Save to DB
    await supabase
      .from("study_plans")
      .update({ completed_tasks: Array.from(newCompleted) })
      .eq("id", planId);
  };

  const getProgress = () => {
    if (!plan) return 0;
    return Math.round((completedTasks.size / plan.tasks.length) * 100);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getTasksForDate = (dateStr: string) => {
    if (!plan) return [];
    return plan.tasks.filter((t) => t.date === dateStr);
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "study":
        return styles.taskStudy;
      case "review":
        return styles.taskReview;
      case "practice":
        return styles.taskPractice;
      case "rest":
        return styles.taskRest;
      default:
        return styles.taskStudy;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "study":
        return styles.study;
      case "review":
        return styles.review;
      case "practice":
        return styles.practice;
      case "rest":
        return styles.rest;
      default:
        return styles.study;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <span className="spinner" />
        <p>Loading study plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.loadingState}>
        <p>Plan not found.</p>
        <Link href="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const progress = getProgress();
  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const today = new Date().toISOString().split("T")[0];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className={`page-enter ${styles.planPage}`}>
      <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Plans
      </Link>

      <h1>{plan.title}</h1>
      <p className={styles.planSummary}>{plan.summary}</p>

      <div className={styles.planMeta}>
        <span className={`badge badge-primary ${styles.metaBadge}`}>
          <Calendar size={12} /> {plan.startDate} → {plan.endDate}
        </span>
        <span className={`badge badge-accent ${styles.metaBadge}`}>
          <Target size={12} /> {plan.totalDays} days
        </span>
        <span className={`badge badge-warning ${styles.metaBadge}`}>
          <TrendingUp size={12} /> {progress}% complete
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div className={styles.progressText}>
          <span>Progress</span>
          <span>
            {completedTasks.size} / {plan.tasks.length} tasks
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewToggleBtn} ${
            view === "calendar" ? styles.viewToggleBtnActive : ""
          }`}
          onClick={() => setView("calendar")}
        >
          <Calendar size={14} /> Calendar
        </button>
        <button
          className={`${styles.viewToggleBtn} ${
            view === "list" ? styles.viewToggleBtnActive : ""
          }`}
          onClick={() => setView("list")}
        >
          <List size={14} /> List
        </button>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div className={styles.calendarContainer}>
          <div className={styles.calendarNav}>
            <h3>{monthName}</h3>
            <div className={styles.calendarNavBtns}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={prevMonth}>
                <ChevronLeft size={18} />
              </button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={nextMonth}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className={styles.calendarGrid}>
            {dayNames.map((d) => (
              <div key={d} className={styles.calendarDayHeader}>
                {d}
              </div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className={`${styles.calendarDay} ${styles.calendarDayEmpty}`}
              />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(
                currentMonth.getMonth() + 1
              ).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayTasks = getTasksForDate(dateStr);
              const isToday = dateStr === today;

              return (
                <div
                  key={dayNum}
                  className={`${styles.calendarDay} ${
                    isToday ? styles.calendarDayToday : ""
                  }`}
                >
                  <div className={styles.calendarDayNumber}>{dayNum}</div>
                  {dayTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className={`${styles.calendarTask} ${getCategoryClass(
                        task.category
                      )}`}
                      title={`${task.title}: ${task.description}`}
                    >
                      {task.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className={styles.taskList}>
          {plan.tasks.map((task) => {
            const isCompleted = completedTasks.has(task.day);
            return (
              <div
                key={task.day}
                className={`glass-card ${styles.taskItem} ${
                  isCompleted ? styles.taskItemCompleted : ""
                }`}
              >
                <div
                  className={`${styles.taskDayBadge} ${getCategoryBadgeClass(
                    task.category
                  )}`}
                >
                  {task.day}
                  <span>Day</span>
                </div>
                <div className={styles.taskContent}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.taskDesc}>{task.description}</div>
                  <div className={styles.taskMeta}>
                    <span className={styles.taskMetaItem}>
                      <Calendar size={12} /> {task.date}
                    </span>
                    <span className={styles.taskMetaItem}>
                      <Clock size={12} /> {task.estimatedHours}h
                    </span>
                    <span
                      className={`badge ${
                        task.priority === "high"
                          ? "badge-warning"
                          : task.priority === "medium"
                          ? "badge-primary"
                          : "badge-accent"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className={styles.taskCheck}>
                  <button
                    className={`${styles.checkbox} ${
                      isCompleted ? styles.checkboxChecked : ""
                    }`}
                    onClick={() => toggleTask(task.day)}
                    title={isCompleted ? "Mark incomplete" : "Mark complete"}
                  >
                    {isCompleted && <Check size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
