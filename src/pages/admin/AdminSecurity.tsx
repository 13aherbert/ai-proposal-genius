import { SecurityDashboard } from "@/components/organization/SecurityDashboard";
import { AuditLogger } from "@/components/organization/AuditLogger";

export default function AdminSecurity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Audit</h1>
        <p className="text-muted-foreground">Monitor security posture and review audit logs.</p>
      </div>
      <SecurityDashboard />
      <AuditLogger />
    </div>
  );
}
