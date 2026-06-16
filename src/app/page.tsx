import Link from "next/link";
import { BookOpen, Calendar, Sparkles, ArrowRight, Zap } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <div className={styles.navLogo}>
            <div className={styles.navLogoIcon}>
              <BookOpen size={18} color="white" />
            </div>
            StudyForge
          </div>
          <div className={styles.navLinks}>
            <Link href="/auth" className="btn btn-ghost btn-sm">
              <span>Log in</span>
            </Link>
            <Link href="/auth" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`badge badge-primary ${styles.heroBadge}`}>
          <Zap size={12} /> &nbsp;Powered by AI
        </div>
        <h1>
          Master Any <br />
          <span className="gradient-text">Competition</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Upload your syllabus or describe your goal — our AI agent builds a
          personalized, day-by-day study plan mapped to your calendar. Study
          smarter, not harder.
        </p>
        <div className={styles.heroActions}>
          <Link href="/auth" className="btn btn-primary btn-lg">
            Start Planning <ArrowRight size={18} />
          </Link>
          <a href="#features" className="btn btn-secondary btn-lg">
            See How It Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className="container">
          <div className={styles.featuresHeader}>
            <h2 className="section-heading lg">
              Everything You Need to <span className="gradient-text">Win</span>
            </h2>
            <p>Three steps to a winning study strategy.</p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={`glass-card ${styles.featureCard}`}>
              <div className={`${styles.featureIcon} ${styles.purple}`}>
                <Sparkles size={22} />
              </div>
              <h3>AI-Powered Planning</h3>
              <p>
                Describe your competition or upload a PDF syllabus. Our AI agent
                analyzes the content and generates a structured study roadmap
                tailored to your timeline and skill level.
              </p>
            </div>
            <div className={`glass-card ${styles.featureCard}`}>
              <div className={`${styles.featureIcon} ${styles.green}`}>
                <Calendar size={22} />
              </div>
              <h3>Dynamic Calendar</h3>
              <p>
                Your study plan is automatically mapped to an interactive
                calendar. See daily tasks, weekly goals, and milestones at a
                glance. Drag, drop, and reschedule as needed.
              </p>
            </div>
            <div className={`glass-card ${styles.featureCard}`}>
              <div className={`${styles.featureIcon} ${styles.orange}`}>
                <BookOpen size={22} />
              </div>
              <h3>Track Progress</h3>
              <p>
                Mark tasks as complete, track your progress over time, and stay
                motivated with visual indicators. Never lose sight of your
                preparation journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p>© {new Date().getFullYear()} StudyForge. Built with ♥ for learners everywhere.</p>
        </div>
      </footer>
    </>
  );
}
