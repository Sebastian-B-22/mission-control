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
  academics: "Academics",
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

// Student info
const STUDENT_INFO: Record<string, { name: string; age: number; grade: string }> = {
  anthony: { name: "Anthony Medaglia", age: 12, grade: "6th Grade" },
  roma: { name: "Roma Medaglia", age: 11, grade: "5th Grade" },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Calculate habit consistency metrics (compounding interest angle)
function calculateHabitMetrics(activities: any[], startDate: string, endDate: string) {
  const completed = activities.filter(a => a.completed);
  
  // Calculate active days
  const activeDays = new Set(completed.map(a => a.date));
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const totalDays = Math.ceil((endD.getTime() - startD.getTime()) / 86400000) + 1;
  
  // Find streaks
  const sortedDays = [...activeDays].sort();
  let maxStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i-1]);
    const curr = new Date(sortedDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);
  
  // Category consistency (how many different days each subject was touched)
  const categoryDays: Record<string, Set<string>> = {};
  for (const a of completed) {
    if (!categoryDays[a.category]) categoryDays[a.category] = new Set();
    categoryDays[a.category].add(a.date);
  }
  
  // Most consistent subjects (touched on most different days)
  const consistentSubjects = Object.entries(categoryDays)
    .map(([cat, days]) => ({ category: cat, days: days.size }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 3);
  
  return {
    activeDays: activeDays.size,
    totalDays,
    consistencyRate: Math.round((activeDays.size / totalDays) * 100),
    maxStreak,
    consistentSubjects,
  };
}

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
  
  // Get daily recaps for the month (includes notes + media)
  const recaps = useQuery(api.dailyRecap.getRecapsForRange, {
    userId,
    startDate,
    endDate,
  });
  
  // Get platform notes (Math Academy, Wonder Math, Synthesis, etc.)
  const platformNotes = useQuery(api.homeschoolAgentNotes.getNotesForRange, {
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
      const habitMetrics = calculateHabitMetrics(activities, startDate, endDate);
      
      // Collect all photos from recaps
      const allPhotos: { url: string; date: string }[] = [];
      for (const recap of (recaps || [])) {
        for (const url of (recap.mediaUrls || [])) {
          allPhotos.push({ url, date: recap.date });
        }
      }
      
      // ========== COVER PAGE ==========
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(`Homeschool Recap Report`, 105, 35, { align: "center" });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text(`${monthName} ${selectedYear}`, 105, 50, { align: "center" });
      
      // Family name
      doc.setFontSize(12);
      doc.text(`A & R Academy`, 105, 65, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Anthony (12, 6th Grade) • Roma (11, 5th Grade)`, 105, 75, { align: "center" });
      doc.setTextColor(0);
      
      // ===== COMPOUNDING LEARNING BOX =====
      doc.setFillColor(250, 245, 255); // Light purple - growth/compounding theme
      doc.roundedRect(20, 85, 170, 55, 3, 3, "F");
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(88, 28, 135); // Purple
      doc.text("Compounding Learning", 105, 98, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60);
      
      // Habit stats in two columns
      doc.text(`Consistency Rate: ${habitMetrics.consistencyRate}%`, 35, 110);
      doc.text(`Active Days: ${habitMetrics.activeDays} of ${habitMetrics.totalDays}`, 35, 118);
      doc.text(`Best Streak: ${habitMetrics.maxStreak} days`, 35, 126);
      
      doc.text(`Most Consistent Subjects:`, 115, 110);
      habitMetrics.consistentSubjects.forEach((s, i) => {
        doc.text(`• ${CATEGORY_LABELS[s.category] || s.category} (${s.days} days)`, 120, 118 + (i * 7));
      });
      
      doc.setTextColor(0);
      
      // Monthly overview box
      const totalActivities = completed.length;
      const uniqueDays = new Set(completed.map(a => a.date)).size;
      const totalMinutes = completed.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      const uniqueSubjects = new Set(completed.map(a => a.category)).size;
      
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(20, 148, 170, 45, 3, 3, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Monthly Overview", 105, 160, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const stats = [
        `${totalActivities} Activities • ${uniqueSubjects} Subjects • ${uniqueDays} Days`,
        `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m Total Learning Time`,
      ];
      stats.forEach((stat, i) => {
        doc.text(stat, 105, 170 + (i * 8), { align: "center" });
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
      
      // Recap notes excerpt (if any)
      const recapNotes = (recaps || []).filter(r => r.notes?.trim()).slice(0, 3);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      let narrative = `This month's learning focused on ${topCategories.slice(0, -1).join(", ")}${topCategories.length > 1 ? " and " + topCategories[topCategories.length - 1] : topCategories[0]}.`;
      if (habitMetrics.maxStreak >= 5) {
        narrative += ` Great consistency with a ${habitMetrics.maxStreak}-day learning streak!`;
      }
      doc.text(narrative, 105, 205, { align: "center", maxWidth: 160 });
      
      // ========== PHOTO GALLERY (if photos exist) ==========
      if (allPhotos.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Learning Moments", 14, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`${allPhotos.length} photo${allPhotos.length > 1 ? "s" : ""} from ${monthName}`, 14, 28);
        doc.setTextColor(0);
        
        // Note: jsPDF can embed images but needs base64 data
        // For now, list the photo URLs with dates
        let photoY = 40;
        for (const photo of allPhotos.slice(0, 6)) { // Max 6 per page
          const dateObj = new Date(photo.date + "T12:00:00");
          const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(14, photoY, 180, 25, 2, 2, "F");
          doc.setFontSize(9);
          doc.text(`* ${dateStr}`, 20, photoY + 10);
          doc.setTextColor(100);
          doc.setFontSize(8);
          doc.text(photo.url.slice(0, 70) + "...", 20, photoY + 18);
          doc.setTextColor(0);
          photoY += 30;
        }
        
        if (allPhotos.length > 6) {
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(`...and ${allPhotos.length - 6} more photos`, 14, photoY + 5);
          doc.setTextColor(0);
        }
      }
      
      // ========== PER-STUDENT PAGES ==========
      for (const studentKey of ["anthony", "roma"]) {
        doc.addPage();
        const info = STUDENT_INFO[studentKey];
        const studentActivities = completed.filter(a => a.student === studentKey || a.student === "both");
        const studentMetrics = calculateHabitMetrics(
          activities.filter(a => a.student === studentKey || a.student === "both"),
          startDate,
          endDate
        );
        
        // Student header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(info.name, 14, 25);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Age ${info.age} • ${info.grade} • ${monthName} ${selectedYear}`, 14, 33);
        doc.setTextColor(0);
        
        // Student consistency card
        doc.setFillColor(250, 245, 255);
        doc.roundedRect(14, 40, 90, 30, 2, 2, "F");
        doc.setFontSize(9);
        doc.setTextColor(88, 28, 135);
        doc.text(`${studentMetrics.consistencyRate}% consistency`, 20, 52);
        doc.text(`${studentMetrics.maxStreak}-day best streak`, 20, 62);
        doc.setTextColor(0);
        
        // Student stats
        const studentDays = new Set(studentActivities.map(a => a.date)).size;
        const studentMinutes = studentActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
        
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(110, 40, 85, 30, 2, 2, "F");
        doc.setFontSize(9);
        doc.text(`${studentActivities.length} activities`, 116, 52);
        doc.text(`${studentDays} days • ${Math.floor(studentMinutes / 60)}h ${studentMinutes % 60}m`, 116, 62);
        
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
            startY: 80,
            head: [["Subject", "Activities"]],
            body: subjectRows,
            theme: "striped",
            headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            tableWidth: 90,
            margin: { left: 14 },
          });
        }
        
        // Unique activities list for this student
        const uniqueActivities = [...new Set(studentActivities.map(a => a.activity))].slice(0, 12);
        const actY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 120;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Activities This Month", 14, actY);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        uniqueActivities.forEach((act, i) => {
          if (actY + 8 + (i * 5) < 275) {
            doc.text(`• ${act}`, 14, actY + 8 + (i * 5));
          }
        });
        const totalUnique = [...new Set(studentActivities.map(a => a.activity))].length;
        if (uniqueActivities.length < totalUnique) {
          doc.setTextColor(100);
          doc.text(`...and ${totalUnique - 12} more`, 14, actY + 8 + (12 * 5));
          doc.setTextColor(0);
        }
        
        // Platform feedback for this student
        const studentPlatformNotes = (platformNotes || []).filter(
          (n) => n.student === studentKey || n.student === "both"
        );
        
        if (studentPlatformNotes.length > 0) {
          const platformY = actY + 8 + (Math.min(uniqueActivities.length, 12) * 5) + 15;
          
          if (platformY < 240) {
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Platform Feedback", 14, platformY);
            
            let noteY = platformY + 8;
            for (const note of studentPlatformNotes.slice(0, 3)) {
              if (noteY > 270) break;
              
              const sourceLabel = note.source === "math-academy" ? "Math Academy" :
                note.source === "wonder-math" ? "Wonder Math" :
                note.source === "synthesis-teams" ? "Synthesis" : note.source;
              
              doc.setFillColor(note.sentiment === "positive" ? 240 : note.sentiment === "needs-attention" ? 254 : 248, 
                             note.sentiment === "positive" ? 253 : note.sentiment === "needs-attention" ? 243 : 250,
                             note.sentiment === "positive" ? 244 : note.sentiment === "needs-attention" ? 235 : 252);
              doc.roundedRect(14, noteY, 180, 20, 2, 2, "F");
              
              doc.setFontSize(8);
              doc.setFont("helvetica", "bold");
              doc.text(`${sourceLabel} • ${new Date(note.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, 18, noteY + 7);
              
              doc.setFont("helvetica", "normal");
              doc.setFontSize(7);
              const contentText = note.highlights?.slice(0, 2).join(" • ") || note.content.slice(0, 80);
              doc.text(contentText, 18, noteY + 14);
              
              noteY += 24;
            }
          }
        }
      }
      
      // ========== PLATFORM FEEDBACK SUMMARY PAGE ==========
      if ((platformNotes || []).length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Learning Platform Feedback", 14, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Teacher updates & platform reports from ${monthName}`, 14, 28);
        doc.setTextColor(0);
        
        // Group by source
        const bySource: Record<string, typeof platformNotes> = {};
        for (const note of (platformNotes || [])) {
          if (!bySource[note.source]) bySource[note.source] = [];
          bySource[note.source].push(note);
        }
        
        let sourceY = 40;
        
        for (const [source, notes] of Object.entries(bySource)) {
          if (sourceY > 250) break;
          
          const sourceLabel = source === "math-academy" ? "Math Academy" :
            source === "wonder-math" ? "Wonder Math" :
            source === "synthesis-teams" ? "Synthesis Teams" : source;
          
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(sourceLabel, 14, sourceY);
          sourceY += 8;
          
          for (const note of notes.slice(0, 4)) {
            if (sourceY > 265) break;
            
            const dateStr = new Date(note.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const studentName = note.student === "anthony" ? "Anthony" : note.student === "roma" ? "Roma" : "Both";
            
            // Color based on sentiment
            const bgColor = note.sentiment === "positive" ? [240, 253, 244] : 
                           note.sentiment === "needs-attention" ? [254, 243, 235] : [248, 250, 252];
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.roundedRect(14, sourceY, 180, 18, 2, 2, "F");
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(`${dateStr} • ${studentName}`, 18, sourceY + 6);
            
            // Sentiment indicator
            if (note.sentiment === "positive") {
              doc.setTextColor(34, 197, 94);
              doc.text("OK", 178, sourceY + 6);
            } else if (note.sentiment === "needs-attention") {
              doc.setTextColor(234, 88, 12);
              doc.text("!", 180, sourceY + 6);
            }
            doc.setTextColor(0);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            const highlights = note.highlights?.slice(0, 2).join(" • ") || note.content.slice(0, 100);
            doc.text(highlights.slice(0, 90), 18, sourceY + 13);
            
            sourceY += 22;
          }
          
          sourceY += 8;
        }
      }
      
      // ========== DAILY RECAP NOTES (if any) ==========
      if (recapNotes.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Daily Recap Notes", 14, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Highlights from ${monthName}`, 14, 28);
        doc.setTextColor(0);
        
        let recapY = 40;
        for (const recap of recapNotes.slice(0, 5)) {
          const dateObj = new Date(recap.date + "T12:00:00");
          const dateStr = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          
          doc.setFillColor(248, 250, 252);
          const noteLines = doc.splitTextToSize(recap.notes, 165);
          const boxHeight = Math.min(noteLines.length * 5 + 15, 50);
          doc.roundedRect(14, recapY, 180, boxHeight, 2, 2, "F");
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(dateStr, 20, recapY + 10);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const truncatedNotes = noteLines.slice(0, 6).join("\n");
          doc.text(truncatedNotes, 20, recapY + 18);
          
          recapY += boxHeight + 8;
          if (recapY > 250) break;
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
          ]);
        }
      }

      if (dateRows.length > 0) {
        autoTable(doc, {
          startY: 35,
          head: [["Date", "Student", "Subject", "Activity"]],
          body: dateRows,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 18 },
            2: { cellWidth: 35 },
            3: { cellWidth: "auto" },
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
