"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  Flame,
  Zap,
  Activity,
  Pill,
  TrendingUp,
  Droplet,
  Droplets,
  Plus,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";

// Biomarker reference ranges (copy from backend for client-side use)
const BIOMARKER_RANGES: Record<string, {
  name: string;
  unit: string;
  category: string;
  optimal: [number, number];
  normal: [number, number];
  description: string;
}> = {
  // Lipids
  "total-cholesterol": { name: "Total Cholesterol", unit: "mg/dL", category: "lipids", optimal: [125, 180], normal: [125, 200], description: "Total blood cholesterol" },
  "ldl": { name: "LDL Cholesterol", unit: "mg/dL", category: "lipids", optimal: [50, 70], normal: [50, 100], description: "Low-density lipoprotein" },
  "hdl": { name: "HDL Cholesterol", unit: "mg/dL", category: "lipids", optimal: [60, 100], normal: [40, 100], description: "High-density lipoprotein" },
  "triglycerides": { name: "Triglycerides", unit: "mg/dL", category: "lipids", optimal: [50, 100], normal: [50, 150], description: "Blood fat levels" },
  "apoB": { name: "ApoB", unit: "mg/dL", category: "lipids", optimal: [40, 70], normal: [40, 90], description: "Cardiovascular risk marker" },
  "lp-a": { name: "Lp(a)", unit: "nmol/L", category: "lipids", optimal: [0, 30], normal: [0, 75], description: "Genetic cardiovascular risk" },
  // Metabolic
  "glucose-fasting": { name: "Fasting Glucose", unit: "mg/dL", category: "metabolic", optimal: [70, 90], normal: [70, 100], description: "Blood sugar after fasting" },
  "hba1c": { name: "HbA1c", unit: "%", category: "metabolic", optimal: [4.0, 5.3], normal: [4.0, 5.7], description: "3-month average blood sugar" },
  "fasting-insulin": { name: "Fasting Insulin", unit: "μIU/mL", category: "metabolic", optimal: [2, 5], normal: [2, 10], description: "Insulin resistance marker" },
  "homa-ir": { name: "HOMA-IR", unit: "index", category: "metabolic", optimal: [0.5, 1.0], normal: [0.5, 2.0], description: "Insulin resistance index" },
  // Inflammation
  "hs-crp": { name: "hs-CRP", unit: "mg/L", category: "inflammation", optimal: [0, 0.5], normal: [0, 1.0], description: "Inflammation marker" },
  "homocysteine": { name: "Homocysteine", unit: "μmol/L", category: "inflammation", optimal: [5, 7], normal: [5, 12], description: "Cardiovascular inflammation" },
  "ferritin": { name: "Ferritin", unit: "ng/mL", category: "inflammation", optimal: [40, 100], normal: [20, 200], description: "Iron storage" },
  // Thyroid
  "tsh": { name: "TSH", unit: "mIU/L", category: "thyroid", optimal: [1.0, 2.0], normal: [0.4, 4.0], description: "Thyroid stimulating hormone" },
  "free-t4": { name: "Free T4", unit: "ng/dL", category: "thyroid", optimal: [1.0, 1.5], normal: [0.8, 1.8], description: "Free thyroxine" },
  "free-t3": { name: "Free T3", unit: "pg/mL", category: "thyroid", optimal: [3.0, 4.0], normal: [2.3, 4.2], description: "Free triiodothyronine" },
  // Vitamins
  "vitamin-d": { name: "Vitamin D", unit: "ng/mL", category: "vitamins", optimal: [50, 80], normal: [30, 100], description: "Vitamin D status" },
  "vitamin-b12": { name: "Vitamin B12", unit: "pg/mL", category: "vitamins", optimal: [500, 1000], normal: [200, 1100], description: "B12 levels" },
  "folate": { name: "Folate", unit: "ng/mL", category: "vitamins", optimal: [10, 25], normal: [3, 30], description: "Folate / B9 levels" },
  "magnesium-rbc": { name: "RBC Magnesium", unit: "mg/dL", category: "vitamins", optimal: [5.5, 6.5], normal: [4.2, 6.8], description: "Intracellular magnesium" },
  "iron": { name: "Iron", unit: "μg/dL", category: "vitamins", optimal: [80, 120], normal: [60, 170], description: "Serum iron" },
  "zinc": { name: "Zinc", unit: "μg/dL", category: "vitamins", optimal: [90, 120], normal: [60, 130], description: "Serum zinc" },
  // Hormones  
  "testosterone-total": { name: "Total Testosterone", unit: "ng/dL", category: "hormones", optimal: [500, 900], normal: [300, 1000], description: "Total testosterone" },
  "dhea-s": { name: "DHEA-S", unit: "μg/dL", category: "hormones", optimal: [250, 450], normal: [100, 500], description: "DHEA-sulfate" },
  "cortisol-am": { name: "Cortisol (AM)", unit: "μg/dL", category: "hormones", optimal: [10, 18], normal: [6, 23], description: "Morning cortisol" },
  // Liver
  "alt": { name: "ALT", unit: "U/L", category: "liver", optimal: [10, 25], normal: [7, 40], description: "Liver enzyme" },
  "ast": { name: "AST", unit: "U/L", category: "liver", optimal: [10, 25], normal: [8, 40], description: "Liver enzyme" },
  "ggt": { name: "GGT", unit: "U/L", category: "liver", optimal: [10, 25], normal: [9, 48], description: "Liver enzyme" },
  // Kidney
  "creatinine": { name: "Creatinine", unit: "mg/dL", category: "kidney", optimal: [0.8, 1.1], normal: [0.7, 1.3], description: "Kidney function" },
  "egfr": { name: "eGFR", unit: "mL/min", category: "kidney", optimal: [90, 120], normal: [60, 120], description: "Kidney filtration rate" },
  "bun": { name: "BUN", unit: "mg/dL", category: "kidney", optimal: [10, 16], normal: [7, 20], description: "Blood urea nitrogen" },
  // Blood
  "hemoglobin": { name: "Hemoglobin", unit: "g/dL", category: "blood", optimal: [14, 17], normal: [13, 18], description: "Oxygen carrier" },
  "hematocrit": { name: "Hematocrit", unit: "%", category: "blood", optimal: [42, 50], normal: [38, 54], description: "Red blood cell %" },
  "wbc": { name: "WBC", unit: "K/μL", category: "blood", optimal: [4.5, 7.5], normal: [4.0, 11.0], description: "White blood cells" },
  "platelets": { name: "Platelets", unit: "K/μL", category: "blood", optimal: [175, 300], normal: [150, 400], description: "Platelet count" },
};

