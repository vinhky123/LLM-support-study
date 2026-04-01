import type { SummaryDomain } from "../../types";

const DOMAIN_STYLES: Record<string, string> = {
  ingestion: "border-l-blue-500",
  store: "border-l-green-500",
  operations: "border-l-purple-500",
  security: "border-l-orange-500",
};

interface Props {
  summary: SummaryDomain[];
}

export default function SummaryTableView({ summary }: Props) {
  if (summary.length === 0) return null;

  return (
    <div className="space-y-6">
      {summary.map((domain) => (
        <div
          key={domain.domainId}
          className={`bg-white rounded-xl border border-border shadow-sm overflow-hidden
                      border-l-4 ${DOMAIN_STYLES[domain.domainId] ?? "border-l-gray-400"}`}
        >
          <div className="px-5 py-3 border-b border-border bg-surface-alt">
            <h3 className="font-semibold text-sm">{domain.domain}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-alt text-text-secondary text-xs">
                  <th className="text-left px-4 py-2 w-36">Service</th>
                  <th className="text-left px-4 py-2 w-48">Purpose</th>
                  <th className="text-left px-4 py-2">Key Points</th>
                  <th className="text-left px-4 py-2 w-56">Exam Tips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {domain.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-alt/50">
                    <td className="px-4 py-2.5 font-medium text-primary">
                      {item.service}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {item.purpose}
                    </td>
                    <td className="px-4 py-2.5">
                      <ul className="list-disc list-inside space-y-0.5">
                        {item.keyPoints.map((point, i) => (
                          <li key={i} className="text-xs">{point}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-2.5">
                      {item.examTips.map((tip, i) => (
                        <p
                          key={i}
                          className="text-xs text-aws-orange font-medium"
                        >
                          {tip}
                        </p>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
