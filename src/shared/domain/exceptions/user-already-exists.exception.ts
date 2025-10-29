export class UserAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`Usuário com email ${email} já está cadastrado`);
    this.name = 'UserAlreadyExistsException';
  }
}