const CATEGORIES = [
  { id: "lipids", name: "Lipids", color: "bg-rose-500", lightBg: "bg-rose-100", text: "text-rose-700", Icon: Heart },
  { id: "metabolic", name: "Metabolic", color: "bg-amber-500", lightBg: "bg-amber-100", text: "text-amber-700", Icon: Flame },
  { id: "inflammation", name: "Inflammation", color: "bg-orange-500", lightBg: "bg-orange-100", text: "text-orange-700", Icon: Zap },
  { id: "thyroid", name: "Thyroid", color: "bg-purple-500", lightBg: "bg-purple-100", text: "text-purple-700", Icon: Activity },
  { id: "vitamins", name: "Vitamins", color: "bg-emerald-500", lightBg: "bg-emerald-100", text: "text-emerald-700", Icon: Pill },
  { id: "hormones", name: "Hormones", color: "bg-blue-500", lightBg: "bg-blue-100", text: "text-blue-700", Icon: TrendingUp },
  { id: "liver", name: "Liver", color: "bg-yellow-500", lightBg: "bg-yellow-100", text: "text-yellow-700", Icon: Droplet },
  { id: "kidney", name: "Kidney", color: "bg-cyan-500", lightBg: "bg-cyan-100", text: "text-cyan-700", Icon: Droplets },
  { id: "blood", name: "Blood", color: "bg-red-500", lightBg: "bg-red-100", text: "text-red-700", Icon: Droplet },
];

