export default class Project {
  constructor({
    idProject = 0,
    idCompany = 0,
    name = '',
    created = new Date(),
    lastUpdate = new Date(),
    active = false,
    address = '',
    city = '',
    region = '',
    country = '',
    description = '',
    company = '',
  } = {}) {
    this.idProject = idProject;
    this.idCompany = idCompany;
    this.name = name;
    this.created = created;
    this.lastUpdate = lastUpdate;
    this.active = active;
    this.address = address;
    this.city = city;
    this.region = region;
    this.country = country;
    this.description = description;
    this.company = company;
  }
}