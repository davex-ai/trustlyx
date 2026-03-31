export interface UserAdapter {
  findByEmail(email: string, tenantId: string): Promise<any>;
  create(user: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
}