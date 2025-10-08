export default class Report {
  constructor({
    idProject = 0,
    idCompany = 0,
    created = new Date(),
    lustUpdate = new Date(),
    address = '',
    company = '',
  } = {}) {
    this.idProject = idProject;
    this.idCompany = idCompany;
    this.created = created;
    this.lustUpdate = lustUpdate;
    this.address = address;
    this.company = company;
}
}