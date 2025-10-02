/**
 * Authentication utilities
 * Currently using mock auth, will be replaced with Azure AD B2C
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  roleId: number;
  role?: {
    id: number;
    name: string;
  };
}

export interface Session {
  user: User;
}

// Mock session for development
export const getMockSession = (): Session => {
  return {
    user: {
      id: 'mock-user-1',
      email: 'manager@itpm.local',
      name: 'John Manager',
      roleId: 1, // ProjectManager
      role: {
        id: 1,
        name: 'ProjectManager',
      },
    },
  };
};

// Mock supervisor session
export const getMockSupervisorSession = (): Session => {
  return {
    user: {
      id: 'mock-user-2',
      email: 'supervisor@itpm.local',
      name: 'Jane Supervisor',
      roleId: 2, // Supervisor
      role: {
        id: 2,
        name: 'Supervisor',
      },
    },
  };
};

export const authConfig = {
  // Placeholder for NextAuth configuration
};
