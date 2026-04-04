import { Link, useParams } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export function Lesson() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-muted-foreground text-sm">Lesson {id} — coming soon</p>
      </main>
    </div>
  );
}

export default Lesson;
