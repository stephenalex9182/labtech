import React, { useEffect, useState } from "react";
import { CheckCircle2, FileText, RotateCcw } from "lucide-react";
import { C, Card, EmptyState } from "../components/ui";
import { activityApi } from "../services/api";
import type { ActivityOut } from "../types";

const ICONS: Record<string, typeof CheckCircle2> = {
  MARKED_REVIEWED: CheckCircle2,
  REPORT_ASSIGNED: FileText,
  RETURNED_TO_QUEUE: RotateCcw,
  STARTED_REVIEW: FileText,
};

export default function MyActivity() {
  const [activities, setActivities] = useState<ActivityOut[]>([]);

  useEffect(() => {
    activityApi.mine().then(setActivities).catch(() => {});
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-8">
      <h1 className="text-xl font-bold mb-1" style={{ color: C.text }}>My Activity</h1>
      <p className="text-sm mb-6" style={{ color: C.subtext }}>Your recent report actions.</p>

      <Card className="overflow-hidden">
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" description="Actions you take on reports will show up here." />
        ) : (
          activities.map((a, i) => {
            const Icon = ICONS[a.action] || FileText;
            return (
              <div key={a.id} className="flex items-start gap-3 px-5 py-4" style={{ borderTop: i ? `1px solid ${C.border}` : "none" }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#EFF6FF" }}>
                  <Icon size={15} color={C.primary} />
                </div>
                <div className="flex-1">
                  <div className="text-sm" style={{ color: C.text }}>{a.description}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.subtext }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
