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

// Grade level context for each child
const STUDENT_INFO: Record<string, { name: string; age: number; grade: string }> = {
  anthony: { name: "Anthony Medaglia", age: 12, grade: "7th Grade" },
  roma: { name: "Roma Medaglia", age: 11, grade: "6th Grade" },
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
      const completed = activities.filter(a => a.completed);
      
      // ========== COVER PAGE ==========
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(`Homeschool Progress Report`, 105, 40, { align: "center" });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text(`${monthName} ${selectedYear}`, 105, 55, { align: "center" });
      
      // Family name
      doc.setFontSize(12);
      doc.text(`A & R Academy`, 105, 70, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Anthony (12, 7th Grade) • Roma (11, 6th Grade)`, 105, 80, { align: "center" });
      doc.setTextColor(0);
      
      // Monthly highlights box
      const totalActivities = completed.length;
      const uniqueDays = new Set(completed.map(a => a.date)).size;
      const totalMinutes = completed.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      const uniqueSubjects = new Set(completed.map(a => a.category)).size;
      
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(30, 95, 150, 50, 3, 3, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Monthly Overview", 105, 108, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const stats = [
        `${totalActivities} Activities Completed`,
        `${uniqueDays} Active Learning Days`,
        `${uniqueSubjects} Subject Areas Covered`,
        `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m Total Learning Time`,
      ];
      stats.forEach((stat, i) => {
        doc.text(`• ${stat}`, 45, 118 + (i * 7));
      });
      
      // Group activities by category for narrative
      const byCategory: Record<string, typeof completed> = {};
      for (const a of completed) {
        if (!byCategory[a.category]) byCategory[a.category] = [];
        byCategory[a.category].push(a);
      }
      
      // Generate narrative summary
      const topCategories = Object.entries(byCategory)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 4)
        .map(([cat]) => CATEGORY_LABELS[cat] || cat);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      const narrative = `This month's learning focused on ${topCategories.slice(0, -1).join(", ")}${topCategories.length > 1 ? " and " + topCategories[topCategories.length - 1] : topCategories[0]}.`;
      doc.text(narrative, 105, 160, { align: "center", maxWidth: 160 });
      
      // ========== PER-STUDENT PAGES ==========
      for (const studentKey of ["anthony", "roma"]) {
        doc.addPage();
        const info = STUDENT_INFO[studentKey];
        const studentActivities = completed.filter(a => a.student === studentKey || a.student === "both");
        
        // Student header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(info.name, 14, 25);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Age ${info.age} • ${info.grade} • ${monthName} ${selectedYear}`, 14, 33);
        doc.setTextColor(0);
        
        // Student stats
        const studentDays = new Set(studentActivities.map(a => a.date)).size;
        const studentMinutes = studentActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
        
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(14, 40, 85, 25, 2, 2, "F");
        doc.setFontSize(9);
        doc.text(`${studentActivities.length} activities • ${studentDays} days • ${Math.floor(studentMinutes / 60)}h ${studentMinutes % 60}m`, 20, 52);
        
        // Subject breakdown for this student
        const studentByCategory: Record<string, number> = {};
        for (const a of studentActivities) {
          studentByCategory[a.category] = (studentByCategory[a.category] || 0) + 1;
        }
        
        const subjectRows = Object.entries(studentByCategory)
          .sort(([,a], [,b]) => b - a)
          .map(([cat, count]) => [CATEGORY_LABELS[cat] || cat, count.toString()]);
        
        if (subjectRows.length > 0) {
          autoTable(doc, {
            startY: 75,
            head: [["Subject", "Activities"]],
            body: subjectRows,
            theme: "striped",
            headStyles: { fillColor: [79, 70, 229], fontSize: 9 }, // Indigo for individual
            bodyStyles: { fontSize: 8 },
            tableWidth: 80,
            margin: { left: 14 },
          });
        }
        
        // Unique activities list for this student
        const uniqueActivities = [...new Set(studentActivities.map(a => a.activity))].slice(0, 15);
        const actY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 120;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Activities This Month", 14, actY);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        uniqueActivities.forEach((act, i) => {
          if (actY + 8 + (i * 5) < 280) {
            doc.text(`• ${act}`, 14, actY + 8 + (i * 5));
          }
        });
        if (uniqueActivities.length < [...new Set(studentActivities.map(a => a.activity))].length) {
          doc.setTextColor(100);
          doc.text(`...and ${[...new Set(studentActivities.map(a => a.activity))].length - 15} more`, 14, actY + 8 + (15 * 5));
          doc.setTextColor(0);
        }
      }
      
      // ========== DETAILED LOG PAGE ==========
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detailed Activity Log", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`${monthName} ${selectedYear} • All Activities`, 14, 28);
      doc.setTextColor(0);
      
      // Group by date
      const byDate: Record<string, typeof completed> = {};
      for (const a of completed) {
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
            a.notes ? a.notes.slice(0, 40) + (a.notes.length > 40 ? "..." : "") : "",
          ]);
        }
      }

      if (dateRows.length > 0) {
        autoTable(doc, {
          startY: 35,
          head: [["Date", "Student", "Subject", "Activity", "Notes"]],
          body: dateRows,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 16 },
            2: { cellWidth: 28 },
            3: { cellWidth: 38 },
            4: { cellWidth: "auto" },
          },
          margin: { left: 14, right: 14 },
        });
      } else {
        doc.text("No activities recorded this month.", 14, 50);
      }

      // ========== FOOTER ON ALL PAGES ==========
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text(
          `Generated ${new Date().toLocaleDateString()} • A & R Academy Homeschool • Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
        doc.setTextColor(0);
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