// Get status of a biomarker value
function getStatus(value: number, range: { optimal: [number, number]; normal: [number, number] }) {
  if (value >= range.optimal[0] && value <= range.optimal[1]) return "optimal";
  if (value >= range.normal[0] && value <= range.normal[1]) return "normal";
  return "concern";
}

function getStatusColor(status: string) {
  if (status === "optimal") return { bg: "bg-green-500", light: "bg-green-100", text: "text-green-700", border: "border-green-400" };
  if (status === "normal") return { bg: "bg-yellow-500", light: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-400" };
  return { bg: "bg-red-500", light: "bg-red-100", text: "text-red-700", border: "border-red-400" };
}

function StatusIcon({ status }: { status: string }) {
  if (status === "optimal") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "normal") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <AlertCircle className="h-4 w-4 text-red-500" />;
}

// Visual bar showing where value falls in range
function RangeBar({ value, optimal, normal }: { value: number; optimal: [number, number]; normal: [number, number] }) {
  const min = Math.min(normal[0] * 0.5, value * 0.8);
  const max = Math.max(normal[1] * 1.3, value * 1.2);
  const range = max - min;
  
  const optimalLeft = ((optimal[0] - min) / range) * 100;
  const optimalWidth = ((optimal[1] - optimal[0]) / range) * 100;
  const normalLeft = ((normal[0] - min) / range) * 100;
  const normalWidth = ((normal[1] - normal[0]) / range) * 100;
  const valuePos = ((value - min) / range) * 100;

  return (
    <div className="relative h-3 bg-red-200 rounded-full overflow-hidden">
      {/* Normal range (yellow) */}
      <div 
        className="absolute h-full bg-yellow-300"
        style={{ left: `${normalLeft}%`, width: `${normalWidth}%` }}
      />
      {/* Optimal range (green) */}
      <div 
        className="absolute h-full bg-green-400"
        style={{ left: `${optimalLeft}%`, width: `${optimalWidth}%` }}
      />
      {/* Value marker */}
      <div 
        className="absolute w-1 h-full bg-slate-900 rounded"
        style={{ left: `${Math.max(0, Math.min(99, valuePos))}%` }}
      />
    </div>
  );
}

