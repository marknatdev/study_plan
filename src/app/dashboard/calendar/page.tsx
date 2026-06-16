"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  ExternalLink
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "../plan/plan.module.css";

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

interface TaskWithPlan extends Task {
  planId: string;
  planTitle: string;
  isCompleted: boolean;
}

export default function GlobalCalendarPage() {
  const [tasks, setTasks] = useState<TaskWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const supabase = createClient();

  const fetchAllPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from("study_plans")
      .select("*");

    if (!error && data) {
      let allTasks: TaskWithPlan[] = [];
      data.forEach((row: any) => {
        const planData = row.plan_data as PlanData;
        const completedTasks = new Set(row.completed_tasks || []);
        
        if (planData && planData.tasks) {
          planData.tasks.forEach((task) => {
            allTasks.push({
              ...task,
              planId: row.id,
              planTitle: row.title,
              isCompleted: completedTasks.has(task.day),
            });
          });
        }
      });
      setTasks(allTasks);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

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
    return tasks.filter((t) => t.date === dateStr);
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

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <span className="spinner" />
        <p>Loading all schedules...</p>
      </div>
    );
  }

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
      <h1>Global Calendar</h1>
      <p className={styles.planSummary}>View all your study schedules merged in one place.</p>

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
                style={{ minHeight: "120px" }}
              >
                <div className={styles.calendarDayNumber}>{dayNum}</div>
                {dayTasks.map((task, idx) => (
                  <Link
                    href={`/dashboard/plan/${task.planId}`}
                    key={idx}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className={`${styles.calendarTask} ${getCategoryClass(
                        task.category
                      )}`}
                      style={{ opacity: task.isCompleted ? 0.6 : 1 }}
                      title={`${task.planTitle}\n${task.title}: ${task.description}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.planTitle}
                        </span>
                        {task.isCompleted && <Check size={10} />}
                      </div>
                      <div style={{ marginTop: 2, fontSize: "0.8rem", whiteSpace: "normal", lineHeight: 1.2 }}>
                        {task.title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
