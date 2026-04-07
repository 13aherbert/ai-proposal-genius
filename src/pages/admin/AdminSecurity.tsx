import { SecurityDashboard } from "@/components/organization/SecurityDashboard";
import { AuditLogger } from "@/components/organization/AuditLogger";
import { MFAEnforcementSettings } from "@/components/organization/MFAEnforcementSettings";
import { SSOConfigPanel } from "@/components/organization/SSOConfigPanel";

export default function AdminSecurity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security & Audit</h1>
        <p className="text-muted-foreground">Monitor security posture, configure MFA/SSO, and review audit logs.</p>
      </div>
      <MFAEnforcementSettings />
      <SSOConfigPanel />
      <SecurityDashboard />
      <AuditLogger />
    </div>
  );
}