export function BioMapView({ userId }: { userId: Id<"users"> }) {
  const [showAddResult, setShowAddResult] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [labName, setLabName] = useState("");
  const [entryValues, setEntryValues] = useState<Record<string, string>>({});

  const results = useQuery(api.biomarkers.getResults, { userId }) || [];
  const latestResult = results[0];
  
  const addResult = useMutation(api.biomarkers.addResult);

  // Group latest biomarkers by category
  const biomarkersByCategory: Record<string, Array<{ key: string; value: number; unit: string; status: string }>> = {};
  if (latestResult) {
    for (const marker of latestResult.biomarkers) {
      const range = BIOMARKER_RANGES[marker.name];
      if (!range) continue;
      const status = getStatus(marker.value, range);
      if (!biomarkersByCategory[marker.category]) biomarkersByCategory[marker.category] = [];
      biomarkersByCategory[marker.category].push({
        key: marker.name,
        value: marker.value,
        unit: marker.unit,
        status,
      });
    }
  }

  // Count statuses
  const statusCounts = { optimal: 0, normal: 0, concern: 0 };
  if (latestResult) {
    for (const marker of latestResult.biomarkers) {
      const range = BIOMARKER_RANGES[marker.name];
      if (!range) continue;
      const status = getStatus(marker.value, range);
      statusCounts[status as keyof typeof statusCounts]++;
    }
  }

  const handleAddResult = () => {
    const biomarkers = Object.entries(entryValues)
      .filter(([_, v]) => v && !isNaN(Number(v)))
      .map(([key, value]) => {
        const range = BIOMARKER_RANGES[key];
        return {
          name: key,
          value: Number(value),
          unit: range?.unit || "",
          category: range?.category || "other",
        };
      });

    if (biomarkers.length > 0) {
      addResult({
        userId,
        testDate,
        labName: labName || undefined,
        biomarkers,
      });
      setShowAddResult(false);
      setEntryValues({});
      setLabName("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">BioMap</h1>
          <p className="text-sm text-zinc-400">
            {latestResult 
              ? `Last updated: ${new Date(latestResult.testDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : "Track your blood work and biomarkers"
            }
          </p>
        </div>
        <Button onClick={() => setShowAddResult(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Results
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-900/30 border-green-700">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-3xl font-bold text-green-400">{statusCounts.optimal}</div>
              <p className="text-sm text-green-300">Optimal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-900/30 border-yellow-700">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
            <div>
              <div className="text-3xl font-bold text-yellow-400">{statusCounts.normal}</div>
              <p className="text-sm text-yellow-300">Borderline</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-700">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <div className="text-3xl font-bold text-red-400">{statusCounts.concern}</div>
              <p className="text-sm text-red-300">Needs Attention</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BioMap Grid */}
      {latestResult ? (
        <div className="grid md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const markers = biomarkersByCategory[cat.id] || [];
            if (markers.length === 0) return null;
            
            const optimalCount = markers.filter(m => m.status === "optimal").length;
            const concernCount = markers.filter(m => m.status === "concern").length;
            
            return (
              <Card key={cat.id} className={`${cat.lightBg} border-2 ${concernCount > 0 ? "border-red-400" : optimalCount === markers.length ? "border-green-400" : "border-yellow-400"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-base flex items-center gap-2 ${cat.text}`}>
                    <cat.Icon className="h-5 w-5" />
                    {cat.name}
                    <Badge className={`ml-auto ${optimalCount === markers.length ? "bg-green-500" : concernCount > 0 ? "bg-red-500" : "bg-yellow-500"} text-white`}>
                      {optimalCount}/{markers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {markers.map((marker) => {
                    const range = BIOMARKER_RANGES[marker.key];
                    const colors = getStatusColor(marker.status);
                    return (
                      <div key={marker.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${cat.text}`}>{range?.name || marker.key}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${colors.text}`}>
                              {marker.value} {marker.unit}
                            </span>
                            <StatusIcon status={marker.status} />
                          </div>
                        </div>
                        <RangeBar value={marker.value} optimal={range?.optimal || [0, 100]} normal={range?.normal || [0, 100]} />
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Optimal: {range?.optimal[0]}-{range?.optimal[1]}</span>
                          <span>Normal: {range?.normal[0]}-{range?.normal[1]}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Blood Work Yet</h3>
            <p className="text-zinc-500 mb-4">Add your lab results to see your BioMap visualization</p>
            <Button onClick={() => setShowAddResult(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Results
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Previous Results */}
      {results.length > 1 && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-base text-zinc-300">Previous Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.slice(1).map((result) => (
                <div key={result._id} className="flex items-center justify-between p-3 rounded bg-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-300">
                      {new Date(result.testDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {result.labName && <Badge variant="outline" className="text-xs">{result.labName}</Badge>}
                  </div>
                  <span className="text-sm text-zinc-400">{result.biomarkers.length} markers</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Results Dialog */}
      <Dialog open={showAddResult} onOpenChange={setShowAddResult}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Lab Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Date & Lab */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Test Date</label>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lab Name (optional)</label>
                <Input
                  placeholder="Quest, LabCorp, etc."
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Biomarker Entry by Category */}
            <Tabs defaultValue="lipids">
              <TabsList className="flex flex-wrap">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {CATEGORIES.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(BIOMARKER_RANGES)
                      .filter(([_, range]) => range.category === cat.id)
                      .map(([key, range]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-sm font-medium">{range.name}</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="any"
                              placeholder={`${range.optimal[0]}-${range.optimal[1]}`}
                              value={entryValues[key] || ""}
                              onChange={(e) => setEntryValues({ ...entryValues, [key]: e.target.value })}
                            />
                            <span className="text-sm text-muted-foreground w-16">{range.unit}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{range.description}</p>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddResult(false)}>Cancel</Button>
              <Button onClick={handleAddResult} className="bg-emerald-600 hover:bg-emerald-700">
                Save Results
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
