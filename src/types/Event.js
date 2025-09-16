export default class Event {
  constructor({
    idEvent = 0,
    idOwner = 0,
    idCompany = 0,
    idEventCategory = 0,
    date = new Date(),
    duration = 0,
    description = '',
    company = '',
    iconName = '',
    participants = [],
  } = {}) {
    this.idEvent = idEvent;
    this.idOwner = idOwner;
    this.idCompany = idCompany;
    this.idEventCategory = idEventCategory;
    this.date = date;
    this.duration = duration;
    this.description = description;
    this.company = company;
    this.iconName = iconName;
    this.participants = participants;
  }
}