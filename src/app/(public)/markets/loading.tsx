import { Container } from "@/components/layout/container";
import { LoadingState } from "@/components/shared/loading-state";

export default function MarketsLoading() {
  return (
    <main className="pb-10">
      <Container className="space-y-6 py-8">
        <div className="h-10 w-48 animate-pulse-soft rounded-md bg-muted" />
        <LoadingState rows={6} />
      </Container>
    </main>
  );
}
