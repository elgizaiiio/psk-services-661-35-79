import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Clock,
  Link as LinkIcon,
  Zap,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DailyTask {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  task_type: string;
  reward_tokens: number;
  required_action: string | null;
  action_url: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdminDailyTasksProps {
  tasks: DailyTask[];
  onTasksUpdate: () => Promise<void>;
}

const taskTypes = [
  { value: 'channel_join', label: 'Channel Join' },
  { value: 'app_open', label: 'App Open' },
  { value: 'social_follow', label: 'Social Follow' },
  { value: 'survey', label: 'Survey' },
  { value: 'mining', label: 'Mining' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const AdminDailyTasks: React.FC<AdminDailyTasksProps> = ({ tasks, onTasksUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    task_type: 'channel_join',
    reward_tokens: 100,
    action_url: '',
    icon: ''
  });

  const [editTask, setEditTask] = useState<Partial<DailyTask>>({});

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.title_ar) {
      toast.error('Title (EN & AR) required');
      return;
    }

    setLoading(true);
    try {
      console.log('Adding daily task:', newTask);
      
      const { data, error } = await supabase
        .from('bolt_daily_tasks')
        .insert({
          title: newTask.title,
          title_ar: newTask.title_ar,
          description: newTask.description || null,
          description_ar: newTask.description_ar || null,
          task_type: newTask.task_type,
          reward_tokens: newTask.reward_tokens,
          action_url: newTask.action_url || null,
          icon: newTask.icon || null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Add daily task error:', error);
        toast.error('Failed: ' + error.message);
        return;
      }

      console.log('Daily task added:', data);
      toast.success('Daily task added!');
      
      setNewTask({
        title: '',
        title_ar: '',
        description: '',
        description_ar: '',
        task_type: 'channel_join',
        reward_tokens: 100,
        action_url: '',
        icon: ''
      });
      setIsAdding(false);
      await onTasksUpdate();
    } catch (err) {
      console.error('Error adding daily task:', err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    if (!editTask.title || !editTask.title_ar) {
      toast.error('Title required');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating daily task:', taskId, editTask);
      
      const { error } = await supabase
        .from('bolt_daily_tasks')
        .update({
          title: editTask.title,
          title_ar: editTask.title_ar,
          description: editTask.description,
          description_ar: editTask.description_ar,
          task_type: editTask.task_type,
          reward_tokens: editTask.reward_tokens,
          action_url: editTask.action_url,
          icon: editTask.icon,
          is_active: editTask.is_active
        })
        .eq('id', taskId);

      if (error) {
        console.error('Update daily task error:', error);
        toast.error('Failed: ' + error.message);
        return;
      }

      toast.success('Task updated!');
      setEditingId(null);
      setEditTask({});
      await onTasksUpdate();
    } catch (err) {
      console.error('Error updating daily task:', err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    setLoading(true);
    try {
      console.log('Deleting daily task:', taskId);
      
      const { error } = await supabase
        .from('bolt_daily_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Delete daily task error:', error);
        toast.error('Failed: ' + error.message);
        return;
      }

      toast.success('Task deleted!');
      await onTasksUpdate();
    } catch (err) {
      console.error('Error deleting daily task:', err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (taskId: string, currentValue: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bolt_daily_tasks')
        .update({ is_active: !currentValue })
        .eq('id', taskId);

      if (error) {
        toast.error('Failed to toggle');
        return;
      }

      toast.success(currentValue ? 'Task disabled' : 'Task enabled');
      await onTasksUpdate();
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (task: DailyTask) => {
    setEditingId(task.id);
    setEditTask({ ...task });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Daily Tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tasks • {tasks.filter(t => t.is_active).length} active
          </p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Task'}
        </Button>
      </div>

      {/* Add New Task Form */}
      {isAdding && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Add New Daily Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title (EN)</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Join our channel"
                />
              </div>
              <div>
                <Label>Title (AR)</Label>
                <Input
                  value={newTask.title_ar}
                  onChange={(e) => setNewTask({ ...newTask, title_ar: e.target.value })}
                  placeholder="انضم لقناتنا"
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description (EN)</Label>
                <Input
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Description (AR)</Label>
                <Input
                  value={newTask.description_ar}
                  onChange={(e) => setNewTask({ ...newTask, description_ar: e.target.value })}
                  placeholder="وصف اختياري"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Task Type</Label>
                <Select value={newTask.task_type} onValueChange={(v) => setNewTask({ ...newTask, task_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reward (BOLT)</Label>
                <Input
                  type="number"
                  value={newTask.reward_tokens}
                  onChange={(e) => setNewTask({ ...newTask, reward_tokens: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Action URL</Label>
                <Input
                  value={newTask.action_url}
                  onChange={(e) => setNewTask({ ...newTask, action_url: e.target.value })}
                  placeholder="https://t.me/..."
                />
              </div>
            </div>

            <div>
              <Label>Icon URL (optional)</Label>
              <Input
                value={newTask.icon}
                onChange={(e) => setNewTask({ ...newTask, icon: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <Button onClick={handleAddTask} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Daily Task
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className={`transition-all ${!task.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              {editingId === task.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title (EN)</Label>
                      <Input
                        value={editTask.title || ''}
                        onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Title (AR)</Label>
                      <Input
                        value={editTask.title_ar || ''}
                        onChange={(e) => setEditTask({ ...editTask, title_ar: e.target.value })}
                        dir="rtl"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select value={editTask.task_type} onValueChange={(v) => setEditTask({ ...editTask, task_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taskTypes.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Reward</Label>
                      <Input
                        type="number"
                        value={editTask.reward_tokens || 0}
                        onChange={(e) => setEditTask({ ...editTask, reward_tokens: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={editTask.action_url || ''}
                        onChange={(e) => setEditTask({ ...editTask, action_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdateTask(task.id)} disabled={loading} className="flex-1">
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
                        {!task.is_active && <Badge variant="secondary">Disabled</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{task.title_ar}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {task.reward_tokens} BOLT
                        </span>
                        {task.action_url && (
                          <span className="flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            Has URL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={task.is_active}
                      onCheckedChange={() => handleToggleActive(task.id, task.is_active)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => startEditing(task)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {tasks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No daily tasks yet</p>
              <p className="text-sm">Click "Add Task" to create one</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDailyTasks;
