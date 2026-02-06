import { Player } from '@/components/PlayerMain';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function Home() {
  return (
    <ErrorBoundary name="Player">
      <Player />
    </ErrorBoundary>
  );
}
