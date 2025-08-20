import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase, fixRLSPolicies } from "@/integrations/supabase/client";

type Task = { 
  id: string; 
  title: string; 
  image_url?: string | null; 
  points: number; 
  is_active: boolean; 
  category: string; 
  task_url?: string | null; 
};

interface AdminTaskManagementProps {
  tasks: Task[];
  onTasksUpdate: () => void;
}

const AdminTaskManagement: React.FC<AdminTaskManagementProps> = ({ tasks, onTasksUpdate }) => {
  const handleFixRLS = async () => {
    try {
      toast.info("إصلاح سياسات الأمان...");
      await fixRLSPolicies();
      toast.success("Security policies fixed successfully! You can now add tasks.");
      onTasksUpdate(); // Refresh tasks after fixing RLS
    } catch (error) {
      console.error('RLS fix error:', error);
      toast.error("Failed to fix security policies. Please try again.");
    }
  };

  // Auto-fix RLS on component mount
  React.useEffect(() => {
    handleFixRLS();
  }, []);

  const addTask = async (payload: Partial<Task>) => {
    const { error } = await supabase.from("tasks").insert({
      title: payload.title,
      task_url: payload.task_url || null,
      image_url: payload.image_url || null,
      points: payload.points || 0,
      is_active: true,
      category: payload.category || "main"
    });
    if (error) return toast.error("Failed to add task");
    toast.success("Task added successfully");
    onTasksUpdate();
  };

  const updateTask = async (id: string, patch: Partial<Task>) => {
    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) return toast.error("Failed to update task");
    toast.success("Task updated successfully");
    onTasksUpdate();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return toast.error("Failed to delete task");
    toast.success("Task deleted successfully");
    onTasksUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Task Management</div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleFixRLS}
              className="text-xs"
            >
              إصلاح سياسات الأمان
            </Button>
            <Badge variant="secondary">{tasks.length} tasks</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <Input placeholder="Title" id="task-title" className="text-sm" />
          <Input placeholder="Task URL *" id="task-url" className="text-sm" />
          <Input placeholder="Image URL" id="task-img" className="text-sm" />
          <Input placeholder="Points" id="task-points" type="number" className="text-sm" />
          <Input placeholder="Category (main/partners/viral)" id="task-category" className="text-sm" />
          <Button size="sm" onClick={() => {
            const title = (document.getElementById('task-title') as HTMLInputElement)?.value;
            const task_url = (document.getElementById('task-url') as HTMLInputElement)?.value;
            const image_url = (document.getElementById('task-img') as HTMLInputElement)?.value;
            const points = Number((document.getElementById('task-points') as HTMLInputElement)?.value || 0);
            const category = (document.getElementById('task-category') as HTMLInputElement)?.value || 'main';
            if (!title) return toast.error("Please enter task title");
            if (!task_url) return toast.error("Please enter task URL");
            addTask({ title, task_url, image_url, points, category });
            // Clear inputs
            (document.getElementById('task-title') as HTMLInputElement).value = '';
            (document.getElementById('task-url') as HTMLInputElement).value = '';
            (document.getElementById('task-img') as HTMLInputElement).value = '';
            (document.getElementById('task-points') as HTMLInputElement).value = '';
            (document.getElementById('task-category') as HTMLInputElement).value = '';
          }}>Add Task</Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1">
                <div className="font-semibold text-sm">{t.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Points: {t.points}</span>
                  <span>Category: {t.category}</span>
                  {t.task_url && <span>URL: {t.task_url.slice(0, 30)}...</span>}
                  {t.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => updateTask(t.id, { is_active: !t.is_active })}
                >
                  {t.is_active ? "Disable" : "Enable"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newTitle = prompt("New title", t.title) || t.title;
                    const newPoints = Number(prompt("New points", String(t.points)) || t.points);
                    updateTask(t.id, { title: newTitle, points: newPoints });
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this task?")) {
                      deleteTask(t.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTaskManagement;