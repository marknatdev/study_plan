"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Calendar, Clock, ChevronRight, Trash2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface StudyPlan {
  id: string;
  title: string;
  summary: string;
  start_date: string;
  end_date: string;
  total_days: number;
  created_at: string;
}

export default function DashboardPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("study_plans")
      .select("id, title, summary, start_date, end_date, total_days, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPlans(data);
    }
    setLoading(false);
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    const { error } = await supabase.from("study_plans").delete().eq("id", id);
    if (!error) {
      setPlans(plans.filter((p) => p.id !== id));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="page-enter">
      <div className={styles.header}>
        <div>
          <h1 className="section-heading lg">My Study Plans</h1>
          <p className={styles.subtitle}>
            {plans.length > 0
              ? `You have ${plans.length} plan${plans.length > 1 ? "s" : ""}`
              : "Create your first AI-powered study plan"}
          </p>
        </div>
        <Link href="/dashboard/create" className="btn btn-primary">
          <PlusCircle size={18} /> New Plan
        </Link>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <span className="spinner" />
          <p>Loading your plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FileText size={48} />
          </div>
          <h2>No study plans yet</h2>
          <p>
            Create your first plan by describing a competition or uploading a
            syllabus PDF. Our AI will craft a personalized study roadmap for you.
          </p>
          <Link href="/dashboard/create" className="btn btn-primary btn-lg">
            <PlusCircle size={18} /> Create Your First Plan
          </Link>
        </div>
      ) : (
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <div key={plan.id} className={`glass-card ${styles.planCard}`}>
              <div className={styles.planCardHeader}>
                <h3>{plan.title}</h3>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => deletePlan(plan.id)}
                  title="Delete plan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className={styles.planSummary}>{plan.summary}</p>
              <div className={styles.planMeta}>
                <span className={styles.metaItem}>
                  <Calendar size={14} />
                  {formatDate(plan.start_date)} — {formatDate(plan.end_date)}
                </span>
                <span className={styles.metaItem}>
                  <Clock size={14} />
                  {plan.total_days} days
                </span>
              </div>
              <Link
                href={`/dashboard/plan/${plan.id}`}
                className={`btn btn-secondary btn-sm ${styles.viewBtn}`}
              >
                View Plan <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
