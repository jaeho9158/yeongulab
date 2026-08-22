import type { Metadata } from "next";
import { getAllStages } from "@/lib/guide";
import { PrintableChecklist } from "@/components/PrintableChecklist";

export const metadata: Metadata = {
  title: "인쇄용 진행 노트",
  robots: { index: false },
};

export default function GuidePrintPage() {
  const stages = getAllStages();
  return (
    <PrintableChecklist
      stages={stages.map((s) => ({
        order: s.order,
        slug: s.slug,
        title: s.title,
        checklist: s.checklist,
        selfCheck: s.selfCheck,
      }))}
    />
  );
}
