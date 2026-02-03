import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Image, Pencil, Trash2, ToggleLeft, ToggleRight, Plus, ExternalLink, Pin, ChevronLeft, ChevronRight } from "lucide-react";

type Task = { 
  id: string; 
  title: string; 
  description?: string | null; 
  points: number; 
  is_active: boolean; 
  category: string; 
  task_url?: string | null;
  icon?: string | null;
  is_pinned?: boolean;
  pin_order?: number;
};

interface AdminTaskManagementProps {
  tasks: Task[];
  onTasksUpdate: () => void;
}

const CATEGORIES = ['social', 'mining', 'referral', 'general'];
const TASKS_PER_PAGE = 10;

const AdminTaskManagement: React.FC<AdminTaskManagementProps> = ({ tasks, onTasksUpdate }) => {
  const [newTask, setNewTask] = useState({
    title: '',
    task_url: '',
    icon: '',
    points: '',
    category: 'social'
  });
  const [showPinManager, setShowPinManager] = useState(false);
  const [pinPage, setPinPage] = useState(0);

  const addTask = async () => {
    if (!newTask.title) return toast.error("Please enter task title");
    if (!newTask.task_url) return toast.error("Please enter task URL");
    
    const { error } = await supabase.from("bolt_tasks" as any).insert({
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
    const { error } = await supabase.from("bolt_tasks" as any).update(patch).eq("id", id);
    if (error) return toast.error("Failed to update task");
    toast.success("Task updated");
    onTasksUpdate();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    const { error } = await supabase.from("bolt_tasks" as any).delete().eq("id", id);
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

  const togglePin = async (task: Task) => {
    const newPinned = !task.is_pinned;
    const pinnedCount = tasks.filter(t => t.is_pinned).length;
    const newOrder = newPinned ? pinnedCount + 1 : 0;
    
    const { error } = await supabase
      .from("bolt_tasks" as any)
      .update({ is_pinned: newPinned, pin_order: newOrder })
      .eq("id", task.id);
    
    if (error) return toast.error("Failed to update pin status");
    toast.success(newPinned ? "Task pinned" : "Task unpinned");
    onTasksUpdate();
  };

  // Pagination for pin manager
  const totalPages = Math.ceil(tasks.length / TASKS_PER_PAGE);
  const paginatedTasks = tasks.slice(pinPage * TASKS_PER_PAGE, (pinPage + 1) * TASKS_PER_PAGE);
  const pinnedTasks = tasks.filter(t => t.is_pinned).sort((a, b) => (a.pin_order || 0) - (b.pin_order || 0));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">Task Management</div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showPinManager ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowPinManager(!showPinManager)}
              className="gap-2"
            >
              <Pin className="w-4 h-4" />
              Pin Tasks ({pinnedTasks.length})
            </Button>
            <Badge variant="secondary">{tasks.length} tasks</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pin Manager Section */}
        {showPinManager && (
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Pin className="w-4 h-4 text-primary" />
                Select Tasks to Pin
              </div>
              <div className="text-xs text-muted-foreground">
                Pinned tasks appear at top of task list
              </div>
            </div>
            
            {/* Currently Pinned */}
            {pinnedTasks.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Currently Pinned:</p>
                <div className="flex flex-wrap gap-2">
                  {pinnedTasks.map(task => (
                    <Badge 
                      key={task.id} 
                      variant="default" 
                      className="cursor-pointer gap-1"
                      onClick={() => togglePin(task)}
                    >
                      {task.title}
                      <span className="text-[10px] opacity-70">✕</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Task Selection Grid */}
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {paginatedTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => togglePin(task)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    task.is_pinned 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    task.is_pinned ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {task.is_pinned && <Pin className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {task.icon ? (
                      <img src={task.icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">+{task.points} BOLT</p>
                  </div>
                  
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {task.category}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pinPage === 0}
                  onClick={() => setPinPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {pinPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pinPage >= totalPages - 1}
                  onClick={() => setPinPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

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
              } ${task.is_pinned ? 'ring-2 ring-primary/30' : ''}`}
            >
              {/* Pin Indicator */}
              {task.is_pinned && (
                <Pin className="w-4 h-4 text-primary shrink-0" />
              )}

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
                  onClick={() => togglePin(task)}
                  title={task.is_pinned ? "Unpin" : "Pin"}
                >
                  <Pin className={`w-4 h-4 ${task.is_pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                </Button>
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
