"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Folder } from "lucide-react";

const defaultProjects = [
  "Finish Tuttle Twins Vol 2 + Liberty Kids series",
  "Start Sprinting Program (PepSpeed)",
  "CGM Experiment (tracking & analysis)",
  "Einstein Human Body Kit (Day 4→25, every other day)",
  "Blood and Guts experiments (build into schedule)",
  "Anthony + Compass 3D Design (Blender)",
  "Smoothie experiments for Anthony",
  "Schedule blood work (reminder Mar 4)",
  "Schedule DEXA scan (end of March)",
  "California Science Center field trip",
];

export function ProjectsThisMonth() {
  const [projects, setProjects] = useState(
    defaultProjects.map((text) => ({ text, completed: false }))
  );
  const [newProject, setNewProject] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggle = (index: number) => {
    const updated = [...projects];
    updated[index].completed = !updated[index].completed;
    setProjects(updated);
  };

  const handleAdd = () => {
    if (newProject.trim()) {
      setProjects([...projects, { text: newProject, completed: false }]);
      setNewProject("");
      setShowAddForm(false);
    }
  };

  const handleDelete = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          <CardTitle>Projects This Month</CardTitle>
        </div>
        <CardDescription>March deliverables & milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {projects.map((project, i) => (
            <div
              key={i}
              className="flex items-start gap-2 group hover:bg-accent/50 p-2 rounded transition-colors"
            >
              <Checkbox
                checked={project.completed}
                onCheckedChange={() => handleToggle(i)}
                className="mt-0.5"
              />
              <span
                className={`flex-1 text-sm ${
                  project.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {project.text}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="New project..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} size="sm">
              Add
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewProject("");
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
