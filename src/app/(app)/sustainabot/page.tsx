
'use client';

import {
  generateSustainabilitySuggestions,
  type GenerateSustainabilitySuggestionsOutput,
} from '@/ai/flows/generate-sustainability-suggestions';
import {
  generateBusinessPlan,
  type GenerateBusinessPlanOutput,
} from '@/ai/flows/generate-business-plan';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Briefcase,
  CheckCircle,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  BarChart,
  Download,
  Save,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // For business plan table
import html2canvas from 'html2canvas';


type LoadingState = 'none' | 'suggestions' | 'plan';

export default function SustainabotPage() {
  const [businessPractices, setBusinessPractices] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>('none');
  const [suggestions, setSuggestions] =
    useState<GenerateSustainabilitySuggestionsOutput['suggestions'] | null>(null);
  const [businessPlan, setBusinessPlan] =
    useState<GenerateBusinessPlanOutput | null>(null);
  const { toast } = useToast();
  const [lastAnalyzedPractices, setLastAnalyzedPractices] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    try {
      const savedPractices = localStorage.getItem('businessPractices') || '';
      setBusinessPractices(savedPractices);
    } catch (error) {
      console.error('Failed to load business practices from local storage', error);
    }
  }, []);

  const preAnalysisCheck = () => {
    if (businessPractices.trim().length < 20) {
      toast({
        title: 'Input too short',
        description:
          'Please provide a more detailed description of your business practices (at least 20 characters).',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  }
  
  const handleGenerateSuggestions = async () => {
    if (!preAnalysisCheck()) return;

    if(businessPractices === lastAnalyzedPractices && suggestions) {
      toast({ title: 'Guidelines already generated', description: 'Showing previously generated guidelines for this description.' });
      return;
    }

    setLoadingState('suggestions');
    setSuggestions(null);
    setBusinessPlan(null);

    try {
      const result = await generateSustainabilitySuggestions({
        businessPractices,
      });
      setSuggestions(result.suggestions);
      setLastAnalyzedPractices(businessPractices);
      localStorage.setItem('businessPractices', businessPractices);
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      toast({
        title: 'Error Generating Suggestions',
        description:
          'SustainaBOT is currently unavailable. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingState('none');
    }
  };

  const handleGenerateBusinessPlan = async () => {
    if (!preAnalysisCheck()) return;

    if(businessPractices === lastAnalyzedPractices && businessPlan) {
      toast({ title: 'Business plan already generated', description: 'Showing previously generated plan for this description.' });
      return;
    }

    setLoadingState('plan');
    setSuggestions(null);
    setBusinessPlan(null);

    try {
      const result = await generateBusinessPlan({
        businessPractices,
      });
      setBusinessPlan(result);
      setLastAnalyzedPractices(businessPractices);
      localStorage.setItem('businessPractices', businessPractices);
    } catch (error) {
      console.error('AI business plan generation failed:', error);
      toast({
        title: 'Error Generating Business Plan',
        description:
          'SustainaBOT is currently unavailable. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoadingState('none');
    }
  };

  const handleSaveToDashboard = () => {
    if (!suggestions) return;
    try {
        const suggestionTitles = suggestions.map(s => s.title);
        localStorage.setItem('sustainabilityImprovements', JSON.stringify(suggestionTitles));
        toast({
            title: 'Guidelines Saved!',
            description: "Your new 'Ways to Improve' are now available on your dashboard."
        });
    } catch (error) {
        console.error('Failed to save suggestions to local storage', error);
        toast({
            title: 'Error',
            description: 'Could not save guidelines to your dashboard.',
            variant: 'destructive'
        });
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        let y = 15;

        const addText = (text: string, x: number, currentY: number, options: any) => {
            const splitText = doc.splitTextToSize(text, pageWidth - x * 2);
            let newY = currentY;
            splitText.forEach((line: string) => {
                if (newY > pageHeight - 15) {
                    doc.addPage();
                    newY = 15;
                }
                doc.text(line, x, newY, options);
                newY += 7;
            });
            return newY;
        };

        if (suggestions) {
            doc.text('Sustainability Guidelines', 15, y);
            y += 15;

            suggestions.forEach(suggestion => {
                if (y > pageHeight - 30) { doc.addPage(); y = 15; }
                doc.setFont(undefined, 'bold');
                y = addText(suggestion.title, 15, y, {});
                doc.setFont(undefined, 'normal');
                y += 2;

                suggestion.details.split('\n').filter(step => step.trim()).forEach(step => {
                    if (y > pageHeight - 15) { doc.addPage(); y = 15; }
                    y = addText(`• ${step}`, 20, y, {});
                });
                y += 5;
            });
            doc.save('Sustainability-Guidelines.pdf');

        } else if (businessPlan) {
            doc.text('Sustainable Business Plan', 15, y);
            y += 15;

            doc.setFont(undefined, 'bold');
            y = addText('Executive Summary', 15, y, {});
            doc.setFont(undefined, 'normal');
            y = addText(businessPlan.executiveSummary, 15, y, {});
            y += 10;
            
            doc.setFont(undefined, 'bold');
            y = addText('Key Initiatives', 15, y, {});
            doc.setFont(undefined, 'normal');
            businessPlan.keyInitiatives.forEach(initiative => {
                 if (y > pageHeight - 30) { doc.addPage(); y = 15; }
                 doc.setFont(undefined, 'bold');
                 y = addText(initiative.title, 15, y, {});
                 doc.setFont(undefined, 'normal');
                 y = addText(initiative.description, 20, y, {});
                 y += 5;
            });

            if (y > pageHeight - 60) { doc.addPage(); y = 15; }
            doc.setFont(undefined, 'bold');
            doc.text('12-Month Projections', 15, y);
            y += 10;
            
            (doc as any).autoTable({
                startY: y,
                head: [['Month', 'Revenue Growth (%)', 'Sustainability Score']],
                body: businessPlan.projections.map(p => [p.month, p.revenueGrowthPercentage, p.sustainabilityScore]),
                didDrawPage: (data: any) => {
                    y = data.cursor.y + 10;
                }
            });

            if (chartRef.current) {
                const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
                const imgData = canvas.toDataURL('image/png');
                const imgProps= doc.getImageProperties(imgData);
                const pdfWidth = pageWidth - 30;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                if (y + pdfHeight > pageHeight - 15) {
                    doc.addPage();
                    y = 15;
                }
                
                doc.addImage(imgData, 'PNG', 15, y, pdfWidth, pdfHeight);
            }

            doc.save('Business-Plan.pdf');
        }
    } catch(error) {
        console.error('Failed to generate PDF', error);
        toast({
            title: 'Error Generating PDF',
            description: 'There was a problem creating the PDF file. Please try again.',
            variant: 'destructive'
        });
    } finally {
        setIsDownloading(false);
    }
  };


  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">{`Revenue Growth: ${payload[0].value}%`}</p>
          <p className="text-sm text-accent">{`Score: ${payload[1].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const isLoading = loadingState !== 'none';
  const isResultVisible = suggestions || businessPlan;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot /> SustainaBOT
        </h1>
        <p className="text-muted-foreground">
          Your AI-powered sustainability consultant.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analyze Your Business</CardTitle>
          <CardDescription>
            Describe your current business practices, and our AI will provide
            tailored sustainability improvements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="business-practices" className="sr-only">
                Business Practices
              </Label>
              <Textarea
                id="business-practices"
                placeholder="e.g., We are a coffee shop using single-use cups. Our beans are sourced internationally. We dispose of coffee grounds in general waste..."
                value={businessPractices}
                onChange={(e) => setBusinessPractices(e.target.value)}
                rows={6}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerateSuggestions}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {loadingState === 'suggestions' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Guidelines
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerateBusinessPlan}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {loadingState === 'plan' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Generate Business Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div ref={reportRef}>
        {(loadingState === 'suggestions' || suggestions) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb /> AI Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingState === 'suggestions' ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-5/6" />
                </div>
              ) : suggestions && suggestions.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {suggestions.map((suggestion, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="font-bold text-left">
                         {suggestion.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-3">
                          {suggestion.details.split('\n').filter(step => step.trim()).map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                                  <CheckCircle className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                                  <span className="text-muted-foreground">{step}</span>
                              </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : null}
            </CardContent>
          </Card>
        )}

         {(loadingState === 'plan' || businessPlan) && (
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase /> Business Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 {loadingState === 'plan' ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-6 w-1/3 mt-4" />
                     <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                 ) : businessPlan ? (
                  <>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><FileText size={18} />Executive Summary</h3>
                    <p className="text-muted-foreground text-sm">{businessPlan.executiveSummary}</p>
                  </div>
                  <div>
                     <h3 className="font-semibold mb-2">Key Initiatives</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {businessPlan.keyInitiatives.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger className="text-sm font-bold">{item.title}</AccordionTrigger>
                          <AccordionContent>
                            <p className="whitespace-pre-wrap text-muted-foreground text-sm">{item.description}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                  </>
                 ) : null}
              </CardContent>
            </Card>
             <Card className="lg:col-span-2">
               <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart size={24} />12-Month Projections</CardTitle>
              </CardHeader>
              <CardContent>
                 {loadingState === 'plan' ? (
                  <Skeleton className="h-[300px] w-full" />
                 ) : businessPlan ? (
                  <div ref={chartRef}>
                   <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={businessPlan.projections}>
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenueGrowthPercentage" fill="hsl(var(--primary))" name="Revenue Growth" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="sustainabilityScore" fill="hsl(var(--accent))" name="Sustainability Score" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                  </div>
                 ) : null}
              </CardContent>
             </Card>
          </div>
        )}
      </div>

       {isResultVisible && !isLoading && (
        <div className="flex flex-wrap gap-2 justify-end">
            {suggestions && (
                 <Button onClick={handleSaveToDashboard} variant="outline">
                    <Save className="mr-2 h-4 w-4" />
                    Save to Dashboard
                </Button>
            )}
            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
                 {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download as PDF
                  </>
                )}
            </Button>
        </div>
      )}

    </div>
  );
}

    