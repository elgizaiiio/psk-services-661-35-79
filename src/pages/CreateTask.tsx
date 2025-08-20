import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Link, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateTask = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    task_url: "",
    image_url: "",
    points: 100,
    category: "main",
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    
    if (!formData.task_url.trim()) {
      toast.error("Please enter a task URL");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.from("tasks").insert({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        task_url: formData.task_url.trim(),
        image_url: formData.image_url.trim() || null,
        points: formData.points,
        category: formData.category,
        is_active: formData.is_active
      });

      if (error) throw error;

      toast.success("Task created successfully!");
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        task_url: "",
        image_url: "",
        points: 100,
        category: "main",
        is_active: true
      });
      
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <main className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <Helmet>
        <title>Create New Task – Add Tasks with Links | Viral Mining</title>
        <meta name="description" content="Create new tasks for users with custom links, points, and categories. Manage your task system efficiently." />
        <link rel="canonical" href={`${window.location.origin}/create-task`} />
      </Helmet>

      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <p className="text-muted-foreground">Add a new task with a link for users to complete</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Task Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Task Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title..."
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_url" className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4" />
                Task URL *
              </Label>
              <Input
                id="task_url"
                type="url"
                value={formData.task_url}
                onChange={(e) => handleInputChange("task_url", e.target.value)}
                placeholder="https://example.com/task-link"
                required
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                This is the link users will visit to complete the task
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe what users need to do..."
                rows={3}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points" className="text-sm font-medium">
                  Points Reward
                </Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => handleInputChange("points", parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="partners">Partners</SelectItem>
                    <SelectItem value="viral">Viral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-sm font-medium">
                Image URL (Optional)
              </Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange("image_url", e.target.value)}
                placeholder="https://example.com/task-image.jpg"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Optional image to display with the task
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="is_active" className="text-sm font-medium">
                  Active Task
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable this task to be visible to users
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Task"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default CreateTask;