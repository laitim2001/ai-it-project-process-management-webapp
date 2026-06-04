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

/** CHANGE-047: 指定用戶顯示資料 */
export interface ApprovalUser {
  id: string;
  name: string | null;
  email: string;
}

export interface ApprovalStepData {
  id: string;
  workflowId: string;
  sequence: number;
  // CHANGE-047: 審批者為角色或指定用戶二選一（一有一無）
  approverRoleId: number | null;
  approverUserId: string | null;
  name: string | null;
  role: ApprovalRole | null;
  approverUser: ApprovalUser | null;
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
