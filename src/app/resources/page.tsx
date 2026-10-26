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
    Upload,
    Clock,
    BookOpen,
    Brain,
    CheckCircle2,
    XCircle,
    Maximize2,
    Minimize2,
    FileText,
    Sparkles,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface SectionQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface ResourceSection {
    id: string;
    title: string;
    explanation: string;
    questions: SectionQuestion[];
    order: number;
}

interface ResourceData {
    id: string;
    filename: string;
    path: string;
    summary: string | null;
    createdAt: string;
    resourceSections: ResourceSection[];
}

export default function ResourcesPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [resources, setResources] = useState<ResourceData[]>([]);
    const [selectedResource, setSelectedResource] = useState<ResourceData | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loadingResources, setLoadingResources] = useState(true);
    const [answers, setAnswers] = useState<Record<string, number | null>>({});
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await api.get("/resources");
            setResources(res.data || []);
        } catch {
            console.error("Failed to fetch resources");
        } finally {
            setLoadingResources(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/resources/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const newRes: ResourceData = {
                id: res.data.file.id,
                filename: res.data.file.filename,
                path: res.data.file.path,
                summary: res.data.file.summary,
                createdAt: res.data.file.createdAt,
                resourceSections: res.data.sections,
            };
            setResources((prev) => [newRes, ...prev]);
            setSelectedResource(newRes);
            setFile(null); // clear input state
            // Optionally clear the html input element value here via ref
            toast.success("Document analyzed successfully!");
        } catch (error: any) {
            const backendDetails = error.response?.data?.details || error.response?.data?.error;
            const errMsg = backendDetails ? backendDetails : (error.message || String(error));
            console.error("Resource error:", error.response?.data || error);
            toast.error("Failed to process document: " + errMsg);
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

    const openResourceDetail = (resource: ResourceData) => {
        setSelectedResource(resource);
        setAnswers({});
        setRevealed({});
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
                <h1 className="text-3xl font-bold tracking-tight">Resource Analysis</h1>
                <p className="text-muted-foreground">
                    Upload documents to generate structurally broken down lessons, explanations, and quizzes based on the content.
                </p>
            </div>

            {/* Upload Input Card */}
            <Card className="border-dashed">
                <CardContent className="pt-6">
                    <div className="flex gap-4 items-end">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="pdf">Upload Document (PDF)</Label>
                            <Input
                                id="pdf"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </div>
                        <Button
                            onClick={handleProcess}
                            disabled={!file || loading}
                            className="mt-auto min-w-[140px]"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
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
                            <h3 className="text-lg font-semibold">AI is analyzing your document...</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Extracting text, identifying key lessons/units, and generating quiz questions. This may take a moment.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* History Grid */}
            {!loadingResources && resources.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Resources</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources.map((res) => {
                            return (
                                <Card
                                    key={res.id}
                                    className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 group overflow-hidden"
                                    onClick={() => openResourceDetail(res)}
                                >
                                    <div className="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 transition-colors">
                                        <FileText className="h-12 w-12 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <CardContent className="p-4 space-y-2">
                                        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
                                            {res.filename}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(res.createdAt)}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-xs">
                                                <BookOpen className="h-3 w-3 mr-1" />
                                                {res.resourceSections?.length || 0} sections
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                <Brain className="h-3 w-3 mr-1" />
                                                {res.resourceSections?.reduce(
                                                    (sum, s) => sum + (s.questions?.length || 0),
                                                    0
                                                ) || 0}{" "}
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

            {!loadingResources && resources.length === 0 && !loading && (
                <Card className="border-dashed">
                    <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                        <h3 className="text-lg font-semibold text-muted-foreground">No resources yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Upload a PDF document above to start analyzing. The AI will break
                            it down into lessons with explanations and quizzes.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ── Detail Modal ─────────────────────────────────────────── */}
            <Dialog
                open={!!selectedResource}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedResource(null);
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
                    {selectedResource && (
                        <>
                            {/* Modal Header */}
                            <div className="flex items-start justify-between p-6 pb-4 border-b shrink-0">
                                <DialogHeader className="flex-1 pr-4">
                                    <DialogTitle className="text-xl leading-snug">
                                        {selectedResource.filename}
                                    </DialogTitle>
                                    <DialogDescription className="line-clamp-2">
                                        {selectedResource.summary || "Document analysis"}
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
                                            setSelectedResource(null);
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
                                    <Tabs defaultValue="sections" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 mb-6">
                                            <TabsTrigger value="sections">
                                                <Layers className="h-4 w-4 mr-2" />
                                                Lessons
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

                                        {/* ── Sections Tab ──────────────────────────── */}
                                        <TabsContent value="sections" className="space-y-4">
                                            {selectedResource.resourceSections?.map((section, idx) => (
                                                <Card key={section.id || idx} className="overflow-hidden">
                                                    <CardHeader className="pb-3 bg-muted/30">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="font-mono text-xs"
                                                                >
                                                                    Section {idx + 1}
                                                                </Badge>
                                                                {section.title}
                                                            </CardTitle>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-4 space-y-4">
                                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                                            {section.explanation}
                                                        </p>
                                                        {section.questions?.length > 0 && (
                                                            <div className="space-y-3 pt-2 border-t">
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                                    Quick Check
                                                                </p>
                                                                {section.questions.map((q, qIdx) => {
                                                                    const key = `${section.id || idx}-${qIdx}`;
                                                                    const selected = answers[key];
                                                                    const isRevealed = revealed[key];
                                                                    return (
                                                                        <div key={key} className="space-y-2">
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
                                                                                            onClick={() => handleSelectAnswer(key, oIdx)}
                                                                                        >
                                                                                            <span className="font-medium mr-2 text-muted-foreground">
                                                                                                {String.fromCharCode(65 + oIdx)}.
                                                                                            </span>
                                                                                            {opt}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            {selected !== undefined && !isRevealed && (
                                                                                <Button
                                                                                    variant="secondary"
                                                                                    size="sm"
                                                                                    className="mt-2"
                                                                                    onClick={() => handleRevealAnswer(key)}
                                                                                >
                                                                                    Check Answer
                                                                                </Button>
                                                                            )}
                                                                            {isRevealed && (
                                                                                <div className="flex items-center gap-2 mt-2 pt-1 border-t">
                                                                                    {selected === q.correctAnswer ? (
                                                                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Correct
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge variant="destructive">
                                                                                            <XCircle className="w-3 h-3 mr-1" /> Incorrect
                                                                                        </Badge>
                                                                                    )}
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        Correct Answer: {String.fromCharCode(65 + q.correctAnswer)}
                                                                                    </span>
                                                                                </div>
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

                                        {/* ── Quiz Tab (All questions combined) ─────────────── */}
                                        <TabsContent value="quiz">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Comprehensive Quiz</CardTitle>
                                                    <DialogDescription>
                                                        Test your knowledge across all sections of this document.
                                                    </DialogDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-8">
                                                    {selectedResource.resourceSections?.flatMap(s => s.questions || []).map((q, allIdx) => {
                                                        const key = `all-${allIdx}`;
                                                        const selected = answers[key];
                                                        const isRevealed = revealed[key];
                                                        return (
                                                            <div key={key} className="space-y-4">
                                                                <p className="font-medium leading-relaxed">
                                                                    {allIdx + 1}. {q.question}
                                                                </p>
                                                                <div className="flex flex-col gap-2 pl-4">
                                                                    {q.options.map((opt, oIdx) => {
                                                                        let cls =
                                                                            "p-3 rounded-md text-sm border cursor-pointer transition-all hover:bg-muted/50";
                                                                        if (
                                                                            isRevealed &&
                                                                            oIdx === q.correctAnswer
                                                                        ) {
                                                                            cls =
                                                                                "p-3 rounded-md text-sm border bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700 shadow-sm";
                                                                        } else if (
                                                                            isRevealed &&
                                                                            selected === oIdx &&
                                                                            oIdx !== q.correctAnswer
                                                                        ) {
                                                                            cls =
                                                                                "p-3 rounded-md text-sm border bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700";
                                                                        } else if (selected === oIdx) {
                                                                            cls =
                                                                                "p-3 rounded-md text-sm border border-primary bg-primary/5 shadow-sm";
                                                                        }
                                                                        return (
                                                                            <div
                                                                                key={oIdx}
                                                                                className={cls}
                                                                                onClick={() => handleSelectAnswer(key, oIdx)}
                                                                            >
                                                                                <span className="font-semibold text-muted-foreground mr-3 inline-block w-4">
                                                                                    {String.fromCharCode(65 + oIdx)}.
                                                                                </span>
                                                                                {opt}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {selected !== undefined && !isRevealed && (
                                                                    <div className="pl-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => handleRevealAnswer(key)}
                                                                        >
                                                                            Check Answer
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* ── Summary Tab ──────────────────────────────── */}
                                        <TabsContent value="summary">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Document Summary</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                                                        {selectedResource.summary ||
                                                            "No summary was generated for this document."}
                                                    </p>
                                                </CardContent>
                                            </Card>
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
