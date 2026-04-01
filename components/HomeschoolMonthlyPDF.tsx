"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Props {
  userId: Id<"users">;
}

const CATEGORY_LABELS: Record<string, string> = {
  math: "Mathematics",
  writing: "Language Arts / Writing",
  literature: "Literature / Reading",
  history: "History / Social Studies",
  science: "Science",
  art: "Art",
  music: "Music",
  pe: "Physical Education",
  "life-skills": "Life Skills",
  financial: "Financial Literacy",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function HomeschoolMonthlyPDF({ userId }: Props) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  // Calculate date range for selected month
  const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const endDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${lastDay}`;

  const activities = useQuery(api.homeschoolActivities.getActivitiesForWeek, {
    userId,
    startDate,
    endDate,
  });

  const generatePDF = async () => {
    if (!activities) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const monthName = MONTHS[selectedMonth];
      
      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`Homeschool Progress Report`, 105, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`${monthName} ${selectedYear}`, 105, 30, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`Anthony & Roma Briers`, 105, 38, { align: "center" });
      
      // Summary stats
      const totalActivities = activities.filter(a => a.completed).length;
      const uniqueDays = new Set(activities.filter(a => a.completed).map(a => a.date)).size;
      const totalMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Monthly Summary", 14, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`• Total Activities Completed: ${totalActivities}`, 14, 58);
      doc.text(`• Active Learning Days: ${uniqueDays}`, 14, 65);
      doc.text(`• Total Time Logged: ${Math.round(totalMinutes / 60)} hours ${totalMinutes % 60} minutes`, 14, 72);

      // Group by category
      const byCategory: Record<string, typeof activities> = {};
      for (const a of activities.filter(a => a.completed)) {
        if (!byCategory[a.category]) byCategory[a.category] = [];
        byCategory[a.category].push(a);
      }

      let yPos = 85;

      // Category breakdown table
      const categoryRows = Object.entries(byCategory)
        .sort(([,a], [,b]) => b.length - a.length)
        .map(([cat, acts]) => [
          CATEGORY_LABELS[cat] || cat,
          acts.length.toString(),
          `${acts.reduce((s, a) => s + (a.durationMinutes || 0), 0)} min`,
        ]);

      if (categoryRows.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Subject Area", "Activities", "Time"]],
          body: categoryRows,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Detailed activity log by date
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Activity Log", 14, yPos);
      yPos += 8;

      // Group by date
      const byDate: Record<string, typeof activities> = {};
      for (const a of activities.filter(a => a.completed)) {
        if (!byDate[a.date]) byDate[a.date] = [];
        byDate[a.date].push(a);
      }

      const dateRows: string[][] = [];
      const sortedDates = Object.keys(byDate).sort();
      
      for (const date of sortedDates) {
        const acts = byDate[date];
        const dateObj = new Date(date + "T12:00:00");
        const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        
        for (let i = 0; i < acts.length; i++) {
          const a = acts[i];
          dateRows.push([
            i === 0 ? dateStr : "",
            a.student === "both" ? "Both" : a.student.charAt(0).toUpperCase() + a.student.slice(1),
            CATEGORY_LABELS[a.category] || a.category,
            a.activity,
            a.notes ? a.notes.slice(0, 50) + (a.notes.length > 50 ? "..." : "") : "",
          ]);
        }
      }

      if (dateRows.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [["Date", "Student", "Subject", "Activity", "Notes"]],
          body: dateRows,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 18 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: "auto" },
          },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Generated ${new Date().toLocaleDateString()} • Aspire Homeschool • Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Download
      doc.save(`homeschool-report-${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  // Generate year options (current year and previous)
  const years = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <div className="flex items-center gap-2">
      <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
        <SelectTrigger className="w-[90px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={generatePDF}
        disabled={generating || !activities}
        className="h-8 text-xs"
      >
        {generating ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <FileDown className="h-3 w-3 mr-1" />
        )}
        Export PDF
      </Button>
    </div>
  );
}
