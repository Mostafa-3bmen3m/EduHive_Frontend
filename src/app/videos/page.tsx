"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Loader2,
    Youtube,
    Clock,
    BookOpen,
    Brain,
    CheckCircle2,
    XCircle,
    Maximize2,
    Minimize2,
    Play,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface TimelineQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface Timeline {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    explanation: string;
    questions: TimelineQuestion[];
    order: number;
}

interface VideoData {
    id: string;
    filename: string;
    path: string;
    summary: string | null;
    createdAt: string;
    timelines: Timeline[];
}

export default function VideosPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [videos, setVideos] = useState<VideoData[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [answers, setAnswers] = useState<Record<string, number | null>>({});
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const res = await api.get("/videos");
            setVideos(res.data.videos || []);
        } catch {
            console.error("Failed to fetch videos");
        } finally {
            setLoadingVideos(false);
        }
    };

    const handleProcess = async () => {
        if (!url) return;
        setLoading(true);
        try {
            const res = await api.post("/videos/process", { url });
            const newVideo: VideoData = {
                id: res.data.file.id,
                filename: res.data.file.filename,
                path: res.data.file.path,
                summary: res.data.file.summary,
                createdAt: res.data.file.createdAt,
                timelines: res.data.timelines,
            };
            setVideos((prev) => [newVideo, ...prev]);
            setSelectedVideo(newVideo);
            setUrl("");
            toast.success("Video analyzed successfully!");
        } catch (error) {
            toast.error("Failed to process video. Please try again. error: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (questionKey: string, optionIndex: number) => {
        if (revealed[questionKey]) return;
        setAnswers((prev) => ({ ...prev, [questionKey]: optionIndex }));
    };

    const handleRevealAnswer = (questionKey: string) => {
        setRevealed((prev) => ({ ...prev, [questionKey]: true }));
    };

    const openVideoDetail = (video: VideoData) => {
        setSelectedVideo(video);
        setAnswers({});
        setRevealed({});
    };

    const getYoutubeThumbnail = (videoUrl: string) => {
        const match = videoUrl.match(
            /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
        );
        return match
            ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
            : null;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Video Analysis</h1>
                <p className="text-muted-foreground">
                    Paste a YouTube link to generate detailed timelines, explanations, and quizzes.
                </p>
            </div>

            {/* URL Input Card */}
            <Card className="border-dashed">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="url">YouTube URL</Label>
                            <Input
                                id="url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleProcess()}
                                disabled={loading}
                            />
                        </div>
                        <Button
                            onClick={handleProcess}
                            disabled={!url || loading}
                            className="mt-auto min-w-[140px]"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Youtube className="mr-2 h-4 w-4" />
                            )}
                            {loading ? "Analyzing..." : "Analyze"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Analyzing Loader */}
            {loading && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-12 flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold">AI is analyzing your video...</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Extracting transcript, identifying key topics, building timelines, and generating quiz questions. This may take a moment.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Video History Grid */}
            {!loadingVideos && videos.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Videos</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {videos.map((video) => {
                            const thumb = getYoutubeThumbnail(video.path);
                            return (
                                <Card
                                    key={video.id}
                                    className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 group overflow-hidden"
                                    onClick={() => openVideoDetail(video)}
                                >
                                    {/* Thumbnail */}
                                    {thumb && (
                                        <div className="relative w-full aspect-video bg-muted overflow-hidden">
                                            <img
                                                src={thumb}
                                                alt={video.filename}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                            </div>
                                        </div>
                                    )}
                                    <CardContent className="p-4 space-y-2">
                                        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
                                            {video.filename}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(video.createdAt)}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-xs">
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                {video.timelines.length} sections
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                <Brain className="h-3 w-3 mr-1" />
                                                {video.timelines.reduce(
                                                    (sum, t) => sum + (t.questions?.length || 0),
                                                    0
                                                )}{" "}
                                                questions
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {!loadingVideos && videos.length === 0 && !loading && (
                <Card className="border-dashed">
                    <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                        <Youtube className="h-12 w-12 text-muted-foreground/40" />
                        <h3 className="text-lg font-semibold text-muted-foreground">No videos yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Paste a YouTube link above to start analyzing videos. The AI will break
                            them down into timelines with explanations and quizzes.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Detail Modal ─────────────────────────────────────────── */}
            <Dialog
                open={!!selectedVideo}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedVideo(null);
                        setIsFullscreen(false);
                    }
                }}
            >
                <DialogContent
                    showCloseButton={false}
                    className={`${isFullscreen
                        ? "max-w-[100vw]! w-screen! h-screen! rounded-none! translate-x-[-50%]! translate-y-[-50%]!"
                        : "max-w-5xl! w-[95vw]! max-h-[90vh]!"
                        } flex flex-col overflow-hidden p-0 gap-0 transition-all duration-300`}
                >
                    {selectedVideo && (
                        <>
                            {/* Modal Header */}
                            <div className="flex items-start justify-between p-6 pb-4 border-b shrink-0">
                                <DialogHeader className="flex-1 pr-4">
                                    <DialogTitle className="text-xl leading-snug">
                                        {selectedVideo.filename}
                                    </DialogTitle>
                                    <DialogDescription className="line-clamp-2">
                                        {selectedVideo.summary || "Video analysis"}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setIsFullscreen(!isFullscreen)}
                                    >
                                        {isFullscreen ? (
                                            <Minimize2 className="h-4 w-4" />
                                        ) : (
                                            <Maximize2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                            setSelectedVideo(null);
                                            setIsFullscreen(false);
                                        }}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <ScrollArea className="flex-1 overflow-auto">
                                <div className="p-6 space-y-6">
                                    <Tabs defaultValue="timeline" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 mb-6">
                                            <TabsTrigger value="timeline">
                                                <Clock className="h-4 w-4 mr-2" />
                                                Timeline
                                            </TabsTrigger>
                                            <TabsTrigger value="quiz">
                                                <Brain className="h-4 w-4 mr-2" />
                                                Quiz
                                            </TabsTrigger>
                                            <TabsTrigger value="summary">
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                Summary
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* ── Timeline Tab ──────────────────────────── */}
                                        <TabsContent value="timeline" className="space-y-4">
                                            {selectedVideo.timelines.map((tl, idx) => (
                                                <Card key={tl.id} className="overflow-hidden">
                                                    <CardHeader className="pb-3 bg-muted/30">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="font-mono text-xs"
                                                                >
                                                                    {tl.startTime} – {tl.endTime}
                                                                </Badge>
                                                                {tl.title}
                                                            </CardTitle>
                                                            <Badge variant="secondary" className="text-xs">
                                                                Part {idx + 1}
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-4 space-y-4">
                                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                                            {tl.explanation}
                                                        </p>
                                                        {tl.questions.length > 0 && (
                                                            <div className="space-y-3 pt-2 border-t">
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                                    Quick Check
                                                                </p>
                                                                {tl.questions.map((q, qIdx) => {
                                                                    const key = `${tl.id}-${qIdx}`;
                                                                    const selected = answers[key];
                                                                    const isRevealed = revealed[key];
                                                                    return (
                                                                        <div key={qIdx} className="space-y-2">
                                                                            <p className="text-sm font-medium">
                                                                                {qIdx + 1}. {q.question}
                                                                            </p>
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                {q.options.map((opt, oIdx) => {
                                                                                    let cls =
                                                                                        "p-2.5 rounded-md text-sm border cursor-pointer transition-all hover:border-primary/50";
                                                                                    if (
                                                                                        isRevealed &&
                                                                                        oIdx === q.correctAnswer
                                                                                    ) {
                                                                                        cls =
                                                                                            "p-2.5 rounded-md text-sm border bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700";
                                                                                    } else if (
                                                                                        isRevealed &&
                                                                                        selected === oIdx &&
                                                                                        oIdx !== q.correctAnswer
                                                                                    ) {
                                                                                        cls =
                                                                                            "p-2.5 rounded-md text-sm border bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700";
                                                                                    } else if (selected === oIdx) {
                                                                                        cls =
                                                                                            "p-2.5 rounded-md text-sm border border-primary bg-primary/5";
                                                                                    }
                                                                                    return (
                                                                                        <div
                                                                                            key={oIdx}
                                                                                            className={cls}
                                                                                            onClick={() =>
                                                                                                handleSelectAnswer(
                                                                                                    key,
                                                                                                    oIdx
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <span className="flex items-center gap-2">
                                                                                                {isRevealed &&
                                                                                                    oIdx ===
                                                                                                    q.correctAnswer && (
                                                                                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                                                                                    )}
                                                                                                {isRevealed &&
                                                                                                    selected ===
                                                                                                    oIdx &&
                                                                                                    oIdx !==
                                                                                                    q.correctAnswer && (
                                                                                                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                                                                                    )}
                                                                                                {opt}
                                                                                            </span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            {selected !== null &&
                                                                                selected !== undefined &&
                                                                                !isRevealed && (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() =>
                                                                                            handleRevealAnswer(key)
                                                                                        }
                                                                                    >
                                                                                        Check Answer
                                                                                    </Button>
                                                                                )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </TabsContent>

                                        {/* ── Quiz Tab (All questions) ────────────── */}
                                        <TabsContent value="quiz" className="space-y-6">
                                            {selectedVideo.timelines.map((tl) =>
                                                tl.questions.map((q, qIdx) => {
                                                    const key = `quiz-${tl.id}-${qIdx}`;
                                                    const selected = answers[key];
                                                    const isRevealed = revealed[key];
                                                    return (
                                                        <Card key={key}>
                                                            <CardContent className="pt-6 space-y-3">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Badge variant="outline" className="text-xs font-mono">
                                                                        {tl.startTime}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {tl.title}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-medium">{q.question}</p>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {q.options.map((opt, oIdx) => {
                                                                        let cls =
                                                                            "p-3 rounded-md text-sm border cursor-pointer transition-all hover:border-primary/50";
                                                                        if (isRevealed && oIdx === q.correctAnswer) {
                                                                            cls =
                                                                                "p-3 rounded-md text-sm border bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700";
                                                                        } else if (
                                                                            isRevealed &&
                                                                            selected === oIdx &&
                                                                            oIdx !== q.correctAnswer
                                                                        ) {
                                                                            cls =
                                                                                "p-3 rounded-md text-sm border bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700";
                                                                        } else if (selected === oIdx) {
                                                                            cls =
                                                                                "p-3 rounded-md text-sm border border-primary bg-primary/5";
                                                                        }
                                                                        return (
                                                                            <div
                                                                                key={oIdx}
                                                                                className={cls}
                                                                                onClick={() =>
                                                                                    handleSelectAnswer(key, oIdx)
                                                                                }
                                                                            >
                                                                                <span className="flex items-center gap-2">
                                                                                    {isRevealed &&
                                                                                        oIdx === q.correctAnswer && (
                                                                                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                                                                        )}
                                                                                    {isRevealed &&
                                                                                        selected === oIdx &&
                                                                                        oIdx !== q.correctAnswer && (
                                                                                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                                                                        )}
                                                                                    {opt}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {selected !== null &&
                                                                    selected !== undefined &&
                                                                    !isRevealed && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleRevealAnswer(key)}
                                                                        >
                                                                            Check Answer
                                                                        </Button>
                                                                    )}
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })
                                            )}
                                        </TabsContent>

                                        {/* ── Summary Tab ────────────────────────── */}
                                        <TabsContent value="summary" className="space-y-4">
                                            {selectedVideo.summary && (
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">Overview</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-sm leading-relaxed">
                                                            {selectedVideo.summary}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            )}
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Section Breakdowns
                                                </h3>
                                                {selectedVideo.timelines.map((tl, idx) => (
                                                    <Card key={tl.id}>
                                                        <CardContent className="pt-4 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="font-mono text-xs">
                                                                    {tl.startTime} – {tl.endTime}
                                                                </Badge>
                                                                <span className="text-sm font-semibold">
                                                                    {tl.title}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                                {tl.explanation}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
