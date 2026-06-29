/**
 * Thin wrappers that render the right badge for each enum value, pulling label
 * + tone from lib/leads/labels.
 */

import { StatusBadge } from "@/components/ui/status-badge";
import type {
  SurplusStatus,
  VerificationStatus,
  EvidenceLevel,
} from "@/types/enums";
import {
  SURPLUS_STATUS_LABELS,
  SURPLUS_STATUS_TONES,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_TONES,
  EVIDENCE_LEVEL_LABELS,
  EVIDENCE_LEVEL_SHORT,
  EVIDENCE_LEVEL_TONES,
} from "@/lib/leads/labels";

export function SurplusStatusBadge({ status }: { status: SurplusStatus }) {
  return (
    <StatusBadge tone={SURPLUS_STATUS_TONES[status]}>
      {SURPLUS_STATUS_LABELS[status]}
    </StatusBadge>
  );
}

export function VerificationStatusBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  return (
    <StatusBadge tone={VERIFICATION_STATUS_TONES[status]}>
      {VERIFICATION_STATUS_LABELS[status]}
    </StatusBadge>
  );
}

export function EvidenceLevelBadge({
  level,
  long = false,
}: {
  level: EvidenceLevel;
  long?: boolean;
}) {
  return (
    <StatusBadge tone={EVIDENCE_LEVEL_TONES[level]}>
      {long ? EVIDENCE_LEVEL_LABELS[level] : EVIDENCE_LEVEL_SHORT[level]}
    </StatusBadge>
  );
}
