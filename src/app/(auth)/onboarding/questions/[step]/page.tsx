
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const questions = [
    {
        title: "Business Overview",
        description: "What is the core mission and primary activity of your business?",
        placeholder: "e.g., We are a cafe that serves locally sourced coffee and pastries..."
    },
    {
        title: "Supply Chain",
        description: "Describe where and how you source your primary materials or products.",
        placeholder: "e.g., Our coffee beans are imported from South America, and our milk is from local farms..."
    },
    {
        title: "Operations & Energy",
        description: "How does your business operate day-to-day? What are your main uses of energy?",
        placeholder: "e.g., We operate a physical store with standard lighting, refrigeration, and coffee machines..."
    },
    {
        title: "Waste Management",
        description: "What kind of waste does your business produce, and how do you currently dispose of it?",
        placeholder: "e.g., We generate coffee grounds, food waste, and plastic/paper packaging, which go into general waste..."
    },
    {
        title: "Community & Social Impact",
        description: "How does your business interact with the local community and its employees?",
        placeholder: "e.g., We employ local staff and participate in neighborhood events..."
    }
];

export default function OnboardingQuestionPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    const step = parseInt(params.step as string, 10);
    const [answers, setAnswers] = useState<string[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        try {
            const savedAnswers = JSON.parse(localStorage.getItem('onboardingAnswers') || '[]');
            setAnswers(savedAnswers);
            if (savedAnswers[step - 1]) {
                setCurrentAnswer(savedAnswers[step - 1]);
            }
        } catch (error) {
            console.error("Failed to load answers from localStorage", error);
        }
    }, [step]);
    
    const handleNext = () => {
        if (currentAnswer.trim().length < 10) {
            toast({
                title: "Please be more specific",
                description: "Your answer should be at least 10 characters long.",
                variant: "destructive"
            });
            return;
        }

        const newAnswers = [...answers];
        newAnswers[step - 1] = currentAnswer;
        try {
            localStorage.setItem('onboardingAnswers', JSON.stringify(newAnswers));
        } catch (error) {
            console.error("Failed to save answers to localStorage", error);
            toast({
                title: "Could not save progress",
                description: "There was an issue saving your answer.",
                variant: "destructive"
            });
            return;
        }
        router.push(`/onboarding/questions/${step + 1}`);
    };

    const handlePrevious = () => {
        router.back();
    };

    const handleFinish = async () => {
        if (currentAnswer.trim().length < 10) {
             toast({
                title: "Please be more specific",
                description: "Your answer should be at least 10 characters long.",
                variant: "destructive"
            });
            return;
        }

        setIsAnalyzing(true);
        const finalAnswers = [...answers];
        finalAnswers[step - 1] = currentAnswer;

        // In a real scenario, you would send these answers to an AI flow.
        // For now, we'll just concatenate them into the businessPractices string.
        const businessPractices = finalAnswers.join('\n\n');

        try {
            localStorage.setItem('businessPractices', businessPractices);
            localStorage.removeItem('onboardingAnswers'); // Clean up
            
            toast({
                title: "Profile Created!",
                description: "Your answers have been analyzed to build your sustainability profile."
            });
            
            // Redirect to the main app
            router.push('/dashboard');
        } catch (error) {
             console.error("Failed to save business practices", error);
             toast({
                title: "Error",
                description: "Could not finalize your profile.",
                variant: "destructive"
            });
            setIsAnalyzing(false);
        }
    };
    
    if (isNaN(step) || step < 1 || step > questions.length) {
        return <div>Invalid step</div>;
    }

    const question = questions[step - 1];
    const progress = (step / questions.length) * 100;

    return (
        <div className="w-full">
            <Progress value={progress} className="mb-6" />
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{`Step ${step}: ${question.title}`}</CardTitle>
                    <CardDescription>{question.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Label htmlFor={`question-${step}`} className="sr-only">{question.title}</Label>
                        <Textarea
                            id={`question-${step}`}
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder={question.placeholder}
                            rows={8}
                            disabled={isAnalyzing}
                        />
                        <div className="flex justify-between items-center">
                            {step > 1 ? (
                                <Button variant="outline" onClick={handlePrevious} disabled={isAnalyzing}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>
                            ) : <div></div>}

                            {step < questions.length ? (
                                <Button onClick={handleNext}>
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleFinish} disabled={isAnalyzing}>
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" /> Finish & Analyze
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
