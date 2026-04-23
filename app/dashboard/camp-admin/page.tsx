"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CampAdminPage() {
  const registrations = useQuery(api.camp.getRegistrations, {});
  const stats = useQuery(api.camp.getCampStats, {});

  const handleExportContacts = () => {
    if (!registrations) return;
    
    const contacts = registrations.map(r => {
      const childNames = r.children.map((c: any) => c.firstName).join(", ");
      return `${r.parent.firstName} ${r.parent.lastName}\t${r.parent.phone}\t${r.parent.email}\t${childNames}`;
    }).join("\n");
    
    const header = "Parent Name\tPhone\tEmail\tChildren\n";
    navigator.clipboard.writeText(header + contacts);
    alert("Contacts copied to clipboard!");
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDays = (sessions: any) => {
    const parts: string[] = [];
    const weekNames: Record<string, string> = {
      "week1": "A1 (Jun 22-26)",
      "week2": "A2 (Jul 6-10)",
      "week3": "A3 (Jul 20-24)",
      "week4": "A4 (Jul 27-31)",
      "week5": "P1 (TBD)",
      "week6": "P2 (TBD)",
    };
    
    for (const [wk, sess] of Object.entries(sessions || {})) {
      const s = sess as any;
      if (s.selectedDays && s.selectedDays.length > 0) {
        const days = s.selectedDays.map((d: string) => 
          d.substring(0, 3).charAt(0).toUpperCase() + d.substring(1, 3)
        ).join(", ");
        parts.push(`${weekNames[wk]}: ${days}`);
      }
    }
    return parts.join("; ");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Summer Camp 2026 Admin</h1>
        <Button onClick={handleExportContacts}>Export Contacts</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Kids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKids || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgAge?.toFixed(1) || "-"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown by Week */}
      {stats?.weeklyBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Kids Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.weeklyBreakdown).map(([week, days]: [string, any]) => (
                <div key={week}>
                  <div className="font-medium mb-2">{week}</div>
                  <div className="flex gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => (
                      <Badge key={day} variant="outline">
                        {day}: {days[day.toLowerCase()] || 0}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration List */}
      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Child</th>
                  <th className="text-left p-2">Age</th>
                  <th className="text-left p-2">Parent</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Emergency</th>
                  <th className="text-left p-2">Days</th>
                  <th className="text-left p-2">Paid</th>
                </tr>
              </thead>
              <tbody>
                {registrations?.map((reg: any) => 
                  reg.children.map((child: any, idx: number) => (
                    <tr key={`${reg._id}-${idx}`} className="border-b">
                      <td className="p-2">{child.firstName} {child.lastName}</td>
                      <td className="p-2">{child.birthDate ? calculateAge(child.birthDate) : "-"}</td>
                      <td className="p-2">{reg.parent.firstName} {reg.parent.lastName}</td>
                      <td className="p-2">{reg.parent.phone}</td>
                      <td className="p-2">
                        {reg.emergencyContact.name}<br/>
                        <span className="text-xs text-muted-foreground">{reg.emergencyContact.phone}</span>
                      </td>
                      <td className="p-2 text-xs">{formatDays(child.sessions)}</td>
                      <td className="p-2">${reg.pricing.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
