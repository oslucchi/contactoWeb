export default class Report {
  constructor({
    idReport = 0,
    idReporter = 0,
    idEvent = 0,
    idCompany = 0,
    idAgent = 0,
    date = new Date(),
    report = '',
    summary = '',
    archived = false,
  } = {}) {
    this.idReport = idReport;
    this.idReporter = idReporter; 
    this.idEvent = idEvent;
    this.idCompany = idCompany;
    this.idAgent = idAgent;
    this.date = date;
    this.summary = summary;
    this.report = report;
    this.archived = archived;
}
}