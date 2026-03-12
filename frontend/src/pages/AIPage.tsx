import { AppLayout } from "@/components/app/AppLayout";
import { AIPoweredSection } from "@/components/landing/AIPoweredSection";

export default function AIPage() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-display">AI Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-8">Generate ideas, expand concepts, and summarize sessions.</p>
        <AIPoweredSection />
      </div>
    </AppLayout>
  );
}
