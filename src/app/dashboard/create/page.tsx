"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "./create.module.css";

export default function CreatePlanPage() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }

    setFile(selectedFile);
    setError("");

    // Extract text from PDF using a simple approach
    try {
      const text = await extractTextFromPDF(selectedFile);
      setPdfText(text);
    } catch {
      setError("Could not read PDF. You can still proceed with your text description.");
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Read the PDF as array buffer and extract basic text
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple text extraction from PDF binary
    let text = "";
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(uint8Array);
    
    // Extract text between parentheses (PDF text objects)
    const matches = rawText.match(/\(([^)]+)\)/g);
    if (matches) {
      text = matches
        .map((m) => m.slice(1, -1))
        .filter((t) => t.length > 1 && !/^[\\\/\d.]+$/.test(t))
        .join(" ");
    }

    // If no text found via parentheses, try stream content
    if (text.length < 50) {
      const streamMatches = rawText.match(/stream\n([\s\S]*?)\nendstream/g);
      if (streamMatches) {
        text = streamMatches
          .map((m) => m.replace(/stream\n/, "").replace(/\nendstream/, ""))
          .join(" ")
          .replace(/[^\x20-\x7E\n]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }

    return text.slice(0, 15000); // Limit to 15k chars for API
  };

  const removeFile = () => {
    setFile(null);
    setPdfText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please describe what you want to study.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      if (pdfText) {
        formData.append("pdfText", pdfText);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate plan. Please try again.");
        setLoading(false);
        return;
      }

      if (data.id) {
        router.push(`/dashboard/plan/${data.id}`);
      } else {
        // Plan was generated but not saved — show it via query param
        router.push(`/dashboard/plan/preview?data=${encodeURIComponent(JSON.stringify(data.plan))}`);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`page-enter ${styles.generatingState}`}>
        <div className={styles.generatingAnimation}>
          <div className={styles.generatingRing} />
          <div className={styles.generatingRing} />
          <div className={styles.generatingRing} />
        </div>
        <h2>Generating Your Study Plan...</h2>
        <p>Our AI is analyzing your goals and building a personalized roadmap. This may take 15–30 seconds.</p>
      </div>
    );
  }

  return (
    <div className={`page-enter ${styles.createPage}`}>
      <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back to Plans
      </Link>
      <h1>Create a New Study Plan</h1>
      <p>Describe the competition or exam, and optionally upload a PDF syllabus.</p>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="input-group">
          <label htmlFor="prompt">What are you preparing for?</label>
          <textarea
            id="prompt"
            className="input textarea"
            placeholder="e.g., I'm preparing for the National Math Olympiad in 3 months. I need to cover algebra, geometry, combinatorics, and number theory. I can study 3 hours per day on weekdays and 5 hours on weekends."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ minHeight: "160px" }}
            required
          />
        </div>

        <div className="input-group">
          <label>Upload Syllabus (optional)</label>
          <div className={`${styles.fileUpload} ${file ? styles.fileUploadActive : ""}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <div className={styles.fileUploadIcon}>
                  <FileText size={24} />
                </div>
                <h4>{file.name}</h4>
                <p>{(file.size / 1024).toFixed(1)} KB</p>
                <div className={styles.fileInfo}>
                  {pdfText ? `✓ ${pdfText.split(" ").length} words extracted` : "Processing..."}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  style={{ marginTop: 8 }}
                >
                  <X size={14} /> Remove
                </button>
              </>
            ) : (
              <>
                <div className={styles.fileUploadIcon}>
                  <Upload size={24} />
                </div>
                <h4>Drop your PDF here or click to browse</h4>
                <p>Supports PDF files up to 10MB</p>
              </>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary btn-lg">
            <Sparkles size={18} /> Generate Study Plan
          </button>
        </div>
      </form>
    </div>
  );
}
