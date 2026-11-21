import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkerTask } from '@/types/workerTask';
import { formatDistanceToNow } from 'date-fns';

export function TaskCard({ task }: { task: WorkerTask }) {
  const statusColors: Record<string, string> = {
    assigned: 'bg-[#B4BBA5] text-[#30352D]',
    acknowledged: 'bg-[#788568] text-white',
    'in-progress': 'bg-[#536247] text-white',
    submitted: 'bg-[#3E4B37] text-white',
    completed: 'bg-[#30352D] text-white',
    rejected: 'bg-[#E5E8DF] text-[#30352D]',
  };

  return (
    <Link href={`/worker/tasks/${task.id}`} className="block">
      <Card className="h-full hover:shadow-md transition-shadow border-[#E5E8DF]">
        <CardHeader className="p-4">
          <CardTitle className="text-md font-medium" style={{ color: '#30352D' }}>{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col gap-2 text-sm" style={{ color: '#74796F' }}>
            <div>{task.category}</div>
            <div>{task.priority ?? 'Normal'}</div>
            <Badge className={statusColors[task.status] ?? ''}>{task.status.replace('-', ' ')}</Badge>
            <div className="text-xs" style={{ color: '#74796F' }}>
              {formatDistanceToNow(task.assignmentDate?.toDate ? task.assignmentDate.toDate() : new Date(), { addSuffix: true })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
