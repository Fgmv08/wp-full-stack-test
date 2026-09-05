export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idType: string;   // CC | NIT
  idNumber: string;
  createdAt: Date;
}
