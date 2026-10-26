"use client";

import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Youtube,
  Calendar,
  Target,
  Clock,
  BookOpen,
  Coffee,
  Zap,
  Sparkles,
  ArrowRight,
  Timer,
  Sun,
  Moon,
  Sunset,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

interface Session {
  startTime: string;
  endTime: string;
  task: string;
  type: string;
  description: string;
}

interface TodayPlan {
  goalId: string;
  goalTitle: string;
  priority: string;
  date: string;
  dayNumber: number;
  dayTitle: string;
  tip: string;
  sessions: Session[];
  totalStudyMinutes: number;
}

interface TodayData {
  date: string;
  goals: number;
  plans: TodayPlan[];
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    files: 0,
    plans: 0,
    videos: 0,
  });
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loadingToday, setLoadingToday] = useState(true);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);

    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    const fetchTodayPlan = async () => {
      try {
        setLoadingToday(true);
        const res = await api.get("/goals/today");
        setTodayData(res.data);
      } catch (error) {
        console.error("Failed to fetch today's plan", error);
      } finally {
        setLoadingToday(false);
      }
    };

    fetchStats();
    fetchTodayPlan();

    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    if (!currentTime) return { text: "Welcome", icon: <Sun className="h-6 w-6 text-amber-500" /> };
    const hour = currentTime.getHours();
    if (hour < 12) return { text: "Good morning", icon: <Sun className="h-6 w-6 text-amber-500" /> };
    if (hour < 17) return { text: "Good afternoon", icon: <Sunset className="h-6 w-6 text-orange-500" /> };
    return { text: "Good evening", icon: <Moon className="h-6 w-6 text-indigo-500" /> };
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

  const getCurrentSession = () => {
    if (!todayData?.plans || !currentTime) return null;
    const currentTimeStr = `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}`;

    for (const plan of todayData.plans) {
      for (const session of plan.sessions || []) {
        if (session.startTime <= currentTimeStr && session.endTime > currentTimeStr) {
          return { ...session, goalTitle: plan.goalTitle };
        }
      }
    }
    return null;
  };

  const getNextSession = () => {
    if (!todayData?.plans || !currentTime) return null;
    const currentTimeStr = `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}`;

    let next: (Session & { goalTitle: string }) | null = null;
    for (const plan of todayData.plans) {
      for (const session of plan.sessions || []) {
        if (session.startTime > currentTimeStr && session.type === "study") {
          if (!next || session.startTime < next.startTime) {
            next = { ...session, goalTitle: plan.goalTitle };
          }
        }
      }
    }
    return next;
  };

  const getTotalStudyMinutes = () => {
    if (!todayData?.plans) return 0;
    return todayData.plans.reduce(
      (sum, plan) => sum + (plan.totalStudyMinutes || 0),
      0
    );
  };

  const greeting = getGreeting();
  const currentSession = getCurrentSession();
  const nextSession = getNextSession();
  const totalStudyMinutes = getTotalStudyMinutes();
  const totalStudyHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {greeting.icon}
          <h1 className="text-3xl font-bold tracking-tight">
            {greeting.text}, {user?.name || "Student"}!
          </h1>
        </div>
        <p className="text-muted-foreground">
          {todayData?.plans && todayData.plans.length > 0
            ? `You have ${todayData.plans.length} active plan${todayData.plans.length > 1 ? "s" : ""} for today. Let's stay on track!`
            : "Here's an overview of your study progress."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Study Materials
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.files}</div>
            <p className="text-xs text-muted-foreground">PDFs processed</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Goals
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayData?.goals || 0}</div>
            <p className="text-xs text-muted-foreground">Goals in progress</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Study
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Timer className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStudyHours}h {remainingMins > 0 ? `${remainingMins}m` : ""}
            </div>
            <p className="text-xs text-muted-foreground">
              Planned study time
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Video Lessons
            </CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Youtube className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.videos}</div>
            <p className="text-xs text-muted-foreground">Videos analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Current / Next Session Highlight */}
      {(currentSession || nextSession) && (
        <div className="grid gap-4 md:grid-cols-2">
          {currentSession && (
            <Card className="border-blue-500/30 bg-linear-to-br from-blue-500/5 to-indigo-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                    Now
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    {getSessionIcon(currentSession.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{currentSession.task}</h3>
                    <p className="text-xs text-muted-foreground">
                      {currentSession.startTime} - {currentSession.endTime} •{" "}
                      {(currentSession as any).goalTitle}
                    </p>
                    {currentSession.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentSession.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {nextSession && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Up Next
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {getSessionIcon(nextSession.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{nextSession.task}</h3>
                    <p className="text-xs text-muted-foreground">
                      {nextSession.startTime} - {nextSession.endTime} •{" "}
                      {nextSession.goalTitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Today's Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>
              {todayData?.date
                ? new Date(todayData.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Loading..."}
            </CardDescription>
          </div>
          <Link href="/schedule">
            <Button variant="outline" size="sm">
              Open Scheduler
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingToday ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Loading today&apos;s plan...
                </span>
              </div>
            </div>
          ) : todayData?.plans && todayData.plans.length > 0 ? (
            <div className="space-y-6">
              {todayData.plans.map((plan, pi) => (
                <div key={pi}>
                  {todayData.plans.length > 1 && (
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-blue-500" />
                      <h4 className="font-semibold text-sm">
                        {plan.goalTitle}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getPriorityColor(plan.priority)}`}
                      >
                        {plan.priority}
                      </Badge>
                    </div>
                  )}

                  {plan.tip && (
                    <div className="mb-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{plan.tip}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {plan.sessions?.map((session, si) => (
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

                  {pi < todayData.plans.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-1">No plans for today</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Create a goal with a timeline that includes today to see your
                AI-generated schedule here.
              </p>
              <Link href="/schedule">
                <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create a Goal
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
