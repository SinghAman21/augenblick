import { AppLayout } from "@/components/app/AppLayout";
import { AIPoweredSection } from "@/components/landing/AIPoweredSection";

export default function AIPage() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
        <p className="text-muted-foreground mb-8">Use AI to supercharge your brainstorming.</p>
        <AIPoweredSection />
      </div>
    </AppLayout>
  );
}
