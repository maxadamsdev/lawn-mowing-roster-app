export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
}

export interface Session {
  _id: string;
  date: string;
  userId?: string;
  confirmed: boolean;
  arrivalDay?: 'before' | 'primary' | 'after';
  arrivalTime?: string;
  needsAssistance: boolean;
}

export interface SessionWithUser extends Session {
  user?: User;
}

