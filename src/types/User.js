export default class User {
  constructor({
    idUser = 0,
    familyName = '',
    firstName = '',
    login = '',
    email = '',
    isActive = true,
    lastLogin = null,
    roles = []
  } = {}) {
    this.idUser = idUser;
    this.familyName = familyName;
    this.firstName = firstName;
    this.login = login;
    this.email = email;
    this.isActive = isActive;
    this.lastLogin = lastLogin ? new Date(lastLogin) : null;
    this.roles = roles;
  }

  get fullName() {
    return `${this.firstName} ${this.familyName}`.trim();
  }

  get displayName() {
    return this.fullName || this.login;
  }
}
