export default class Person {
  constructor(obj = {}) {
    this.idPerson = obj.idPerson || 0;
    this.idCustomer = obj.idCustomer || 0;
    this.familyName = obj.familyName || '';
    this.firstName = obj.firstName || '';
    this.role = obj.role || '';
    this.mobile = obj.mobile || '';
    this.office = obj.office || '';
    this.email = obj.email || '';
    this.street = obj.street || '';
    this.zip = obj.zip || '';
    this.city = obj.city || '';
    this.region = obj.region || '';
    this.country = obj.country || '';
    this.company = obj.company || '';
  }
}