import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Image, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, ExternalLink } from "lucide-react";

type Task = { 
  id: string; 
  title: string; 
  description?: string | null; 
  points: number; 
  is_active: boolean; 
  category: string; 
  task_url?: string | null;
  icon?: string | null;
};

interface AdminTaskManagementProps {
  tasks: Task[];
  onTasksUpdate: () => void;
}

const CATEGORIES = ['social', 'mining', 'referral', 'general'];

const AdminTaskManagement: React.FC<AdminTaskManagementProps> = ({ tasks, onTasksUpdate }) => {
  const [newTask, setNewTask] = useState({
    title: '',
    task_url: '',
    icon: '',
    points: '',
    category: 'social'
  });

  const addTask = async () => {
    if (!newTask.title) return toast.error("Please enter task title");
    if (!newTask.task_url) return toast.error("Please enter task URL");
    
    const { error } = await supabase.from("bolt_tasks").insert({
      title: newTask.title,
      task_url: newTask.task_url || null,
      icon: newTask.icon || null,
      points: Number(newTask.points) || 100,
      is_active: true,
      category: newTask.category || "social"
    });
    
    if (error) return toast.error("Failed to add task");
    toast.success("Task added successfully");
    setNewTask({ title: '', task_url: '', icon: '', points: '', category: 'social' });
    onTasksUpdate();
  };

  const updateTask = async (id: string, patch: Partial<Task>) => {
    const { error } = await supabase.from("bolt_tasks").update(patch).eq("id", id);
    if (error) return toast.error("Failed to update task");
    toast.success("Task updated");
    onTasksUpdate();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    const { error } = await supabase.from("bolt_tasks").delete().eq("id", id);
    if (error) return toast.error("Failed to delete task");
    toast.success("Task deleted");
    onTasksUpdate();
  };

  const editTask = (task: Task) => {
    const newTitle = prompt("Task title:", task.title);
    if (newTitle === null) return;
    
    const newPoints = prompt("Points:", String(task.points));
    if (newPoints === null) return;
    
    const newUrl = prompt("Task URL:", task.task_url || '');
    if (newUrl === null) return;
    
    const newIcon = prompt("Image URL:", task.icon || '');
    if (newIcon === null) return;
    
    const newCategory = prompt("Category (social/mining/referral/general):", task.category);
    if (newCategory === null) return;
    
    updateTask(task.id, { 
      title: newTitle || task.title, 
      points: Number(newPoints) || task.points,
      task_url: newUrl || null,
      icon: newIcon || null,
      category: newCategory || task.category
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">Task Management</div>
          <Badge variant="secondary">{tasks.length} tasks</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Task Form */}
        <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Plus className="w-4 h-4" />
            Add New Task
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input 
              placeholder="Task Title *" 
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              className="text-sm"
            />
            <Input 
              placeholder="Task URL *" 
              value={newTask.task_url}
              onChange={(e) => setNewTask(prev => ({ ...prev, task_url: e.target.value }))}
              className="text-sm"
            />
            <Input 
              placeholder="Image URL (optional)" 
              value={newTask.icon}
              onChange={(e) => setNewTask(prev => ({ ...prev, icon: e.target.value }))}
              className="text-sm"
            />
            <Input 
              placeholder="Points" 
              type="number"
              value={newTask.points}
              onChange={(e) => setNewTask(prev => ({ ...prev, points: e.target.value }))}
              className="text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={newTask.category}
              onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
              className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <Button onClick={addTask} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`flex items-center gap-3 p-4 border rounded-xl transition-all ${
                task.is_active 
                  ? 'bg-card border-border hover:border-primary/30' 
                  : 'bg-muted/30 border-border/50 opacity-60'
              }`}
            >
              {/* Task Image */}
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {task.icon ? (
                  <img 
                    src={task.icon} 
                    alt={task.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Image className={`w-5 h-5 text-muted-foreground ${task.icon ? 'hidden' : ''}`} />
              </div>

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground truncate">{task.title}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {task.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">+{task.points} BOLT</span>
                  {task.task_url && (
                    <a 
                      href={task.task_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary truncate max-w-[150px]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {task.task_url}
                    </a>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <Badge variant={task.is_active ? "default" : "secondary"} className="shrink-0">
                {task.is_active ? "Active" : "Inactive"}
              </Badge>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateTask(task.id, { is_active: !task.is_active })}
                  title={task.is_active ? "Deactivate" : "Activate"}
                >
                  {task.is_active ? (
                    <ToggleRight className="w-4 h-4 text-primary" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => editTask(task)}
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteTask(task.id)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No tasks yet. Add your first task above.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTaskManagement;
