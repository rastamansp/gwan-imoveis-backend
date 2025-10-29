export class InsufficientPermissionsException extends Error {
  constructor(message: string = 'User does not have permission to perform this action') {
    super(message);
    this.name = 'InsufficientPermissionsException';
  }
}
