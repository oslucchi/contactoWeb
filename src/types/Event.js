export default class Event {
  constructor({
    idEvent = 0,
    idOwner = 0,
    idCompany = 0,
    idEventCategory = 0,
    idEventStatus = 0,
    idEventOutcome = 0,
    title = '',
    date = new Date(),
    duration = 0,
    description = '',
    statusIconName = '',
    outcomeIconName = '',
    typeIconName = '',
    company = '',
    participants = [],
  } = {}) {
    this.idEvent = idEvent;
    this.idOwner = idOwner;
    this.idCompany = idCompany;
    this.idEventCategory = idEventCategory;
    this.idEventStatus = idEventStatus;
    this.idEventOutcome = idEventOutcome;
    this.title = title;
    this.date = date;
    this.duration = duration;
    this.description = description;
    this.statusIconName = statusIconName;
    this.outcomeIconName = outcomeIconName;
    this.typeIconName = typeIconName;
    this.company = company;
    this.participants = participants;
  }
}