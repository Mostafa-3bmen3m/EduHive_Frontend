"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Calendar as CalendarIcon,
  Trash2,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Coffee,
  Zap,
  Trophy,
  ArrowRight,
  Eye,
  Pause,
  Play,
  CheckCircle2,
  X,
  AlertCircle,
  Timer,
  Brain,
  TrendingUp,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";

interface GoalTask {
  title: string;
  estimatedHours: number;
}

interface BusyTime {
  label: string;
  days: string;
  startTime: string;
  endTime: string;
}

interface Session {
  startTime: string;
  endTime: string;
  task: string;
  type: string;
  description: string;
}

interface DailyPlan {
  date: string;
  dayNumber: number;
  dayTitle: string;
  tip: string;
  sessions: Session[];
  totalStudyMinutes: number;
}

interface WeeklyOverview {
  week: number;
  focus: string;
  days: string[];
}

interface AIPlan {
  goalSummary: string;
  totalDays: number;
  totalHours: number;
  weeklyOverview: WeeklyOverview[];
  dailyPlans: DailyPlan[];
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  tasks: GoalTask[];
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  priority: string;
  status: string;
  aiPlan: AIPlan | null;
  createdAt: string;
}

export default function SchedulePage() {
  const [mounted, setMounted] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewingTab, setViewingTab] = useState("overview");

  // Create goal form state
  const [step, setStep] = useState(1);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [tasks, setTasks] = useState<GoalTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskHours, setNewTaskHours] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("2");
  const [priority, setPriority] = useState("medium");
  const [busyTimes, setBusyTimes] = useState<BusyTime[]>([]);
  const [newBusyLabel, setNewBusyLabel] = useState("");
  const [newBusyDays, setNewBusyDays] = useState("everyday");
  const [newBusyStart, setNewBusyStart] = useState("08:00");
  const [newBusyEnd, setNewBusyEnd] = useState("09:00");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    setStartDate(today.toISOString().split("T")[0]);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setEndDate(nextWeek.toISOString().split("T")[0]);
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoadingGoals(true);
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch (error) {
      console.error("Failed to fetch goals", error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([
        ...tasks,
        {
          title: newTaskTitle.trim(),
          estimatedHours: parseFloat(newTaskHours) || 1,
        },
      ]);
      setNewTaskTitle("");
      setNewTaskHours("1");
    }
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const addBusyTime = () => {
    if (newBusyLabel.trim() && newBusyStart && newBusyEnd) {
      setBusyTimes([
        ...busyTimes,
        {
          label: newBusyLabel.trim(),
          days: newBusyDays,
          startTime: newBusyStart,
          endTime: newBusyEnd,
        },
      ]);
      setNewBusyLabel("");
      setNewBusyStart("08:00");
      setNewBusyEnd("09:00");
    }
  };

  const removeBusyTime = (index: number) => {
    setBusyTimes(busyTimes.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setStep(1);
    setGoalTitle("");
    setGoalDescription("");
    setTasks([]);
    setNewTaskTitle("");
    setNewTaskHours("1");
    const today = new Date();
    setStartDate(today.toISOString().split("T")[0]);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setEndDate(nextWeek.toISOString().split("T")[0]);
    setHoursPerDay("2");
    setPriority("medium");
    setBusyTimes([]);
    setNewBusyLabel("");
    setNewBusyDays("everyday");
    setNewBusyStart("08:00");
    setNewBusyEnd("09:00");
  };

  const handleCreateGoal = async () => {
    if (!goalTitle || tasks.length === 0) return;
    setCreating(true);
    try {
      const res = await api.post("/goals", {
        title: goalTitle,
        description: goalDescription || undefined,
        tasks,
        busyTimes: busyTimes.length > 0 ? busyTimes : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        hoursPerDay: parseFloat(hoursPerDay),
        priority,
      });
      toast.success("Goal created & AI schedule generated!");
      setShowCreateDialog(false);
      resetForm();
      await fetchGoals();
      setSelectedGoal(res.data);
      setViewingTab("overview");
      setSelectedDayIndex(0);
    } catch (error) {
      console.error("Failed to create goal", error);
      toast.error("Failed to create goal. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (goalId: string, status: string) => {
    try {
      await api.patch(`/goals/${goalId}/status`, { status });
      toast.success(`Goal ${status.toLowerCase()}`);
      await fetchGoals();
      if (selectedGoal?.id === goalId) {
        setSelectedGoal((prev) => (prev ? { ...prev, status } : null));
      }
    } catch {
      toast.error("Failed to update goal status");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await api.delete(`/goals/${goalId}`);
      toast.success("Goal deleted");
      if (selectedGoal?.id === goalId) setSelectedGoal(null);
      await fetchGoals();
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const getTotalEstimatedHours = () => {
    return tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  };

  const getAvailableDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return (
      Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
  };

  const getTotalAvailableHours = () => {
    return getAvailableDays() * parseFloat(hoursPerDay || "0");
  };

  const getGoalProgress = (goal: Goal) => {
    if (!goal.aiPlan?.dailyPlans) return 0;
    const today = new Date().toISOString().split("T")[0];
    const passedDays = goal.aiPlan.dailyPlans.filter(
      (dp) => dp.date < today
    ).length;
    return Math.round((passedDays / goal.aiPlan.dailyPlans.length) * 100);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "ACTIVE":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "PAUSED":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "CANCELLED":
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      default:
        return "";
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case "study":
        return <BookOpen className="h-4 w-4" />;
      case "break":
        return <Coffee className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getSessionColor = (type: string) => {
    switch (type) {
      case "study":
        return "border-l-blue-500 bg-blue-500/5";
      case "break":
        return "border-l-emerald-500 bg-emerald-500/5";
      default:
        return "border-l-purple-500 bg-purple-500/5";
    }
  };

  if (!mounted) return null;

  const canProceedStep1 = goalTitle.trim().length > 0;
  const canProceedStep2 = tasks.length > 0;
  const canProceedStep3 = startDate && endDate && parseFloat(hoursPerDay) > 0;
  const canProceedStep4 = true; // busy times are optional

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-500" />
            AI Scheduler
          </h1>
          <p className="text-muted-foreground">
            Set your goals, define your timeline — AI creates your perfect study
            plan.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
          className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-blue-500/40"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Goal
        </Button>
      </div>

      {/* Main Content - Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-12rem)]">
        {/* Goals List Panel */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Goals</h2>
            <Badge variant="outline" className="text-xs">
              {goals.length} total
            </Badge>
          </div>

          {loadingGoals ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : goals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-1">No goals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first goal and let AI plan it for you.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-3 pr-3">
                {goals.map((goal) => (
                  <Card
                    key={goal.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedGoal?.id === goal.id
                        ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/10"
                        : "hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                    onClick={() => {
                      setSelectedGoal(goal);
                      setSelectedDayIndex(0);
                      setViewingTab("overview");
                    }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                          {goal.title}
                        </h3>
                        <div className="flex gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${getPriorityColor(goal.priority)}`}
                          >
                            {goal.priority}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${getStatusColor(goal.status)}`}
                          >
                            {goal.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(goal.startDate), "MMM d")} -{" "}
                          {format(new Date(goal.endDate), "MMM d")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {goal.hoursPerDay}h/day
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-medium">
                            {getGoalProgress(goal)}%
                          </span>
                        </div>
                        <Progress
                          value={getGoalProgress(goal)}
                          className="h-1.5"
                        />
                      </div>

                      {goal.aiPlan && (
                        <div className="flex items-center gap-1 text-xs text-blue-500">
                          <Sparkles className="h-3 w-3" />
                          {goal.aiPlan.dailyPlans?.length || 0} days planned
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-8">
          {selectedGoal ? (
            <GoalDetailView
              goal={selectedGoal}
              selectedDayIndex={selectedDayIndex}
              setSelectedDayIndex={setSelectedDayIndex}
              viewingTab={viewingTab}
              setViewingTab={setViewingTab}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDeleteGoal}
              getSessionIcon={getSessionIcon}
              getSessionColor={getSessionColor}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              getGoalProgress={getGoalProgress}
            />
          ) : (
            <Card className="h-full min-h-[500px] flex items-center justify-center border-dashed">
              <CardContent className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Select a Goal
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Choose a goal from the list or create a new one to see your
                  AI-generated plan.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Goal Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Create AI-Powered Goal
            </DialogTitle>
            <DialogDescription>
              Define your goal and let AI build the perfect schedule.
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between px-2 py-4">
            {[
              { num: 1, label: "Goal Info" },
              { num: 2, label: "Tasks" },
              { num: 3, label: "Timeline" },
              { num: 4, label: "Busy Times" },
              { num: 5, label: "Review" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step >= s.num
                        ? "bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                    }`}
                  >
                    {step > s.num ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {s.label}
                  </span>
                </div>
                {i < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors duration-300 ${
                      step > s.num
                        ? "bg-blue-500"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Step 1: Goal Info */}
          {step === 1 && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Goal Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g., Master Calculus Chapter 5"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  placeholder="Describe what you want to achieve, any specific focus areas..."
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority Level</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      🟢 Low — Flexible timeline
                    </SelectItem>
                    <SelectItem value="medium">
                      🟡 Medium — Steady pace
                    </SelectItem>
                    <SelectItem value="high">
                      🔴 High — Urgent deadline
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Tasks */}
          {step === 2 && (
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Task name (e.g., Read section 5.1)"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Hrs"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(e.target.value)}
                    min="0.25"
                    step="0.25"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={addTask}
                  disabled={!newTaskTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">
                          {i + 1}
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            {task.title}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {task.estimatedHours}h
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeTask(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Add tasks to break down your goal
                    </div>
                  )}
                </div>
              </ScrollArea>

              {tasks.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <span className="text-sm text-muted-foreground">
                    Total estimated time:
                  </span>
                  <span className="font-bold text-blue-500">
                    {getTotalEstimatedHours()}h
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Timeline */}
          {step === 3 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Hours available per day
                </Label>
                <Select value={hoursPerDay} onValueChange={setHoursPerDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {h} {h === 1 ? "hour" : "hours"} per day
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {startDate && endDate && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {getAvailableDays()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Days
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
                    <div className="text-2xl font-bold text-emerald-500">
                      {getTotalAvailableHours()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Hours
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
                    <div
                      className={`text-2xl font-bold ${getTotalAvailableHours() >= getTotalEstimatedHours() ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {getTotalAvailableHours() >= getTotalEstimatedHours()
                        ? "✓"
                        : "!"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getTotalAvailableHours() >= getTotalEstimatedHours()
                        ? "Enough time"
                        : "Need more time"}
                    </div>
                  </div>
                </div>
              )}

              {getTotalAvailableHours() < getTotalEstimatedHours() && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-amber-600 dark:text-amber-400">
                    You have {getTotalAvailableHours()}h available but tasks
                    need {getTotalEstimatedHours()}h. Consider extending the
                    end date or increasing daily hours.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Busy Times */}
          {step === 4 && (
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm">
                <Ban className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-blue-600 dark:text-blue-400">
                  Add times when you&apos;re unavailable (classes, meals, sleep, commitments). This is <strong>optional</strong> but helps AI create a realistic schedule.
                </span>
              </div>

              <div className="space-y-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium">Activity Name</Label>
                    <Input
                      placeholder="e.g., Math Class, Lunch, Sleep..."
                      value={newBusyLabel}
                      onChange={(e) => setNewBusyLabel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Which Days</Label>
                    <Select value={newBusyDays} onValueChange={setNewBusyDays}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyday">Every day</SelectItem>
                        <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                        <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">From</Label>
                      <Input
                        type="time"
                        value={newBusyStart}
                        onChange={(e) => setNewBusyStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">To</Label>
                      <Input
                        type="time"
                        value={newBusyEnd}
                        onChange={(e) => setNewBusyEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={addBusyTime}
                  disabled={!newBusyLabel.trim()}
                  className="w-full"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Busy Time
                </Button>
              </div>

              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {busyTimes.map((bt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border bg-red-500/5 border-red-500/10 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <Ban className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{bt.label}</span>
                          <div className="text-xs text-muted-foreground">
                            {bt.days} • {bt.startTime} - {bt.endTime}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeBusyTime(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {busyTimes.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No busy times added. AI will schedule freely.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-linear-to-br from-blue-500/5 to-indigo-500/5 border space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-lg">{goalTitle}</h3>
                </div>
                {goalDescription && (
                  <p className="text-sm text-muted-foreground">
                    {goalDescription}
                  </p>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Priority</div>
                  <div className="font-medium capitalize">{priority}</div>
                  <div className="text-muted-foreground">Timeline</div>
                  <div className="font-medium">
                    {format(new Date(startDate), "MMM d")} →{" "}
                    {format(new Date(endDate), "MMM d, yyyy")}
                  </div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-medium">
                    {getAvailableDays()} days ({getTotalAvailableHours()}h)
                  </div>
                  <div className="text-muted-foreground">Daily Commitment</div>
                  <div className="font-medium">{hoursPerDay}h / day</div>
                  <div className="text-muted-foreground">Tasks</div>
                  <div className="font-medium">
                    {tasks.length} ({getTotalEstimatedHours()}h estimated)
                  </div>
                  <div className="text-muted-foreground">Busy Times</div>
                  <div className="font-medium">
                    {busyTimes.length} blocked slots
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tasks breakdown:</h4>
                {tasks.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-zinc-50 dark:bg-zinc-900"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    <span className="flex-1">{t.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {t.estimatedHours}h
                    </span>
                  </div>
                ))}
              </div>

              {busyTimes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Unavailable times:</h4>
                  {busyTimes.map((bt, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm p-2 rounded-md bg-red-500/5 border border-red-500/10"
                    >
                      <Ban className="h-3.5 w-3.5 text-red-500" />
                      <span className="flex-1">{bt.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {bt.days} • {bt.startTime}-{bt.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={creating}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div>
              {step < 5 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    (step === 3 && !canProceedStep3) ||
                    (step === 4 && !canProceedStep4)
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateGoal}
                  disabled={creating}
                  className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI is crafting your plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate AI Schedule
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Goal Detail View Component
function GoalDetailView({
  goal,
  selectedDayIndex,
  setSelectedDayIndex,
  viewingTab,
  setViewingTab,
  onStatusUpdate,
  onDelete,
  getSessionIcon,
  getSessionColor,
  getPriorityColor,
  getStatusColor,
  getGoalProgress,
}: {
  goal: Goal;
  selectedDayIndex: number;
  setSelectedDayIndex: (i: number) => void;
  viewingTab: string;
  setViewingTab: (t: string) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  getSessionIcon: (type: string) => React.ReactNode;
  getSessionColor: (type: string) => string;
  getPriorityColor: (p: string) => string;
  getStatusColor: (s: string) => string;
  getGoalProgress: (g: Goal) => number;
}) {
  const plan = goal.aiPlan;
  const dailyPlans = plan?.dailyPlans || [];
  const currentDay = dailyPlans[selectedDayIndex];
  const todayStr = new Date().toISOString().split("T")[0];
  const todayIndex = dailyPlans.findIndex((dp) => dp.date === todayStr);

  return (
    <div className="space-y-4">
      {/* Goal Header Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{goal.title}</h2>
                <Badge
                  variant="outline"
                  className={getPriorityColor(goal.priority)}
                >
                  {goal.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className={getStatusColor(goal.status)}
                >
                  {goal.status}
                </Badge>
              </div>
              {goal.description && (
                <p className="text-sm text-muted-foreground">
                  {goal.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {format(new Date(goal.startDate), "MMM d")} -{" "}
                  {format(new Date(goal.endDate), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {goal.hoursPerDay}h/day
                </span>
                {plan && (
                  <span className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" />
                    {plan.totalDays} days total
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {goal.status === "ACTIVE" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusUpdate(goal.id, "PAUSED")}
                    className="text-amber-500 hover:text-amber-600"
                  >
                    <Pause className="h-3.5 w-3.5 mr-1" />
                    Pause
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusUpdate(goal.id, "COMPLETED")}
                    className="text-emerald-500 hover:text-emerald-600"
                  >
                    <Trophy className="h-3.5 w-3.5 mr-1" />
                    Complete
                  </Button>
                </>
              )}
              {goal.status === "PAUSED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusUpdate(goal.id, "ACTIVE")}
                  className="text-blue-500 hover:text-blue-600"
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Resume
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{getGoalProgress(goal)}%</span>
            </div>
            <Progress value={getGoalProgress(goal)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Plan content */}
      {plan ? (
        <Tabs value={viewingTab} onValueChange={setViewingTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="flex items-center gap-1.5"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Daily Plans
            </TabsTrigger>
            {(plan.weeklyOverview?.length || 0) > 0 && (
              <TabsTrigger
                value="weekly"
                className="flex items-center gap-1.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Weekly View
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              {plan.goalSummary && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          AI Plan Summary
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {plan.goalSummary}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Today's plan quick access */}
              {todayIndex >= 0 && dailyPlans[todayIndex] && (
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Today&apos;s Plan — {dailyPlans[todayIndex].dayTitle}
                    </CardTitle>
                    {dailyPlans[todayIndex].tip && (
                      <CardDescription className="text-xs italic">
                        💡 {dailyPlans[todayIndex].tip}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    {dailyPlans[todayIndex].sessions?.map((session, si) => (
                      <div
                        key={si}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border-l-[3px] ${getSessionColor(session.type)}`}
                      >
                        <div className="shrink-0 text-muted-foreground">
                          {getSessionIcon(session.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {session.task}
                          </div>
                          {session.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {session.description}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono shrink-0">
                          {session.startTime} - {session.endTime}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-blue-500"
                      onClick={() => {
                        setSelectedDayIndex(todayIndex);
                        setViewingTab("daily");
                      }}
                    >
                      View Full Day Plan
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold bg-linear-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                      {plan.totalDays}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total Days
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold bg-linear-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                      {plan.totalHours}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total Hours
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold bg-linear-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {(goal.tasks as GoalTask[])?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tasks
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {goal.hoursPerDay}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Hrs/Day
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Daily Plans Tab */}
          <TabsContent value="daily" className="mt-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Day selector */}
              <div className="col-span-3">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 pr-2">
                    {dailyPlans.map((dp, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDayIndex(i)}
                        className={`w-full text-left p-2.5 rounded-lg text-sm transition-all duration-150 ${
                          selectedDayIndex === i
                            ? "bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400"
                            : dp.date === todayStr
                              ? "bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                        }`}
                      >
                        <div className="font-medium text-xs">Day {dp.dayNumber}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {dp.date}
                        </div>
                        {dp.date === todayStr && (
                          <Badge className="mt-1 text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20" variant="outline">
                            TODAY
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Day content */}
              <div className="col-span-9">
                {currentDay ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Day {currentDay.dayNumber}: {currentDay.dayTitle}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(currentDay.date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                            {currentDay.totalStudyMinutes && (
                              <span className="ml-2">
                                • {Math.round(currentDay.totalStudyMinutes / 60)}h{" "}
                                {currentDay.totalStudyMinutes % 60}m study time
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={selectedDayIndex === 0}
                            onClick={() =>
                              setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={selectedDayIndex === dailyPlans.length - 1}
                            onClick={() =>
                              setSelectedDayIndex(
                                Math.min(dailyPlans.length - 1, selectedDayIndex + 1)
                              )
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {currentDay.tip && (
                        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                          {currentDay.tip}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[370px]">
                        <div className="space-y-2 pr-3">
                          {currentDay.sessions?.map((session, si) => (
                            <div
                              key={si}
                              className={`flex items-start gap-3 p-3 rounded-lg border-l-[3px] transition-colors ${getSessionColor(session.type)}`}
                            >
                              <div className="shrink-0 mt-0.5 text-muted-foreground">
                                {getSessionIcon(session.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-sm">
                                    {session.task}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-mono shrink-0 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                    {session.startTime} - {session.endTime}
                                  </span>
                                </div>
                                {session.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {session.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Select a day to view
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Weekly View Tab */}
          <TabsContent value="weekly" className="mt-4">
            <div className="space-y-4">
              {plan.weeklyOverview?.map((week) => (
                <Card key={week.week}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                        W{week.week}
                      </div>
                      Week {week.week}
                    </CardTitle>
                    <CardDescription>{week.focus}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {week.days?.map((day, di) => (
                        <div
                          key={di}
                          className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm"
                        >
                          <span className="text-xs text-muted-foreground font-medium">
                            Day {di + 1}:
                          </span>{" "}
                          {day}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Plan Generation Failed
            </h3>
            <p className="text-sm text-muted-foreground">
              The AI couldn&apos;t generate a plan for this goal. Try creating a
              new goal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
