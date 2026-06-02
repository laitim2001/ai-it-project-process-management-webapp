/**
 * @fileoverview Approval Workflow 前端共用型別（FEAT-014）
 *
 * 對應 approvalWorkflow router 的回傳形態（list/getById）。獨立定義避免
 * 跨層耦合（比照 FEAT-015 project-expense/types.ts 做法）。
 *
 * @since FEAT-014 - 可配置序列審批流程
 */

export interface ApprovalRole {
  id: number;
  name: string;
}

export interface ApprovalStepData {
  id: string;
  workflowId: string;
  sequence: number;
  approverRoleId: number;
  name: string | null;
  role: ApprovalRole;
}

export interface ApprovalWorkflowData {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  steps: ApprovalStepData[];
  _count: { proposals: number };
  createdAt: string | Date;
  updatedAt: string | Date;
}
